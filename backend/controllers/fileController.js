const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const FileVersion = require('../models/FileVersion');
const Folder = require('../models/Folder');
const User = require('../models/User');
const Project = require('../models/Project');
const { createLog } = require('../middleware/activityLogger');

const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    cb(null, true); // Accept all file types
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 }, // 100MB per file
});

// Helper: compute MD5 checksum
const getChecksum = (filePath) => {
    const crypto = require('crypto');
    try {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('md5').update(content).digest('hex');
    } catch { return ''; }
};

// @desc  Upload file → POST /api/files/upload
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const { folderId, projectId, tags, expiresAt, changelog } = req.body;

        // Validate folder ownership/access; resolve isPrivate flag
        let folderIsPrivate = false;
        if (folderId) {
            const folder = await Folder.findById(folderId).populate('project', 'status expiryDate');
            if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });
            if (folder.isPrivate && folder.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                fs.unlinkSync(req.file.path); // Remove uploaded file
                return res.status(403).json({ success: false, message: 'Access denied to private folder.' });
            }
            // Block uploads to expired project folders (non-admins)
            if (req.user.role !== 'admin' && folder.project) {
                const proj = folder.project;
                const isExpired = proj.status === 'expired' || (proj.expiryDate && new Date(proj.expiryDate) < new Date());
                if (isExpired) {
                    fs.unlinkSync(req.file.path);
                    return res.status(403).json({ success: false, message: 'This project has expired. File uploads are not allowed.' });
                }
            }
            folderIsPrivate = folder.isPrivate;
        } else {
            // No folder selected — honour the explicit flag sent by the frontend
            folderIsPrivate = req.body.isPrivate === 'true' || req.body.isPrivate === true;
        }

        // Quota check
        const user = await User.findById(req.user._id);
        if (user.storageUsed + req.file.size > user.quota) {
            fs.unlinkSync(req.file.path);
            return res.status(413).json({
                success: false,
                message: `Storage quota exceeded. Remaining: ${((user.quota - user.storageUsed) / (1024 * 1024)).toFixed(1)}MB`,
            });
        }

        const checksum = getChecksum(req.file.path);
        const ext = path.extname(req.file.originalname).slice(1).toLowerCase();

        // Check if file with same name exists in folder (for versioning)
        const existingFile = await File.findOne({
            originalName: req.file.originalname,
            owner: req.user._id,
            folder: folderId || null,
            isDeleted: false,
        });

        let fileDoc;

        if (existingFile) {
            // Create new version of existing file
            const newVersion = existingFile.currentVersion + 1;

            await FileVersion.create({
                file: existingFile._id,
                versionNumber: newVersion,
                path: req.file.path,
                size: req.file.size,
                mimeType: req.file.mimetype,
                uploadedBy: req.user._id,
                changelog: changelog || `Version ${newVersion}`,
                checksum,
            });

            // Update size difference in quota
            const sizeDiff = req.file.size - existingFile.size;
            existingFile.path = req.file.path;
            existingFile.size = req.file.size;
            existingFile.currentVersion = newVersion;
            existingFile.checksum = checksum;
            existingFile.updatedAt = new Date();
            await existingFile.save();

            await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: sizeDiff } });
            fileDoc = existingFile;
        } else {
            // Create new file record
            fileDoc = await File.create({
                name: path.parse(req.file.originalname).name,
                originalName: req.file.originalname,
                path: req.file.path,
                size: req.file.size,
                mimeType: req.file.mimetype,
                extension: ext,
                owner: req.user._id,
                folder: folderId || null,
                isPrivate: folderIsPrivate,
                project: projectId || null,
                tags: tags ? tags.split(',').map(t => t.trim()) : [],
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                checksum,
                currentVersion: 1,
            });

            // Create version 1
            await FileVersion.create({
                file: fileDoc._id,
                versionNumber: 1,
                path: req.file.path,
                size: req.file.size,
                mimeType: req.file.mimetype,
                uploadedBy: req.user._id,
                changelog: changelog || 'Initial upload',
                checksum,
            });

            // Update user storage
            await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: req.file.size } });
        }

        await createLog({
            userId: req.user._id,
            action: 'upload',
            targetType: 'file',
            targetId: fileDoc._id,
            targetName: fileDoc.originalName,
            details: { size: req.file.size, mimeType: req.file.mimetype, folderId },
            req,
        });

        const populatedFile = await File.findById(fileDoc._id)
            .populate('owner', 'name empId')
            .populate('folder', 'name');

        res.status(201).json({ success: true, message: 'File uploaded successfully.', data: populatedFile });
    } catch (error) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get/Download file → GET /api/files/:id
const getFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id).populate('owner', 'name empId');

        if (!file || file.isDeleted) {
            return res.status(404).json({ success: false, message: 'File not found.' });
        }

        // Role check: only owner or admin can access
        if (file.owner._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            // Check if file is in a project the user is assigned to
            if (file.project) {
                const project = await Project.findById(file.project);
                const isAssigned = project?.assignedUsers.some(u => u.toString() === req.user._id.toString());
                if (!isAssigned) {
                    await createLog({ userId: req.user._id, action: 'access_denied', targetType: 'file', targetId: file._id, targetName: file.originalName, req, severity: 'warning' });
                    return res.status(403).json({ success: false, message: 'Access denied.' });
                }
            } else {
                // Check folder privacy
                if (file.folder) {
                    const folder = await Folder.findById(file.folder);
                    if (folder?.isPrivate) {
                        await createLog({ userId: req.user._id, action: 'access_denied', targetType: 'file', targetId: file._id, targetName: file.originalName, req, severity: 'warning' });
                        return res.status(403).json({ success: false, message: 'Access denied to private file.' });
                    }
                }
            }
        }

        const action = req.query.download === 'true' ? 'download' : 'view_file';

        await createLog({ userId: req.user._id, action, targetType: 'file', targetId: file._id, targetName: file.originalName, req });

        file.downloadCount += 1;
        file.lastAccessedAt = new Date();
        await file.save();

        if (req.query.download === 'true') {
            return res.download(file.path, file.originalName);
        }

        // Return file metadata + stream URL
        res.json({ success: true, data: file });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get file metadata only (no download) → GET /api/files/:id/info
const getFileInfo = async (req, res) => {
    try {
        const file = await File.findById(req.params.id)
            .populate('owner', 'name empId')
            .populate('folder', 'name');
        if (!file || file.isDeleted) return res.status(404).json({ success: false, message: 'File not found.' });
        res.json({ success: true, data: file });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Delete file → DELETE /api/files/:id
const deleteFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file || file.isDeleted) return res.status(404).json({ success: false, message: 'File not found.' });

        // Only owner or admin can delete
        if (file.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // Soft delete
        file.isDeleted = true;
        file.deletedAt = new Date();
        await file.save();

        // Update storage
        await User.findByIdAndUpdate(file.owner, { $inc: { storageUsed: -file.size } });

        await createLog({
            userId: req.user._id,
            action: 'delete_file',
            targetType: 'file',
            targetId: file._id,
            targetName: file.originalName,
            details: { size: file.size, deletedBy: req.user.empId },
            req,
            severity: 'warning',
        });

        res.json({ success: true, message: 'File deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get version history (Timeline View) → GET /api/files/:id/versions
const getFileVersions = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

        if (file.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const versions = await FileVersion.find({ file: req.params.id })
            .sort({ versionNumber: -1 })
            .populate('uploadedBy', 'name empId');

        res.json({ success: true, data: versions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Search files
const searchFiles = async (req, res) => {
    try {
        const { q, sortBy = 'createdAt', order = 'desc', type, folderId, minSize, maxSize, dateMode, dateFrom, dateTo, privateMode } = req.query;
        const query = { isDeleted: false };

        if (req.user.role !== 'admin') {
            query.owner = req.user._id;
        }

        // Strict privacy separation: only return files matching the requested view
        if (privateMode === 'true') {
            query.isPrivate = true;
        } else {
            query.isPrivate = { $ne: true };  // My Files: exclude private files
        }

        if (q) query.$or = [{ name: { $regex: q, $options: 'i' } }, { originalName: { $regex: q, $options: 'i' } }, { tags: { $in: [new RegExp(q, 'i')] } }];
        if (type) query.mimeType = { $regex: type, $options: 'i' };
        if (folderId) query.folder = folderId;

        // Size filter (bytes)
        if (minSize || maxSize) {
            query.size = {};
            if (minSize) query.size.$gte = parseInt(minSize);
            if (maxSize) query.size.$lte = parseInt(maxSize);
        }

        // Flexible date filter
        if (dateMode && dateFrom) {
            const from = new Date(dateFrom);
            if (dateMode === 'date') {
                const to = new Date(dateFrom);
                to.setHours(23, 59, 59, 999);
                query.createdAt = { $gte: from, $lte: to };
            } else if (dateMode === 'month') {
                const to = new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59, 999);
                query.createdAt = { $gte: new Date(from.getFullYear(), from.getMonth(), 1), $lte: to };
            } else if (dateMode === 'year') {
                query.createdAt = { $gte: new Date(from.getFullYear(), 0, 1), $lte: new Date(from.getFullYear(), 11, 31, 23, 59, 59, 999) };
            } else if (dateMode === 'range' && dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                query.createdAt = { $gte: from, $lte: to };
            }
        }

        const sortOrder = order === 'asc' ? 1 : -1;
        const sortMap = { name: { name: sortOrder }, date: { createdAt: sortOrder }, size: { size: sortOrder }, type: { mimeType: sortOrder } };
        const sort = sortMap[sortBy] || { createdAt: -1 };

        const files = await File.find(query)
            .sort(sort)
            .populate('owner', 'name empId')
            .populate('folder', 'name')
            .limit(100);

        res.json({ success: true, count: files.length, data: files });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { upload, uploadFile, getFile, getFileInfo, deleteFile, getFileVersions, searchFiles };

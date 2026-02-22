const Folder = require('../models/Folder');
const File = require('../models/File');
const Project = require('../models/Project');
const { createLog } = require('../middleware/activityLogger');


const createFolder = async (req, res) => {
    try {
        const { name, parentFolder, isPrivate, projectId, color } = req.body;

        if (!name) return res.status(400).json({ success: false, message: 'Folder name is required.' });

        const folder = await Folder.create({
            name,
            owner: req.user._id,
            parentFolder: parentFolder || null,
            isPrivate: isPrivate === true || isPrivate === 'true',
            project: projectId || null,
            color: color || '#3B82F6',
        });

        await createLog({
            userId: req.user._id,
            action: 'create_folder',
            targetType: 'folder',
            targetId: folder._id,
            targetName: folder.name,
            details: { isPrivate: folder.isPrivate, parentFolder },
            req,
        });

        res.status(201).json({ success: true, message: 'Folder created.', data: folder });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ success: false, message: 'A folder with this name already exists here.' });
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get folders for current user → GET /api/folders
const getFolders = async (req, res) => {
    try {
        const { parentFolder } = req.query;
        const query = { parentFolder: parentFolder || null };

        if (req.user.role !== 'admin') {
            const assignedProjects = await Project.find({ assignedUsers: req.user._id }).select('_id');
            const assignedProjectIds = assignedProjects.map(p => p._id);

            // Show:
            // 1. Folders the user owns (regardless of privacy/project)
            // 2. Non-private folders that have NO project (shared personal folders)
            // 3. Non-private project folders ONLY for projects this user is assigned to
            query.$or = [
                { owner: req.user._id },
                { isPrivate: false, project: null },
                { isPrivate: false, project: { $in: assignedProjectIds } },
            ];
        }

        const folders = await Folder.find(query)
            .populate('owner', 'name empId')
            .populate('project', 'name status')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: folders.length, data: folders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get files in a folder → GET /api/folders/:id/files
const getFolderFiles = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

        // Private folder: only owner or admin
        if (folder.isPrivate && folder.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'This is a private folder.' });
        }

        const { sortBy = 'createdAt', order = 'desc' } = req.query;
        const sortOrder = order === 'asc' ? 1 : -1;
        const sortMap = { name: { name: sortOrder }, date: { createdAt: sortOrder }, size: { size: sortOrder }, type: { mimeType: sortOrder } };
        const sort = sortMap[sortBy] || { createdAt: -1 };

        const files = await File.find({ folder: req.params.id, isDeleted: false })
            .sort(sort)
            .populate('owner', 'name empId');

        res.json({ success: true, count: files.length, data: files, folder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Delete folder → DELETE /api/folders/:id
const deleteFolder = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

        if (folder.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // Soft-delete all files inside
        await File.updateMany({ folder: req.params.id }, { isDeleted: true, deletedAt: new Date() });
        await Folder.findByIdAndDelete(req.params.id);

        await createLog({
            userId: req.user._id,
            action: 'delete_folder',
            targetType: 'folder',
            targetId: folder._id,
            targetName: folder.name,
            details: { deletedBy: req.user.empId },
            req,
            severity: 'warning',
        });

        res.json({ success: true, message: 'Folder and its files deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get single folder info → GET /api/folders/:id
const getFolder = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id)
            .populate('owner', 'name empId')
            .populate('project', 'name');

        if (!folder) return res.status(404).json({ success: false, message: 'Folder not found.' });

        if (folder.isPrivate && folder.owner._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Private folder.' });
        }

        res.json({ success: true, data: folder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createFolder, getFolders, getFolderFiles, deleteFolder, getFolder };

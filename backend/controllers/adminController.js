const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');
const { createLog } = require('../middleware/activityLogger');

// @desc  Get all users (with stats) → GET /api/admin/users
const getAllUsers = async (req, res) => {
    try {
        const { search, role, status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (search) query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { empId: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
        if (role) query.role = role;
        if (status === 'active') query.isActive = true;
        if (status === 'locked') query.isActive = false;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [users, total] = await Promise.all([
            User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
            User.countDocuments(query),
        ]);

        // Attach file count per user
        const usersWithStats = await Promise.all(users.map(async (u) => {
            const fileCount = await File.countDocuments({ owner: u._id, isDeleted: false });
            return {
                _id: u._id,
                empId: u.empId,
                name: u.name,
                email: u.email,
                role: u.role,
                department: u.department,
                isActive: u.isActive,
                lastLogin: u.lastLogin,
                storageUsed: u.storageUsed,
                quota: u.quota,
                fileCount,
                createdAt: u.createdAt,
            };
        }));

        res.json({ success: true, count: total, page: parseInt(page), data: usersWithStats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Create user → POST /api/admin/users
const createUser = async (req, res) => {
    try {
        const { empId, name, email, password, role, department } = req.body;
        const existingUser = await User.findOne({ $or: [{ empId: empId?.toUpperCase() }, { email }] });
        if (existingUser) return res.status(400).json({ success: false, message: 'Employee ID or email already exists.' });

        const user = await User.create({ empId, name, email, password, role: role || 'employee', department });

        await createLog({
            userId: req.user._id,
            action: 'create_user',
            targetType: 'user',
            targetId: user._id,
            targetName: user.name,
            details: { empId: user.empId, role: user.role, createdBy: req.user.empId },
            req,
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully.',
            data: { _id: user._id, empId: user.empId, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Update user status → PUT /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot modify admin account status.' });

        user.isActive = isActive;
        await user.save();

        await createLog({
            userId: req.user._id,
            action: isActive ? 'unlock_user' : 'lock_user',
            targetType: 'user',
            targetId: user._id,
            targetName: user.name,
            details: { empId: user.empId, action: isActive ? 'unlocked' : 'locked' },
            req,
            severity: isActive ? 'info' : 'warning',
        });

        res.json({ success: true, message: `User ${isActive ? 'unlocked' : 'locked'} successfully.`, data: { isActive: user.isActive } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get system stats → GET /api/admin/stats
const getSystemStats = async (req, res) => {
    try {
        const [
            totalUsers, activeUsers, lockedUsers,
            totalFiles, deletedFiles,
            totalFolders, privatefolders,
            totalProjects, activeProjects, expiredProjects,
            recentLogs,
        ] = await Promise.all([
            User.countDocuments({ role: 'employee' }),
            User.countDocuments({ role: 'employee', isActive: true }),
            User.countDocuments({ role: 'employee', isActive: false }),
            File.countDocuments({ isDeleted: false }),
            File.countDocuments({ isDeleted: true }),
            Folder.countDocuments(),
            Folder.countDocuments({ isPrivate: true }),
            Project.countDocuments(),
            Project.countDocuments({ status: 'active' }),
            Project.countDocuments({ status: 'expired' }),
            ActivityLog.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name empId'),
        ]);

        // Total storage used across all users
        const storageAgg = await User.aggregate([{ $group: { _id: null, total: { $sum: '$storageUsed' } } }]);
        const totalStorage = storageAgg[0]?.total || 0;

        // File type breakdown
        const mimeBreakdown = await File.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$extension', count: { $sum: 1 }, totalSize: { $sum: '$size' } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        // Upload activity last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const uploadTrend = await ActivityLog.aggregate([
            { $match: { action: 'upload', createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        res.json({
            success: true,
            data: {
                users: { total: totalUsers, active: activeUsers, locked: lockedUsers },
                files: { total: totalFiles, deleted: deletedFiles },
                folders: { total: totalFolders, private: privatefolders },
                projects: { total: totalProjects, active: activeProjects, expired: expiredProjects },
                storage: { totalUsed: totalStorage, totalCapacity: totalUsers * 5 * 1024 * 1024 * 1024 },
                mimeBreakdown,
                uploadTrend,
                recentActivity: recentLogs,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get activity logs → GET /api/admin/logs
const getActivityLogs = async (req, res) => {
    try {
        const { userId, action, severity, startDate, endDate, page = 1, limit = 50 } = req.query;
        const query = {};

        if (userId) query.userId = userId;
        if (action) query.action = action;
        if (severity) query.severity = severity;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [logs, total] = await Promise.all([
            ActivityLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name empId role'),
            ActivityLog.countDocuments(query),
        ]);

        res.json({ success: true, count: total, page: parseInt(page), data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get ALL files (admin superuser view) → GET /api/admin/files
const getAllFiles = async (req, res) => {
    try {
        const { search, owner, folderId, sortBy = 'createdAt', order = 'desc', page = 1, limit = 50, minSize, maxSize, dateMode, dateFrom, dateTo } = req.query;
        const query = { isDeleted: false };

        if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { originalName: { $regex: search, $options: 'i' } }];
        if (owner) query.owner = owner;
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

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [files, total] = await Promise.all([
            File.find(query).sort(sort).skip(skip).limit(parseInt(limit))
                .populate('owner', 'name empId department')
                .populate('folder', 'name'),
            File.countDocuments(query),
        ]);

        res.json({ success: true, count: total, page: parseInt(page), data: files });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Admin delete any file → DELETE /api/admin/files/:id
const adminDeleteFile = async (req, res) => {
    try {
        const fs = require('fs');
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

        file.isDeleted = true;
        file.deletedAt = new Date();
        await file.save();

        await User.findByIdAndUpdate(file.owner, { $inc: { storageUsed: -file.size } });

        await createLog({
            userId: req.user._id,
            action: 'delete_file',
            targetType: 'file',
            targetId: file._id,
            targetName: file.originalName,
            details: { adminAction: true, fileOwner: file.owner },
            req,
            severity: 'warning',
        });

        res.json({ success: true, message: 'File deleted by admin.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Ransomware protection stats → GET /api/admin/security
const getSecurityStats = async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            recentDeletes, recentUploads, accessDenied, warningLogs,
        ] = await Promise.all([
            ActivityLog.countDocuments({ action: 'delete_file', createdAt: { $gte: twentyFourHoursAgo } }),
            ActivityLog.countDocuments({ action: 'upload', createdAt: { $gte: twentyFourHoursAgo } }),
            ActivityLog.countDocuments({ action: 'access_denied', createdAt: { $gte: twentyFourHoursAgo } }),
            ActivityLog.find({ severity: { $in: ['warning', 'critical'] }, createdAt: { $gte: twentyFourHoursAgo } })
                .sort({ createdAt: -1 }).limit(20).populate('userId', 'name empId'),
        ]);

        // Heuristic: if deletes > 20 in 24h, flag as suspicious
        const threatLevel = recentDeletes > 20 ? 'HIGH' : recentDeletes > 10 ? 'MEDIUM' : 'LOW';

        res.json({
            success: true,
            data: {
                threatLevel,
                last24h: { deletes: recentDeletes, uploads: recentUploads, accessDenied },
                warningLogs,
                status: threatLevel === 'HIGH' ? 'ALERT: Unusual deletion activity detected' : 'System operating normally',
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Delete user → DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete admin account.' });

        await user.deleteOne();

        await createLog({
            userId: req.user._id,
            action: 'delete_user',
            targetType: 'user',
            targetId: user._id,
            targetName: user.name,
            details: { empId: user.empId },
            req,
            severity: 'critical',
        });

        res.json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllUsers, createUser, updateUserStatus, deleteUser, getSystemStats, getActivityLogs, getAllFiles, adminDeleteFile, getSecurityStats };

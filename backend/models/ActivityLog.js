const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: [
            'login', 'logout', 'register',
            'upload', 'download', 'delete_file', 'view_file', 'update_file',
            'create_folder', 'delete_folder', 'rename_folder',
            'create_project', 'update_project', 'delete_project', 'assign_user',
            'lock_user', 'unlock_user', 'update_user', 'create_user',
            'admin_action', 'access_denied'
        ],
    },
    targetType: {
        type: String,
        enum: ['file', 'folder', 'user', 'project', 'system', null],
        default: null,
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    targetName: {
        type: String,
        default: '',
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    ipAddress: {
        type: String,
        default: '',
    },
    userAgent: {
        type: String,
        default: '',
    },
    severity: {
        type: String,
        enum: ['info', 'warning', 'critical'],
        default: 'info',
    },
}, { timestamps: true });

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

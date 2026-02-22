const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    originalName: {
        type: String,
        required: true,
    },
    path: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true, // bytes
    },
    mimeType: {
        type: String,
        default: 'application/octet-stream',
    },
    extension: {
        type: String,
        default: '',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
    },
    isPrivate: {
        type: Boolean,
        default: false,  // true when stored in a private folder or uploaded in private mode
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null,
    },
    currentVersion: {
        type: Number,
        default: 1,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    expiresAt: {
        type: Date,
        default: null, // Self-destruct date
    },
    tags: [String],
    checksum: {
        type: String,
        default: '',
    },
    downloadCount: {
        type: Number,
        default: 0,
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// Index for faster queries
fileSchema.index({ owner: 1, folder: 1, isDeleted: 1 });
fileSchema.index({ owner: 1, isPrivate: 1, isDeleted: 1 });
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $ne: null }, isDeleted: false } });

module.exports = mongoose.model('File', fileSchema);

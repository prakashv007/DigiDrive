const mongoose = require('mongoose');

const fileVersionSchema = new mongoose.Schema({
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true,
    },
    versionNumber: {
        type: Number,
        required: true,
    },
    path: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    mimeType: {
        type: String,
        default: 'application/octet-stream',
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    changelog: {
        type: String,
        default: '',
    },
    checksum: {
        type: String,
        default: '',
    },
}, { timestamps: true });

fileVersionSchema.index({ file: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('FileVersion', fileVersionSchema);

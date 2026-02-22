const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Folder name is required'],
        trim: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    parentFolder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
    },
    isPrivate: {
        type: Boolean,
        default: false,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null,
    },
    color: {
        type: String,
        default: '#3B82F6',
    },
    icon: {
        type: String,
        default: 'folder',
    },
}, { timestamps: true });

// Compound index: unique folder name per owner per parent
folderSchema.index({ name: 1, owner: 1, parentFolder: 1 }, { unique: true });

module.exports = mongoose.model('Folder', folderSchema);

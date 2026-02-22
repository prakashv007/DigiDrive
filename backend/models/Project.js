const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    startDate: {
        type: Date,
        default: Date.now,
    },
    expiryDate: {
        type: Date,
        required: [true, 'Project expiry date is required'],
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'archived'],
        default: 'active',
    },
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
    },
    color: {
        type: String,
        default: '#10B981',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
}, { timestamps: true });

// Auto-expire: when queried after expiryDate, status becomes expired
projectSchema.pre('find', function () {
    this.where({ status: { $ne: 'archived' } });
});

module.exports = mongoose.model('Project', projectSchema);

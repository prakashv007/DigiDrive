const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['admin', 'employee'],
        default: 'employee',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
    storageUsed: {
        type: Number,
        default: 0, // bytes
    },
    quota: {
        type: Number,
        default: 5 * 1024 * 1024 * 1024, // 5GB
    },
    department: {
        type: String,
        default: '',
    },
    avatar: {
        type: String,
        default: '',
    },
    requirePasswordChange: {
        type: Boolean,
        default: true, // Default to true for all new users
    },
}, { timestamps: true });

// Hash password before save (Mongoose 8.x: async hooks don't receive `next`)
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual: storage percentage
userSchema.virtual('storagePercent').get(function () {
    return ((this.storageUsed / this.quota) * 100).toFixed(1);
});

module.exports = mongoose.model('User', userSchema);

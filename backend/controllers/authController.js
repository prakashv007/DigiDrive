const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
const { createLog } = require('../middleware/activityLogger');


const register = async (req, res) => {
    try {
        const { empId, name, email, password, role, department } = req.body;

       
        const existingUser = await User.findOne({ $or: [{ empId }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Employee ID or email already exists.' });
        }

        const user = await User.create({ empId, name, email, password, role: role || 'employee', department });

      
        if (req.user) {
            await createLog({
                userId: req.user._id,
                action: 'create_user',
                targetType: 'user',
                targetId: user._id,
                targetName: user.name,
                details: { empId: user.empId, role: user.role },
                req,
            });
        }

        res.status(201).json({
            success: true,
            message: 'Employee account created successfully.',
            data: {
                _id: user._id,
                empId: user.empId,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                isActive: user.isActive,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Duplicate Employee ID or email.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Login user
// @route POST /api/auth/login
const login = async (req, res) => {
    try {
        const { empId, password } = req.body;

        if (!empId || !password) {
            return res.status(400).json({ success: false, message: 'Please provide Employee ID and password.' });
        }

        // Find user with password included
        const user = await User.findOne({ empId: empId.toUpperCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Check inactivity (30 days)
        if (user.lastLogin) {
            const daysSinceLogin = (Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLogin > 30 && user.role !== 'admin') {
                user.isActive = false;
                await user.save();
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been locked due to 30 days of inactivity. Contact your administrator.',
                });
            }
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is locked. Contact your administrator.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Log the login
        await createLog({
            userId: user._id,
            action: 'login',
            targetType: 'system',
            details: { empId: user.empId, role: user.role },
            req,
        });

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            data: {
                _id: user._id,
                empId: user.empId,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                storageUsed: user.storageUsed,
                quota: user.quota,
                avatar: user.avatar,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                requirePasswordChange: user.requirePasswordChange,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get current user
// @route GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            success: true,
            data: {
                _id: user._id,
                empId: user.empId,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                storageUsed: user.storageUsed,
                quota: user.quota,
                avatar: user.avatar,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                requirePasswordChange: user.requirePasswordChange,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Logout (client just removes token; we log it)
// @route POST /api/auth/logout
const logout = async (req, res) => {
    try {
        await createLog({
            userId: req.user._id,
            action: 'logout',
            targetType: 'system',
            details: {},
            req,
        });
        res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc  Change Password (Force Change)
// @route POST /api/auth/change-password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // User is already attached by protect middleware
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ success: false, message: 'New password cannot be the same as the old password.' });
        }

        user.password = newPassword;
        user.requirePasswordChange = false;
        await user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, login, getMe, logout, changePassword };

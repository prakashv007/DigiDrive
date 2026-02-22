const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Protect: verify JWT and attach user to request
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
        // Allow token via query param for direct browser navigation (e.g. file downloads)
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been locked. Please contact an administrator.' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

// Admin only
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    // Log unauthorized access attempt
    ActivityLog.create({
        userId: req.user?._id,
        action: 'access_denied',
        targetType: 'system',
        details: { route: req.originalUrl, method: req.method },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: 'warning',
    }).catch(() => { });
    return res.status(403).json({ success: false, message: 'Admin access required.' });
};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

module.exports = { protect, adminOnly, generateToken };

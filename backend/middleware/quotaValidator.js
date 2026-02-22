const User = require('../models/User');

// Check quota before file upload
const quotaValidator = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const contentLength = parseInt(req.headers['content-length'] || '0');

        // Leave some buffer — actual check happens post-upload
        if (user.storageUsed >= user.quota) {
            return res.status(413).json({
                success: false,
                message: `Storage quota exceeded. You are using ${(user.storageUsed / (1024 * 1024 * 1024)).toFixed(2)}GB of your 5GB limit.`,
            });
        }

        req.userQuota = {
            used: user.storageUsed,
            total: user.quota,
            remaining: user.quota - user.storageUsed,
        };

        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Quota check failed.' });
    }
};

module.exports = quotaValidator;

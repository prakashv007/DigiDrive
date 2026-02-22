const ActivityLog = require('../models/ActivityLog');

// Middleware factory to log actions automatically
const logActivity = (action, targetType = null, severity = 'info') => {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);

        res.json = function (data) {
            // Only log successful operations
            if (res.statusCode < 400 && req.user) {
                ActivityLog.create({
                    userId: req.user._id,
                    action,
                    targetType,
                    targetId: req.params?.id || data?.data?._id || null,
                    targetName: data?.data?.name || data?.data?.originalName || '',
                    details: { method: req.method, url: req.originalUrl },
                    ipAddress: req.ip || req.connection?.remoteAddress,
                    userAgent: req.headers['user-agent'],
                    severity,
                }).catch(() => { });
            }
            return originalJson(data);
        };

        next();
    };
};

// Manual log helper (call anywhere in controllers)
const createLog = async ({ userId, action, targetType, targetId, targetName, details, req, severity = 'info' }) => {
    try {
        await ActivityLog.create({
            userId,
            action,
            targetType: targetType || null,
            targetId: targetId || null,
            targetName: targetName || '',
            details: details || {},
            ipAddress: req?.ip || '',
            userAgent: req?.headers?.['user-agent'] || '',
            severity,
        });
    } catch (err) {
        console.error('Activity log error:', err.message);
    }
};

module.exports = { logActivity, createLog };

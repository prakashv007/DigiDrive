const cron = require('node-cron');
const File = require('../models/File');
const Project = require('../models/Project');
const User = require('../models/User');
const fs = require('fs');

console.log('⏰ Cron jobs initialized');

// Every hour: expire projects and revoke access
cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Checking project expiry...');
    try {
        const now = new Date();
        const expiredProjects = await Project.find({
            status: 'active',
            expiryDate: { $lt: now },
        });

        for (const project of expiredProjects) {
            project.status = 'expired';
            await project.save();
            console.log(`[CRON] Project "${project.name}" expired at ${now.toISOString()}. Users access revoked.`);
        }

        if (expiredProjects.length > 0) {
            console.log(`[CRON] Expired ${expiredProjects.length} project(s).`);
        }
    } catch (err) {
        console.error('[CRON] Project expiry error:', err.message);
    }
});

// Every hour: self-destruct expired files
cron.schedule('15 * * * *', async () => {
    console.log('[CRON] Checking file self-destruct timers...');
    try {
        const now = new Date();
        const expiredFiles = await File.find({
            expiresAt: { $lt: now, $ne: null },
            isDeleted: false,
        });

        for (const file of expiredFiles) {
            // Remove physical file
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            // Update user storage
            await User.findByIdAndUpdate(file.owner, { $inc: { storageUsed: -file.size } });
            // Soft delete
            file.isDeleted = true;
            file.deletedAt = now;
            await file.save();
            console.log(`[CRON] File "${file.originalName}" self-destructed.`);
        }

        if (expiredFiles.length > 0) {
            console.log(`[CRON] Self-destructed ${expiredFiles.length} file(s).`);
        }
    } catch (err) {
        console.error('[CRON] File expiry error:', err.message);
    }
});

// Every day at midnight: lock inactive users (30 days no login)
cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Checking user inactivity...');
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const inactiveUsers = await User.find({
            role: 'employee',
            isActive: true,
            lastLogin: { $lt: thirtyDaysAgo, $ne: null },
        });

        for (const user of inactiveUsers) {
            user.isActive = false;
            await user.save();
            console.log(`[CRON] User ${user.empId} locked due to inactivity.`);
        }

        if (inactiveUsers.length > 0) {
            console.log(`[CRON] Locked ${inactiveUsers.length} inactive user(s).`);
        }
    } catch (err) {
        console.error('[CRON] User inactivity error:', err.message);
    }
});

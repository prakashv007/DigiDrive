const express = require('express');
const router = express.Router();
const {
    getAllUsers, createUser, updateUserStatus,
    getSystemStats, getActivityLogs,
    getAllFiles, adminDeleteFile, getSecurityStats, deleteUser
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// Users
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Stats
router.get('/stats', getSystemStats);

// Activity Logs
router.get('/logs', getActivityLogs);

// Files (superuser view)
router.get('/files', getAllFiles);
router.delete('/files/:id', adminDeleteFile);

// Security / Ransomware protection
router.get('/security', getSecurityStats);

module.exports = router;

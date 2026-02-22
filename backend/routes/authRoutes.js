const express = require('express');
const router = express.Router();
const {
    register, login, getMe, logout, changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', protect, register); // Admin creates users
router.post('/login', login);
router.post('/change-password', protect, changePassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;

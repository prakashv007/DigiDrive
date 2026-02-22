const express = require('express');
const router = express.Router();
const { createFolder, getFolders, getFolderFiles, deleteFolder, getFolder } = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/folders
router.post('/', protect, createFolder);

// GET /api/folders
router.get('/', protect, getFolders);

// GET /api/folders/:id
router.get('/:id', protect, getFolder);

// GET /api/folders/:id/files
router.get('/:id/files', protect, getFolderFiles);

// DELETE /api/folders/:id
router.delete('/:id', protect, deleteFolder);

module.exports = router;

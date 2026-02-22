const express = require('express');
const router = express.Router();
const {
    upload, uploadFile, getFile, getFileInfo, deleteFile, getFileVersions, searchFiles
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');


router.post('/upload', protect, upload.single('file'), uploadFile);

router.get('/search', protect, searchFiles);


router.get('/:id', protect, getFile);


router.get('/:id/info', protect, getFileInfo);


router.get('/:id/versions', protect, getFileVersions);

router.delete('/:id', protect, deleteFile);

module.exports = router;

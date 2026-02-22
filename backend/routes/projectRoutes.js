const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProject, updateProject, deleteProject } = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// POST /api/projects (admin only)
router.post('/', protect, adminOnly, createProject);

// GET /api/projects (filtered by user role)
router.get('/', protect, getProjects);

// GET /api/projects/:id
router.get('/:id', protect, getProject);

// PUT /api/projects/:id (admin only)
router.put('/:id', protect, adminOnly, updateProject);

// DELETE /api/projects/:id (admin only)
router.delete('/:id', protect, adminOnly, deleteProject);

module.exports = router;

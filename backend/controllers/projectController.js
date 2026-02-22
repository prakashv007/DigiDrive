const Project = require('../models/Project');
const User = require('../models/User');
const Folder = require('../models/Folder');
const { createLog } = require('../middleware/activityLogger');

// @desc  Create project → POST /api/projects
const createProject = async (req, res) => {
    try {
        const { name, description, assignedUsers, expiryDate, color, priority } = req.body;

        if (!name || !expiryDate) {
            return res.status(400).json({ success: false, message: 'Project name and expiry date are required.' });
        }

        // Create a project folder
        const folder = await Folder.create({
            name: `[Project] ${name}`,
            owner: req.user._id,
            isPrivate: false,
            color: color || '#10B981',
        });

        const project = await Project.create({
            name,
            description,
            createdBy: req.user._id,
            assignedUsers: assignedUsers || [],
            expiryDate: new Date(expiryDate),
            folder: folder._id,
            color: color || '#10B981',
            priority: priority || 'medium',
        });

        // Update folder with project reference
        await Folder.findByIdAndUpdate(folder._id, { project: project._id });

        await createLog({
            userId: req.user._id,
            action: 'create_project',
            targetType: 'project',
            targetId: project._id,
            targetName: project.name,
            details: { expiryDate, assignedCount: assignedUsers?.length || 0 },
            req,
        });

        const populated = await Project.findById(project._id)
            .populate('assignedUsers', 'name empId email department')
            .populate('folder', 'name');

        res.status(201).json({ success: true, message: 'Project created.', data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get projects for current user → GET /api/projects
const getProjects = async (req, res) => {
    try {
        let query = {};

        if (req.user.role !== 'admin') {
            query = {
                $or: [{ assignedUsers: req.user._id }, { createdBy: req.user._id }],
                status: { $ne: 'archived' },
            };
        }

        const projects = await Project.find(query)
            .populate('assignedUsers', 'name empId email')
            .populate('createdBy', 'name empId')
            .populate('folder', 'name')
            .sort({ createdAt: -1 });

        // Auto-expire projects past expiryDate
        const now = new Date();
        const updates = projects.map(async (p) => {
            if (p.status === 'active' && new Date(p.expiryDate) < now) {
                p.status = 'expired';
                await p.save();
            }
            return p;
        });
        const updatedProjects = await Promise.all(updates);

        res.json({ success: true, count: updatedProjects.length, data: updatedProjects });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Get single project → GET /api/projects/:id
const getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('assignedUsers', 'name empId email department storageUsed')
            .populate('createdBy', 'name empId')
            .populate('folder', 'name');

        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

        // Access check
        if (req.user.role !== 'admin') {
            const isAssigned = project.assignedUsers.some(u => u._id.toString() === req.user._id.toString());
            if (!isAssigned && project.createdBy._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Access denied.' });
            }
        }

        res.json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Update project → PUT /api/projects/:id
const updateProject = async (req, res) => {
    try {
        const { name, description, assignedUsers, expiryDate, status, color, priority } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

        if (name) project.name = name;
        if (description !== undefined) project.description = description;
        if (assignedUsers) project.assignedUsers = assignedUsers;
        if (expiryDate) project.expiryDate = new Date(expiryDate);
        if (status) project.status = status;
        if (color) project.color = color;
        if (priority) project.priority = priority;

        await project.save();

        await createLog({
            userId: req.user._id,
            action: 'update_project',
            targetType: 'project',
            targetId: project._id,
            targetName: project.name,
            details: req.body,
            req,
        });

        const populated = await Project.findById(project._id)
            .populate('assignedUsers', 'name empId email')
            .populate('folder', 'name');

        res.json({ success: true, message: 'Project updated.', data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc  Delete project → DELETE /api/projects/:id
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

        await createLog({
            userId: req.user._id,
            action: 'delete_project',
            targetType: 'project',
            targetId: project._id,
            targetName: project.name,
            details: {},
            req,
            severity: 'warning',
        });

        await Project.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Project deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createProject, getProjects, getProject, updateProject, deleteProject };

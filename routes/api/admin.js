const express = require('express');
const router = express.Router();
const AdminService = require('../../services/adminService');
const { requireAdmin } = require('../../middleware/authMiddleware');
const { handleApiError } = require('../../middleware/errorHandler');
const logger = require('../../services/loggerService');

// Get site statistics
router.get('/stats', requireAdmin, async (req, res, next) => {
    try {
        const stats = await AdminService.getSiteStats();
        res.json(stats);
    } catch (error) {
        next(error);
    }
});

// Get all administrators
router.get('/admins', requireAdmin, async (req, res, next) => {
    try {
        const admins = await AdminService.getAllAdmins();
        res.json(admins);
    } catch (error) {
        next(error);
    }
});

// Get all banned users
router.get('/banned-users', requireAdmin, async (req, res, next) => {
    try {
        const bannedUsers = await AdminService.getBannedUsers();
        res.json(bannedUsers);
    } catch (error) {
        next(error);
    }
});

// Grant admin privileges
router.post('/grant-admin', requireAdmin, async (req, res, next) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const result = await AdminService.grantAdmin(username, req.session.user.username);
        res.json({ 
            success: true, 
            message: `Admin privileges granted to ${username}`,
            user: result
        });
    } catch (error) {
        next(error);
    }
});

// Revoke admin privileges
router.delete('/revoke-admin/:username', requireAdmin, async (req, res, next) => {
    try {
        const { username } = req.params;
        
        const result = await AdminService.revokeAdmin(username, req.session.user.username);
        res.json({ 
            success: true, 
            message: `Admin privileges revoked from ${username}`,
            user: result
        });
    } catch (error) {
        next(error);
    }
});

// Ban user site-wide
router.post('/ban-user', requireAdmin, async (req, res, next) => {
    try {
        const { username, reason } = req.body;
        
        if (!username || !reason) {
            return res.status(400).json({ error: 'Username and reason are required' });
        }

        const result = await AdminService.banUser(username, reason, req.session.user.username);
        res.json({ 
            success: true, 
            message: `User ${username} banned site-wide`,
            ...result
        });
    } catch (error) {
        next(error);
    }
});

// Unban user site-wide
router.post('/unban-user', requireAdmin, async (req, res, next) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const result = await AdminService.unbanUser(username, req.session.user.username);
        res.json({ 
            success: true, 
            message: `User ${username} unbanned site-wide`,
            ...result
        });
    } catch (error) {
        next(error);
    }
});

// Delete post (admin override)
router.delete('/post/:id', requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const result = await AdminService.deletePost(id, req.session.user.username);
        res.json({ 
            success: true, 
            message: 'Post deleted by administrator',
            ...result
        });
    } catch (error) {
        next(error);
    }
});

// Delete community (admin override)
router.delete('/community/:name', requireAdmin, async (req, res, next) => {
    try {
        const { name } = req.params;
        
        const result = await AdminService.deleteCommunity(name, req.session.user.username);
        res.json({ 
            success: true, 
            message: `Community ${name} deleted by administrator`,
            ...result
        });
    } catch (error) {
        next(error);
    }
});

// Get logs by category
router.get('/logs/:category?', requireAdmin, async (req, res, next) => {
    try {
        const category = req.params.category || 'security';
        const lines = parseInt(req.query.lines) || 100;
        
        // Validate category
        const validCategories = logger.getLogCategories();
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                error: 'Invalid log category',
                validCategories 
            });
        }
        
        const logs = logger.readLogs(category, lines);
        res.json({
            category,
            logs,
            totalEntries: logs.length
        });
    } catch (error) {
        next(error);
    }
});

// Get log categories and stats
router.get('/logs-info', requireAdmin, async (req, res, next) => {
    try {
        const categories = logger.getLogCategories();
        const stats = logger.getLogStats();
        res.json({
            categories,
            stats
        });
    } catch (error) {
        next(error);
    }
});


router.use(handleApiError);

module.exports = router;
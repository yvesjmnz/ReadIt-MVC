const express = require('express');
const router = express.Router();
const AdminService = require('../../services/adminService');
const PostService = require('../../services/postService');
const CommunityService = require('../../services/communityService');
const { handleViewError } = require('../../middleware/errorHandler');

// Admin dashboard
router.get('/', async (req, res, next) => {
    try {
        // Check if user is admin
        const isAdmin = await AdminService.isAdmin(req.session.user?.username);
        if (!isAdmin) {
            return res.status(403).render('error', { 
                error: 'Administrator privileges required',
                user: req.session.user 
            });
        }

        const [stats, admins, recentPosts, communities, bannedUsers] = await Promise.all([
            AdminService.getSiteStats(),
            AdminService.getAllAdmins(),
            PostService.findAll(),
            CommunityService.findAll(),
            AdminService.getBannedUsers()
        ]);

        // Get recent posts (last 10)
        const sortedPosts = recentPosts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        res.render('admin', {
            user: req.session.user,
            isAdmin: true,
            stats,
            admins,
            recentPosts: sortedPosts,
            communities,
            bannedUsers,
            pageTitle: 'Admin Dashboard'
        });
    } catch (error) {
        next(error);
    }
});

router.use(handleViewError);

module.exports = router;
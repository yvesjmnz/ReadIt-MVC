const express = require('express');
const router = express.Router();
const CommunityService = require('../../services/communityService');
const { requireAuth, requireCreator } = require('../../middleware/authMiddleware');
const { validateCommunity } = require('../../middleware/validation');
const { handleApiError } = require('../../middleware/errorHandler');

// Get all communities
router.get('/', async (req, res, next) => {
    try {
        const communities = await CommunityService.findAll();
        res.json(communities);
    } catch (error) {
        next(error);
    }
});

// Get specific community
router.get('/:name', async (req, res, next) => {
    try {
        const community = await CommunityService.findByName(req.params.name);
        if (!community) throw new Error('Community not found');

        const userRole = CommunityService.getUserRole(community, req.session.user?.username);
        
        res.json({
            ...community.toObject(),
            userRole
        });
    } catch (error) {
        next(error);
    }
});

// Create community
router.post('/', requireAuth, validateCommunity, async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const creator = req.session.user.username;
        
        const community = await CommunityService.create({
            name,
            description,
            creator,
            members: [creator]
        });
        
        res.status(201).json({ success: true, community });
    } catch (error) {
        next(error);
    }
});

// Join community
router.post('/:name/join', requireAuth, async (req, res, next) => {
    try {
        await CommunityService.joinCommunity(req.params.name, req.session.user.username);
        res.json({ success: true, message: 'Successfully joined community' });
    } catch (error) {
        next(error);
    }
});

// Leave community
router.post('/:name/leave', requireAuth, async (req, res, next) => {
    try {
        await CommunityService.leaveCommunity(req.params.name, req.session.user.username);
        res.json({ success: true, message: 'Successfully left community' });
    } catch (error) {
        next(error);
    }
});

// Add moderator
router.post('/:name/moderator', requireCreator, async (req, res, next) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const community = await CommunityService.addModerator(req.params.name, username);
        res.json({
            success: true,
            message: 'Moderator added successfully',
            moderators: community.moderators
        });
    } catch (error) {
        next(error);
    }
});

// Remove moderator
router.delete('/:name/moderator/:username', requireCreator, async (req, res, next) => {
    try {
        const community = await CommunityService.removeModerator(req.params.name, req.params.username);
        res.json({
            success: true,
            message: 'Moderator removed successfully',
            moderators: community.moderators
        });
    } catch (error) {
        next(error);
    }
});

router.use(handleApiError);

module.exports = router;
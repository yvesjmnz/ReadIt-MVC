const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const User = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');

// Mount API routes
const apiRoutes = require('./api/communities');
router.use('/api/communities', apiRoutes);
router.use('/api/community', apiRoutes);

// Mount view routes
router.use('/community', require('./views/communities'));

// Legacy API routes for backward compatibility
router.get('/api/community/:name/members', requireAuth, async (req, res) => {
    try {
        const community = await Community.findOne({ name: req.params.name });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }

        if (community.creator !== req.session.user.username) {
            return res.status(403).json({ error: 'Only creators can view member list' });
        }

        const memberDetails = await User.find(
            { username: { $in: community.members } },
            { username: 1, _id: 0 }
        );

        const availableMembers = memberDetails.filter(member => 
            member.username !== community.creator && 
            !community.moderators.includes(member.username)
        );

        res.json(availableMembers);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

router.get('/api/community/:name/moderators', async (req, res) => {
    try {
        const community = await Community.findOne({ name: req.params.name });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }

        const moderatorDetails = await User.find(
            { username: { $in: [community.creator, ...community.moderators] } },
            { username: 1, _id: 0 }
        );

        const moderators = moderatorDetails.map(mod => ({
            ...mod.toObject(),
            role: mod.username === community.creator ? 'creator' : 'moderator'
        }));

        res.json({
            creator: community.creator,
            moderators: community.moderators,
            moderatorDetails: moderators
        });
    } catch (error) {
        console.error('Error fetching moderators:', error);
        res.status(500).json({ error: 'Failed to fetch moderators' });
    }
});

module.exports = router;
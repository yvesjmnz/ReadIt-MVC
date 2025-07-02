const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const User = require('../models/User');
const { requireAuth, requireModerator, requireCreator } = require('../middleware/authMiddleware');

// Get all communities
router.get('/communities', async (req, res) => {
    try {
        const communities = await Community.find();
        res.json(communities);
    } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({ error: 'Failed to fetch communities' });
    }
});

// Get a specific community with moderator info (API route)
router.get('/community/:name', async (req, res) => {
    try {
        const community = await Community.findOne({ name: req.params.name });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }

        // Add user's moderator status if authenticated
        let userRole = 'member';
        if (req.session.user) {
            const username = req.session.user.username;
            if (community.creator === username) {
                userRole = 'creator';
            } else if (community.isModerator(username)) {
                userRole = 'moderator';
            }
        }

        res.json({
            ...community.toObject(),
            userRole
        });
    } catch (error) {
        console.error('Error fetching community:', error);
        res.status(500).json({ error: 'Failed to fetch community' });
    }
});

// Create a new community
router.post('/community', requireAuth, async (req, res) => {
    const { name, description } = req.body;

    // Validation
    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    if (name.length < 3 || name.length > 50) {
        return res.status(400).json({ error: 'Community name must be between 3 and 50 characters' });
    }

    if (description.length < 10 || description.length > 500) {
        return res.status(400).json({ error: 'Description must be between 10 and 500 characters' });
    }

    try {
        const creator = req.session.user.username;
        const newCommunity = new Community({ 
            name, 
            description, 
            creator,
            members: [creator]
        });
        
        await newCommunity.save();
        res.status(201).json(newCommunity);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Community name already exists' });
        }
        console.error('Error creating community:', error);
        res.status(500).json({ error: 'Failed to create community' });
    }
});

// Add a moderator to a community (only creator can do this)
router.post('/community/:name/moderator', requireCreator, async (req, res) => {
    const { username } = req.body;

    // Validation
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const community = req.community;

        // Check if user is already a moderator
        if (community.isModerator(username)) {
            return res.status(400).json({ error: 'User is already a moderator' });
        }

        // Add user to members if not already a member
        if (!community.members.includes(username)) {
            community.members.push(username);
        }

        // Add moderator
        community.addModerator(username);
        await community.save();

        res.json({ 
            message: 'Moderator added successfully',
            moderators: community.moderators 
        });
    } catch (error) {
        console.error('Error adding moderator:', error);
        res.status(500).json({ error: 'Failed to add moderator' });
    }
});

// Remove a moderator from a community (only creator can do this)
router.delete('/community/:name/moderator/:username', requireCreator, async (req, res) => {
    const { username } = req.params;

    try {
        const community = req.community;

        // Check if user is a moderator
        if (!community.moderators.includes(username)) {
            return res.status(400).json({ error: 'User is not a moderator' });
        }

        // Remove moderator
        community.removeModerator(username);
        await community.save();

        res.json({ 
            message: 'Moderator removed successfully',
            moderators: community.moderators 
        });
    } catch (error) {
        console.error('Error removing moderator:', error);
        res.status(500).json({ error: 'Failed to remove moderator' });
    }
});

// Get moderators of a community
router.get('/community/:name/moderators', async (req, res) => {
    try {
        const community = await Community.findOne({ name: req.params.name });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }

        // Get detailed moderator information
        const moderatorDetails = await User.find(
            { username: { $in: [community.creator, ...community.moderators] } },
            { username: 1, profilePic: 1, _id: 0 }
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

// Join a community
router.post('/community/:name/join', requireAuth, async (req, res) => {
    try {
        const community = await Community.findOne({ name: req.params.name });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }

        const username = req.session.user.username;
        
        if (!community.members.includes(username)) {
            community.members.push(username);
            await community.save();
        }

        res.json({ message: 'Successfully joined community' });
    } catch (error) {
        console.error('Error joining community:', error);
        res.status(500).json({ error: 'Failed to join community' });
    }
});

// Leave a community
router.post('/community/:name/leave', requireAuth, async (req, res) => {
    try {
        const community = await Community.findOne({ name: req.params.name });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }

        const username = req.session.user.username;
        
        // Creator cannot leave their own community
        if (community.creator === username) {
            return res.status(400).json({ error: 'Creator cannot leave their own community' });
        }

        // Remove from members and moderators
        community.members = community.members.filter(member => member !== username);
        community.removeModerator(username);
        await community.save();

        res.json({ message: 'Successfully left community' });
    } catch (error) {
        console.error('Error leaving community:', error);
        res.status(500).json({ error: 'Failed to leave community' });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
//const Post = require('../models/Post'); // Assuming you have a Post model

// GET all communities
router.get('/communities', async (req, res) => {
    console.log('GET /communities');
    try {
        const communities = await Community.find();
        res.json(communities);
    } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({ error: 'Failed to fetch communities' });
    }
});

// POST create a new community
router.post('/community', async (req, res) => {
    console.log('POST /community');
    const { name, description } = req.body;

    try {
        const newCommunity = new Community({ name, description });
        const savedCommunity = await newCommunity.save();
        res.status(201).json(savedCommunity);
    } catch (error) {
        console.error('Error creating community:', error);
        res.status(500).json({ error: 'Failed to create community' });
    }
});

// GET a specific community page
router.get('/:name', async (req, res) => {
    const { name } = req.params;
    console.log(`GET /community/${name}`);

    try {
        const community = await Community.findOne({ name });
        const posts = await Post.find({ community: name }); // Fetch posts for this community

        if (community) {
            res.render('community', {
                community,
                posts
            });
        } else {
            res.status(404).send('Community not found');
        }
    } catch (error) {
        console.error('Error fetching community:', error);
        res.status(500).json({ error: 'Failed to fetch community' });
    }
});

module.exports = router;

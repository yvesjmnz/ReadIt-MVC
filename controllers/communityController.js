const express = require('express');
const router = express.Router();
const Community = require('../models/Community'); // Adjust the path as per your project structure

// GET all communities
router.get('/communities', async (req, res) => {
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
    const { name, description } = req.body;

    try {
        const newCommunity = new Community({ name, description });
        await newCommunity.save();
        res.status(201).json(newCommunity);
    } catch (error) {
        console.error('Error creating community:', error);
        res.status(500).json({ error: 'Failed to create community' });
    }
});

module.exports = router;

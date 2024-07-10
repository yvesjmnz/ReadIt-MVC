const express = require('express');
const router = express.Router();
const Community = require('../models/Community');

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

    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    try {
        const newCommunity = new Community({ name, description });
        const savedCommunity = await newCommunity.save();
        res.status(201).json(savedCommunity);
    } catch (error) {
        console.error('Error creating community:', error);
        res.status(500).json({ error: 'Failed to create community' });
    }
});

module.exports = router;

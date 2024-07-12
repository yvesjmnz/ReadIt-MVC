
const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const Post = require('../models/Post');


router.get('/communities', async (req, res) => {
    try {
        const communities = await Community.find();
        res.json(communities);
    } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({ error: 'Failed to fetch communities' });
    }
});


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


router.get('/community/:name', async (req, res) => {
    try {
        const community = await Community.findOne({ name: req.params.name });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }
        

        const posts = await Post.find({ community: community._id });
        res.render('community', { community, posts: posts.length > 0 ? posts : null, user: req.session.user });
        
    } catch (error) {
        console.error('Error fetching community:', error);
        res.status(500).json({ error: 'Failed to fetch community' });
       
    }
});


module.exports = router;
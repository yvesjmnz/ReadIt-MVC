const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// GET all posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (error) {
        console.error('Error fetching pots:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// POST create a new post
router.post('/Post', async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    try {
        const newPost= new Post({ name, description });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        console.error('Error creating a post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

module.exports = router;

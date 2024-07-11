const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); // Import the Post model

// GET all posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// POST create a new post
router.post('/post', async (req, res) => {
    const { user, title, post_description, likes, dislikes, comments, date } = req.body;

    if (!user || !title || !post_description) {
        return res.status(400).json({ error: 'User, title, and post_description are required' });
    }

    try {
        const newPost = new Post({ user, title, post_description, likes, dislikes, comments, date });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        console.error('Error creating a post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

module.exports = router;

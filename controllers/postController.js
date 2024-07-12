const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); 


router.get('/post', async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});


router.post('/post', async (req, res) => {
    const {  user, title, post_description, likes, dislikes, comments, date } = req.body;

    try {
        const newPost = new Post({ user, title, post_description, likes, dislikes, comments, date});
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

module.exports = router;

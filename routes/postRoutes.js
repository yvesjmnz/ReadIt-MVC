const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

router.post('/post', async (req, res) => {
    const { title, post_description } = req.body;

    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    try {
        const newPost = new Post({ 
            user: req.session.user.username,
            title, 
            post_description
        });

        await newPost.save();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to create post' });
    }
});

module.exports = router;

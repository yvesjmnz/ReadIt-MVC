const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const Post = require('../models/Post');

// Existing routes ...

// Route to create a post
router.post('/api/posts', async (req, res) => {
    const { title, postDescription } = req.body;

    if (!title || !postDescription) {
        return res.status(400).json({ error: 'Title and post description are required' });
    }

    try {
        const newPost = new Post({
            title,
            post_description: postDescription,
            user: req.session.user.username
        });
        await newPost.save();

        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Other routes ...

module.exports = router;

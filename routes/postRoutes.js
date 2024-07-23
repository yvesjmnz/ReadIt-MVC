const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Create a new post
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

// Get all posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find({}).lean();
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to retrieve posts' });
    }
});

// Add a comment to a post
router.post('/post/:_id/comment', async (req, res) => {
    const { _id } = req.params;
    const { comment } = req.body;

    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    try {
        const post = await Post.findById(_id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        post.comments.push({
            user: req.session.user.username,
            text: comment
        });

        await post.save();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to add comment' });
    }
});

module.exports = router;
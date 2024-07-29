const express = require('express');
const router = express.Router();
const Post = require('../models/Post');



// Create a new post
router.post('/post', async (req, res) => {
    const { title, post_description, communityName } = req.body;

    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    try {
        const newPost = new Post({ 
            user: req.session.user.username,
            communityName,
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

// Like a post
router.post('/post/:_id/like', async (req, res) => {
    const { _id } = req.params;

    try {
        const post = await Post.findById(_id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        post.likes += 1;
        await post.save();
        res.json({ likes: post.likes, dislikes: post.dislikes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to update likes' });
    }
});

// Dislike a post
router.post('/post/:_id/dislike', async (req, res) => {
    const { _id } = req.params;

    try {
        const post = await Post.findById(_id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        post.dislikes += 1;
        await post.save();
        res.json({ likes: post.likes, dislikes: post.dislikes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to update dislikes' });
    }
});







module.exports = router;

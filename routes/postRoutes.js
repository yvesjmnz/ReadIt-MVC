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
        res.render('posts', { posts }); 
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
    const userId = req.session.user.username;

    try {
        const post = await Post.findById(_id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        post.likedBy = post.likedBy || [];
        post.dislikedBy = post.dislikedBy || [];

        if (post.likedBy.includes(userId)) {
            // User already liked, so unlike
            post.likes -= 1;
            post.likedBy.pull(userId);
        } else {
            // User liked the post
            post.likes += 1;
            post.likedBy.push(userId);
            // If the user had previously disliked the post, remove the dislike
            if (post.dislikedBy.includes(userId)) {
                post.dislikes -= 1;
                post.dislikedBy.pull(userId);
            }
        }

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
    const userId = req.session.user.username;

    try {
        const post = await Post.findById(_id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        post.likedBy = post.likedBy || [];
        post.dislikedBy = post.dislikedBy || [];

        if (post.dislikedBy.includes(userId)) {
            // User already disliked, so remove dislike
            post.dislikes -= 1;
            post.dislikedBy.pull(userId);
        } else {
            // User disliked the post
            post.dislikes += 1;
            post.dislikedBy.push(userId);
            // If the user had previously liked the post, remove the like
            if (post.likedBy.includes(userId)) {
                post.likes -= 1;
                post.likedBy.pull(userId);
            }
        }

        await post.save();
        res.json({ likes: post.likes, dislikes: post.dislikes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to update dislikes' });
    }
});

// Render a post by ID
router.get('/post/:_id', async (req, res) => {
    const { _id } = req.params;

    try {
        const post = await Post.findById(_id).lean();
        if (!post) {
            return res.status(404).send('Post not found');
        }

        // Mark comments by the logged-in user
        post.comments = post.comments.map(comment => ({
            ...comment,
            isOwner: comment.user === req.session.user
        }));

        res.render('post', { post, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve post');
    }
});

// Edit a post
router.put('/post/:id', async (req, res) => {
    const { id } = req.params;
    const { title, post_description } = req.body;

    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    try {
        const post = await Post.findByIdAndUpdate(id, { title, post_description }, { new: true });
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        res.json({ success: true, post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to edit post' });
    }
});

// Delete a post
router.delete('/post/:id', async (req, res) => {
    const { id } = req.params;

    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    try {
        const post = await Post.findByIdAndDelete(id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to delete post' });
    }
});

// Edit a comment
router.put('/post/:postId/comment/:commentId', async (req, res) => {
    const { postId, commentId } = req.params;
    const { newText } = req.body;

    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, error: 'Comment not found' });
        }

        if (comment.user !== req.session.user.username) {
            return res.status(403).json({ success: false, error: 'Not authorized to edit this comment' });
        }

        comment.text = newText;
        comment.edited = true;
        await post.save();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to edit comment' });
    }
});

// Delete a comment
router.delete('/post/:postId/comment/:commentId', async (req, res) => {
    const { postId, commentId } = req.params;

    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, error: 'Comment not found' });
        }

        if (comment.user !== req.session.user.username) {
            return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
        }

        // Remove the comment from the comments array
        post.comments.pull(commentId);
        await post.save();

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to delete comment' });
    }
});

module.exports = router;

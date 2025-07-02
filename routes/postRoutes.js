const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Community = require('../models/Community');
const { requireAuth } = require('../middleware/authMiddleware');

// ============ VIEW ROUTES (HTML RENDERING) ============

// Render posts list page
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find({}).sort({ date: -1 }).lean();
        res.render('posts', { posts }); 
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { 
            status: '500',
            message: 'Failed to retrieve posts',
            description: 'There was an error loading the posts. Please try again later.'
        });
    }
});

// Render individual post page
router.get('/post/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await Post.findById(postId).lean();
        if (!post) {
            return res.status(404).render('error', { 
                status: '404',
                message: 'Post not found',
                description: 'The post you are looking for does not exist.'
            });
        }

        // Get community info if post belongs to a community
        let community = null;
        let userRole = 'member';
        let isCreator = false;
        let isModerator = false;
        
        if (post.communityName) {
            community = await Community.findOne({ name: post.communityName });
            if (community && req.session.user) {
                const username = req.session.user.username;
                if (community.creator === username) {
                    userRole = 'creator';
                    isCreator = true;
                    isModerator = true; // Creator is also a moderator
                } else if (community.isModerator(username)) {
                    userRole = 'moderator';
                    isModerator = true;
                }
            }
        }

        // Prepare user info
        const currentUser = req.session.user;
        const isLoggedIn = !!currentUser;
        const isPostOwner = isLoggedIn && post.user === currentUser.username;

        // Process comments with simplified logic
        const processedComments = post.comments.map(comment => {
            const isCommentOwner = isLoggedIn && comment.user === currentUser.username;
            const canEditComment = isCommentOwner;
            const canDeleteComment = isCommentOwner || isModerator;
            
            return {
                ...comment,
                isOwner: isCommentOwner,
                canEdit: canEditComment,
                canDelete: canDeleteComment,
                showModLabel: !isCommentOwner && isModerator,
                formattedDate: comment.date ? new Date(comment.date).toLocaleString() : ''
            };
        });

        // Prepare post data with simplified flags
        const postData = {
            ...post,
            comments: processedComments,
            canEdit: isPostOwner,
            canDelete: isPostOwner || isModerator,
            showModLabel: !isPostOwner && isModerator,
            formattedDate: post.date ? new Date(post.date).toLocaleString() : ''
        };

        // Prepare template data
        const templateData = {
            post: postData,
            user: currentUser,
            community,
            userRole,
            isCreator,
            isModerator,
            isLoggedIn,
            isPostOwner,
            showModeratorBadge: isCreator || isModerator
        };

        res.render('post', templateData);
    } catch (error) {
        console.error('Error rendering post:', error);
        res.status(500).render('error', { 
            status: '500',
            message: 'Failed to retrieve post',
            description: 'There was an error loading the post. Please try again later.'
        });
    }
});

// ============ API ROUTES (JSON RESPONSES) ============

// Get all posts (API)
router.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get posts by community (API)
router.get('/api/posts/community/:communityName', async (req, res) => {
    try {
        const posts = await Post.find({ communityName: req.params.communityName }).sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching community posts:', error);
        res.status(500).json({ error: 'Failed to fetch community posts' });
    }
});

// Get a specific post (API)
router.get('/api/post/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Create a new post (API)
router.post('/api/post', requireAuth, async (req, res) => {
    const { title, post_description, communityName } = req.body;

    // Validation
    if (!title || !post_description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    if (title.length < 5 || title.length > 200) {
        return res.status(400).json({ error: 'Title must be between 5 and 200 characters' });
    }

    if (post_description.length < 10 || post_description.length > 5000) {
        return res.status(400).json({ error: 'Description must be between 10 and 5000 characters' });
    }

    try {
        // Verify community exists if specified
        if (communityName) {
            const community = await Community.findOne({ name: communityName });
            if (!community) {
                return res.status(404).json({ error: 'Community not found' });
            }
        }

        const user = req.session.user.username;
        const newPost = new Post({ 
            user, 
            title, 
            post_description, 
            communityName: communityName || null,
            likes: 0,
            dislikes: 0,
            likedBy: [],
            dislikedBy: [],
            comments: []
        });
        
        await newPost.save();
        res.status(201).json({ success: true, post: newPost });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Update a post (only by author or moderator) (API)
router.put('/api/post/:id', requireAuth, async (req, res) => {
    const { title, post_description } = req.body;

    // Validation
    if (!title || !post_description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    if (title.length < 5 || title.length > 200) {
        return res.status(400).json({ error: 'Title must be between 5 and 200 characters' });
    }

    if (post_description.length < 10 || post_description.length > 5000) {
        return res.status(400).json({ error: 'Description must be between 10 and 5000 characters' });
    }

    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const username = req.session.user.username;
        let canEdit = post.user === username;

        // Check if user is a moderator of the community
        if (!canEdit && post.communityName) {
            const community = await Community.findOne({ name: post.communityName });
            if (community && community.isModerator(username)) {
                canEdit = true;
            }
        }

        if (!canEdit) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        post.title = title;
        post.post_description = post_description;
        await post.save();

        res.json({ success: true, post });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete a post (only by author or moderator) (API)
router.delete('/api/post/:id', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const username = req.session.user.username;
        let canDelete = post.user === username;

        // Check if user is a moderator of the community
        if (!canDelete && post.communityName) {
            const community = await Community.findOne({ name: post.communityName });
            if (community && community.isModerator(username)) {
                canDelete = true;
            }
        }

        if (!canDelete) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Like a post (API)
router.post('/api/post/:id/like', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const username = req.session.user.username;

        // Remove from disliked if previously disliked
        if (post.dislikedBy.includes(username)) {
            post.dislikedBy = post.dislikedBy.filter(user => user !== username);
            post.dislikes = Math.max(0, post.dislikes - 1);
        }

        // Toggle like
        if (post.likedBy.includes(username)) {
            post.likedBy = post.likedBy.filter(user => user !== username);
            post.likes = Math.max(0, post.likes - 1);
        } else {
            post.likedBy.push(username);
            post.likes += 1;
        }

        await post.save();
        res.json({ success: true, likes: post.likes, dislikes: post.dislikes });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ error: 'Failed to like post' });
    }
});

// Dislike a post (API)
router.post('/api/post/:id/dislike', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const username = req.session.user.username;

        // Remove from liked if previously liked
        if (post.likedBy.includes(username)) {
            post.likedBy = post.likedBy.filter(user => user !== username);
            post.likes = Math.max(0, post.likes - 1);
        }

        // Toggle dislike
        if (post.dislikedBy.includes(username)) {
            post.dislikedBy = post.dislikedBy.filter(user => user !== username);
            post.dislikes = Math.max(0, post.dislikes - 1);
        } else {
            post.dislikedBy.push(username);
            post.dislikes += 1;
        }

        await post.save();
        res.json({ success: true, likes: post.likes, dislikes: post.dislikes });
    } catch (error) {
        console.error('Error disliking post:', error);
        res.status(500).json({ error: 'Failed to dislike post' });
    }
});

// Add a comment to a post (API)
router.post('/api/post/:id/comment', requireAuth, async (req, res) => {
    const { text } = req.body;

    // Validation
    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Comment text is required' });
    }

    if (text.length > 1000) {
        return res.status(400).json({ error: 'Comment must be less than 1000 characters' });
    }

    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = {
            user: req.session.user.username,
            text: text.trim(),
            date: new Date(),
            edited: false
        };

        post.comments.push(comment);
        await post.save();

        res.status(201).json({ success: true, comment });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Update a comment (only by author or moderator) (API)
router.put('/api/post/:postId/comment/:commentId', requireAuth, async (req, res) => {
    const { text } = req.body;

    // Validation
    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Comment text is required' });
    }

    if (text.length > 1000) {
        return res.status(400).json({ error: 'Comment must be less than 1000 characters' });
    }

    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const username = req.session.user.username;
        let canEdit = comment.user === username;

        // Check if user is a moderator of the community
        if (!canEdit && post.communityName) {
            const community = await Community.findOne({ name: post.communityName });
            if (community && community.isModerator(username)) {
                canEdit = true;
            }
        }

        if (!canEdit) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        comment.text = text.trim();
        comment.edited = true;
        await post.save();

        res.json({ success: true, comment });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

// Delete a comment (only by author or moderator) (API)
router.delete('/api/post/:postId/comment/:commentId', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const username = req.session.user.username;
        let canDelete = comment.user === username;

        // Check if user is a moderator of the community
        if (!canDelete && post.communityName) {
            const community = await Community.findOne({ name: post.communityName });
            if (community && community.isModerator(username)) {
                canDelete = true;
            }
        }

        if (!canDelete) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        post.comments.pull(req.params.commentId);
        await post.save();

        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

module.exports = router;
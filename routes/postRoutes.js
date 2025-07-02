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
        let viewerRole = 'member'; // Role of the person viewing the post
        let postAuthorRole = 'member'; // Role of the person who created the post
        let viewerIsCreator = false;
        let viewerIsModerator = false;
        let postAuthorIsCreator = false;
        let postAuthorIsModerator = false;
        
        if (post.communityName) {
            community = await Community.findOne({ name: post.communityName });
            if (community) {
                // Check post author's role in the community
                if (community.creator === post.user) {
                    postAuthorRole = 'creator';
                    postAuthorIsCreator = true;
                    postAuthorIsModerator = true;
                } else if (community.isModerator(post.user)) {
                    postAuthorRole = 'moderator';
                    postAuthorIsModerator = true;
                }

                // Check viewer's role in the community (for permissions)
                if (req.session.user) {
                    const username = req.session.user.username;
                    if (community.creator === username) {
                        viewerRole = 'creator';
                        viewerIsCreator = true;
                        viewerIsModerator = true;
                    } else if (community.isModerator(username)) {
                        viewerRole = 'moderator';
                        viewerIsModerator = true;
                    }
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
            const canEditComment = isCommentOwner && !post.locked;
            const canDeleteComment = (isCommentOwner || viewerIsModerator) && !post.locked;
            
            // Determine comment author's role
            let commentAuthorRole = 'member';
            let commentAuthorIsCreator = false;
            let commentAuthorIsModerator = false;
            
            if (community) {
                if (community.creator === comment.user) {
                    commentAuthorRole = 'creator';
                    commentAuthorIsCreator = true;
                    commentAuthorIsModerator = true;
                } else if (community.isModerator(comment.user)) {
                    commentAuthorRole = 'moderator';
                    commentAuthorIsModerator = true;
                }
            }
            
            return {
                ...comment,
                isOwner: isCommentOwner,
                canEdit: canEditComment,
                canDelete: canDeleteComment,
                showModLabel: !isCommentOwner && viewerIsModerator,
                formattedDate: comment.date ? new Date(comment.date).toLocaleString() : '',
                authorRole: commentAuthorRole,
                authorIsCreator: commentAuthorIsCreator,
                authorIsModerator: commentAuthorIsModerator
            };
        });

        // Process violations for display
        const processedViolations = post.violations ? post.violations.map(violation => ({
            ...violation,
            formattedDate: violation.date ? new Date(violation.date).toLocaleString() : ''
        })) : [];

        // Prepare post data with simplified flags
        const postData = {
            ...post,
            comments: processedComments,
            violations: processedViolations,
            canEdit: isPostOwner && !post.locked,
            canDelete: (isPostOwner || viewerIsModerator) && !post.locked,
            canLock: viewerIsModerator,
            showModLabel: !isPostOwner && viewerIsModerator,
            formattedDate: post.date ? new Date(post.date).toLocaleString() : '',
            lockedFormattedDate: post.lockedAt ? new Date(post.lockedAt).toLocaleString() : '',
            authorRole: postAuthorRole,
            authorIsCreator: postAuthorIsCreator,
            authorIsModerator: postAuthorIsModerator
        };

        // Check for moderation success message
        const moderated = req.query.moderated === 'true';
        const action = req.query.action;
        let moderationMessage = null;
        if (moderated && action) {
            moderationMessage = action === 'lock' ? 'Post has been locked successfully.' : 'Post has been unlocked successfully.';
        }

        // Prepare template data
        const templateData = {
            post: postData,
            user: currentUser,
            community,
            viewerRole, // Role of the person viewing the post
            viewerIsCreator,
            viewerIsModerator,
            isLoggedIn,
            isPostOwner,
            moderationMessage
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
            comments: [],
            locked: false,
            violations: []
        });
        
        await newPost.save();
        res.status(201).json({ success: true, post: newPost });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Update a post (only by author or moderator, not if locked) (API)
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

        if (post.locked) {
            return res.status(403).json({ error: 'Cannot edit locked post' });
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

// Delete a post (only by author or moderator, not if locked) (API)
router.delete('/api/post/:id', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.locked) {
            return res.status(403).json({ error: 'Cannot delete locked post' });
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

// Lock/Unlock a post with violation logging (Form submission)
router.post('/post/:id/moderate', requireAuth, async (req, res) => {
    const { action, reason } = req.body;

    // Validation
    if (!action || !['lock', 'unlock'].includes(action)) {
        return res.status(400).render('error', {
            status: '400',
            message: 'Invalid action',
            description: 'Action must be either lock or unlock.'
        });
    }

    if (action === 'lock' && (!reason || reason.trim().length < 5)) {
        return res.status(400).render('error', {
            status: '400',
            message: 'Violation reason required',
            description: 'Please provide a detailed reason for locking this post (minimum 5 characters).'
        });
    }

    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).render('error', {
                status: '404',
                message: 'Post not found',
                description: 'The post you are trying to moderate does not exist.'
            });
        }

        const username = req.session.user.username;
        let canModerate = false;

        // Check if user is a moderator of the community
        if (post.communityName) {
            const community = await Community.findOne({ name: post.communityName });
            if (community && community.isModerator(username)) {
                canModerate = true;
            }
        }

        if (!canModerate) {
            return res.status(403).render('error', {
                status: '403',
                message: 'Permission denied',
                description: 'Only moderators can lock/unlock posts.'
            });
        }

        // Perform the action
        if (action === 'lock') {
            if (post.locked) {
                return res.status(400).render('error', {
                    status: '400',
                    message: 'Post already locked',
                    description: 'This post is already locked.'
                });
            }

            post.locked = true;
            post.lockedBy = username;
            post.lockedAt = new Date();
            post.lockReason = reason.trim();

            // Add violation record
            post.violations.push({
                moderator: username,
                reason: reason.trim(),
                action: 'locked',
                date: new Date()
            });

        } else if (action === 'unlock') {
            if (!post.locked) {
                return res.status(400).render('error', {
                    status: '400',
                    message: 'Post not locked',
                    description: 'This post is not currently locked.'
                });
            }

            post.locked = false;
            post.lockedBy = undefined;
            post.lockedAt = undefined;
            post.lockReason = undefined;

            // Add violation record for unlock
            post.violations.push({
                moderator: username,
                reason: reason ? reason.trim() : 'Post unlocked by moderator',
                action: 'unlocked',
                date: new Date()
            });
        }

        await post.save();

        // Redirect back to the post with success message
        res.redirect(`/post/${req.params.id}?moderated=true&action=${action}`);

    } catch (error) {
        console.error('Error moderating post:', error);
        res.status(500).render('error', {
            status: '500',
            message: 'Failed to moderate post',
            description: 'There was an error processing your moderation action. Please try again later.'
        });
    }
});

// Like a post (not if locked) (API)
router.post('/api/post/:id/like', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.locked) {
            return res.status(403).json({ error: 'Cannot like locked post' });
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

// Dislike a post (not if locked) (API)
router.post('/api/post/:id/dislike', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.locked) {
            return res.status(403).json({ error: 'Cannot dislike locked post' });
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

// Add a comment to a post (not if locked) (API)
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

        if (post.locked) {
            return res.status(403).json({ error: 'Cannot comment on locked post' });
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

// Update a comment (only by author or moderator, not if locked) (API)
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

        if (post.locked) {
            return res.status(403).json({ error: 'Cannot edit comments on locked post' });
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

// Delete a comment (only by author or moderator, not if locked) (API)
router.delete('/api/post/:postId/comment/:commentId', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.locked) {
            return res.status(403).json({ error: 'Cannot delete comments on locked post' });
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
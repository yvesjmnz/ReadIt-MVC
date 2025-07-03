const express = require('express');
const router = express.Router();
const PostService = require('../../services/postService');
const { requireAuth } = require('../../middleware/authMiddleware');
const { validatePost, validateComment } = require('../../middleware/validation');
const { validatePostId, validateCommentRoute } = require('../../middleware/paramValidation');
const { handleApiError } = require('../../middleware/errorHandler');

// Get all posts
router.get('/', async (req, res, next) => {
    try {
        const posts = await PostService.findAll();
        res.json(posts);
    } catch (error) {
        next(error);
    }
});

// Get posts by community
router.get('/community/:communityName', async (req, res, next) => {
    try {
        const posts = await PostService.findByCommunity(req.params.communityName);
        res.json(posts);
    } catch (error) {
        next(error);
    }
});

// Get specific post
router.get('/:id', validatePostId, async (req, res, next) => {
    try {
        const post = await PostService.findById(req.params.id);
        if (!post) throw new Error('Post not found');
        res.json(post);
    } catch (error) {
        next(error);
    }
});

// Create post
router.post('/', requireAuth, validatePost, async (req, res, next) => {
    try {
        const { title, post_description, communityName } = req.body;
        const user = req.session.user.username;
        
        const post = await PostService.create({
            user,
            title,
            post_description,
            communityName: communityName || null
        });
        
        res.status(201).json({ success: true, post });
    } catch (error) {
        next(error);
    }
});

// Update post
router.put('/:id', validatePostId, requireAuth, validatePost, async (req, res, next) => {
    try {
        const { title, post_description } = req.body;
        const post = await PostService.update(req.params.id, { title, post_description }, req.session.user.username);
        res.json({ success: true, post });
    } catch (error) {
        next(error);
    }
});

// Delete post
router.delete('/:id', validatePostId, requireAuth, async (req, res, next) => {
    try {
        await PostService.delete(req.params.id, req.session.user.username);
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Like post
router.post('/:id/like', validatePostId, requireAuth, async (req, res, next) => {
    try {
        const result = await PostService.toggleLike(req.params.id, req.session.user.username);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

// Dislike post
router.post('/:id/dislike', validatePostId, requireAuth, async (req, res, next) => {
    try {
        const result = await PostService.toggleDislike(req.params.id, req.session.user.username);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

// Add comment
router.post('/:id/comment', validatePostId, requireAuth, validateComment, async (req, res, next) => {
    try {
        const { text } = req.body;
        const comment = await PostService.addComment(req.params.id, text, req.session.user.username);
        res.status(201).json({ success: true, comment });
    } catch (error) {
        next(error);
    }
});

// Update comment
router.put('/:postId/comment/:commentId', validateCommentRoute, requireAuth, validateComment, async (req, res, next) => {
    try {
        const { text } = req.body;
        const comment = await PostService.updateComment(req.params.postId, req.params.commentId, text, req.session.user.username);
        res.json({ success: true, comment });
    } catch (error) {
        next(error);
    }
});

// Delete comment
router.delete('/:postId/comment/:commentId', validateCommentRoute, requireAuth, async (req, res, next) => {
    try {
        await PostService.deleteComment(req.params.postId, req.params.commentId, req.session.user.username);
        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Moderate post (lock/unlock)
router.post('/:id/moderate', validatePostId, requireAuth, async (req, res, next) => {
    try {
        const { action, reason } = req.body;
        
        if (!action || !['lock', 'unlock'].includes(action)) {
            return res.status(400).json({ error: 'Action must be either lock or unlock' });
        }

        if (action === 'lock' && (!reason || reason.trim().length < 5)) {
            return res.status(400).json({ error: 'Violation reason required (minimum 5 characters)' });
        }

        const post = await PostService.moderate(req.params.id, action, reason, req.session.user.username);
        res.json({ success: true, post, message: `Post ${action}ed successfully` });
    } catch (error) {
        next(error);
    }
});

router.use(handleApiError);

module.exports = router;
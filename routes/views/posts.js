const express = require('express');
const router = express.Router();
const PostService = require('../../services/postService');
const CommunityService = require('../../services/communityService');
const { requireAuth } = require('../../middleware/authMiddleware');
const { validateModeration } = require('../../middleware/validation');
const { validatePostId } = require('../../middleware/paramValidation');
const { handleViewError } = require('../../middleware/errorHandler');

// View posts list
router.get('/', async (req, res, next) => {
    try {
        const posts = await PostService.findAll();
        res.render('posts', { posts });
    } catch (error) {
        next(error);
    }
});

// View individual post
router.get('/:id', validatePostId, async (req, res, next) => {
    try {
        const post = await PostService.findById(req.params.id);
        if (!post) throw new Error('Post not found');

        let community = null;
        let viewerRole = 'member';
        let viewerIsModerator = false;
        let banInfo = null;

        if (post.communityName) {
            community = await CommunityService.findByName(post.communityName);
            if (community && req.session.user) {
                viewerRole = CommunityService.getUserRole(community, req.session.user.username);
                viewerIsModerator = viewerRole === 'creator' || viewerRole === 'moderator';
                
                // Get ban info if user is banned
                if (viewerRole === 'banned') {
                    banInfo = CommunityService.getBanInfo(community, req.session.user.username);
                }
            }
        }

        const currentUser = req.session.user;
        const isLoggedIn = !!currentUser;
        const isPostOwner = isLoggedIn && post.user === currentUser.username;

        // Process comments with role information
        const processedComments = post.comments.map(comment => {
            const isCommentOwner = isLoggedIn && comment.user === currentUser.username;
            const commentAuthorRole = community ? CommunityService.getUserRole(community, comment.user) : 'member';
            
            const commentObj = comment.toObject();
            
            return {
                ...commentObj,
                _id: commentObj._id.toString(), // Ensure _id is a string
                isOwner: isCommentOwner,
                canEdit: isCommentOwner && !post.locked,
                canDelete: (isCommentOwner || viewerIsModerator) && !post.locked,
                formattedDate: comment.date ? new Date(comment.date).toLocaleString() : '',
                authorRole: commentAuthorRole,
                authorIsCreator: commentAuthorRole === 'creator',
                authorIsModerator: commentAuthorRole === 'creator' || commentAuthorRole === 'moderator'
            };
        });

        // Process violations
        const processedViolations = post.violations ? post.violations.map(violation => ({
            ...violation,
            formattedDate: violation.date ? new Date(violation.date).toLocaleString() : ''
        })) : [];

        const postAuthorRole = community ? CommunityService.getUserRole(community, post.user) : 'member';

        const postObj = post.toObject();
        const postData = {
            ...postObj,
            _id: postObj._id.toString(), // Ensure post _id is a string
            comments: processedComments,
            violations: processedViolations,
            canEdit: isPostOwner && !post.locked,
            canDelete: (isPostOwner || viewerIsModerator) && !post.locked,
            canLock: viewerIsModerator,
            formattedDate: post.date ? new Date(post.date).toLocaleString() : '',
            lockedFormattedDate: post.lockedAt ? new Date(post.lockedAt).toLocaleString() : '',
            authorRole: postAuthorRole,
            authorIsCreator: postAuthorRole === 'creator',
            authorIsModerator: postAuthorRole === 'creator' || postAuthorRole === 'moderator'
        };

        // Check for moderation success message
        const moderated = req.query.moderated === 'true';
        const action = req.query.action;
        let moderationMessage = null;
        if (moderated && action) {
            moderationMessage = action === 'lock' ? 'Post has been locked successfully.' : 'Post has been unlocked successfully.';
        }

        res.render('post', {
            post: postData,
            user: currentUser,
            community,
            viewerRole,
            viewerIsCreator: viewerRole === 'creator',
            viewerIsModerator,
            banInfo,
            isLoggedIn,
            isPostOwner,
            moderationMessage
        });
    } catch (error) {
        next(error);
    }
});

// Moderate post (lock/unlock)
router.post('/:id/moderate', validatePostId, requireAuth, validateModeration, async (req, res, next) => {
    try {
        const { action, reason } = req.body;
        await PostService.moderate(req.params.id, action, reason, req.session.user.username);
        res.redirect(`/post/${req.params.id}?moderated=true&action=${action}`);
    } catch (error) {
        next(error);
    }
});

router.use(handleViewError);

module.exports = router;
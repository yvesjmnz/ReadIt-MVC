const validateObjectId = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!id) {
            return res.status(400).json({ error: `${paramName} parameter is required` });
        }
        
        if (id === 'undefined' || id === 'null') {
            return res.status(400).json({ error: `Invalid ${paramName} parameter` });
        }
        
        // Convert to string if it's not already
        const idString = String(id);
        
        // Validate ObjectId format (24 character hex string)
        if (!idString.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: `Invalid ${paramName} format - expected 24 character hex string, received: ${idString}` });
        }
        
        next();
    };
};

const validatePostId = validateObjectId('id');
const validateCommentId = validateObjectId('commentId');

// Custom validator for comment routes that use postId parameter
const validatePostIdParam = validateObjectId('postId');

// Combined validator for comment routes
const validateCommentRoute = (req, res, next) => {
    try {
        // Validate postId
        const postId = req.params.postId;
        if (!postId) {
            return res.status(400).json({ error: 'postId parameter is required' });
        }
        if (postId === 'undefined' || postId === 'null') {
            return res.status(400).json({ error: 'Invalid postId parameter' });
        }
        const postIdString = String(postId);
        if (!postIdString.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: `Invalid postId format - expected 24 character hex string, received: ${postIdString}` });
        }

        // Validate commentId
        const commentId = req.params.commentId;
        if (!commentId) {
            return res.status(400).json({ error: 'commentId parameter is required' });
        }
        if (commentId === 'undefined' || commentId === 'null') {
            return res.status(400).json({ error: 'Invalid commentId parameter' });
        }
        const commentIdString = String(commentId);
        if (!commentIdString.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: `Invalid commentId format - expected 24 character hex string, received: ${commentIdString}` });
        }

        next();
    } catch (error) {
        return res.status(400).json({ error: 'Parameter validation failed' });
    }
};

module.exports = {
    validateObjectId,
    validatePostId,
    validateCommentId,
    validatePostIdParam,
    validateCommentRoute
};
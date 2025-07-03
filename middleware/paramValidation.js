const validateObjectId = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!id) {
            return res.status(400).json({ error: `${paramName} parameter is required` });
        }
        
        if (id === 'undefined' || id === 'null') {
            return res.status(400).json({ error: `Invalid ${paramName} parameter` });
        }
        
        // Validate ObjectId format (24 character hex string)
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: `Invalid ${paramName} format` });
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
    // Validate postId first
    const postIdValidator = validateObjectId('postId');
    postIdValidator(req, res, (err) => {
        if (err) return next(err);
        
        // Then validate commentId
        const commentIdValidator = validateObjectId('commentId');
        commentIdValidator(req, res, next);
    });
};

module.exports = {
    validateObjectId,
    validatePostId,
    validateCommentId,
    validatePostIdParam,
    validateCommentRoute
};
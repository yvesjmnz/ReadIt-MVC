const logger = require('../services/loggerService');

const validateCommunity = (req, res, next) => {
    const { name, description } = req.body;
    const username = req.session?.user?.username;

    if (!name || !description) {
        logger.logValidationFailure('name/description', { name, description }, 'required', username, req.ip);
        return res.status(400).json({ error: 'Name and description are required' });
    }

    if (name.length < 3 || name.length > 50) {
        logger.logValidationFailure('name', name, 'length (3-50)', username, req.ip);
        return res.status(400).json({ error: 'Community name must be between 3 and 50 characters' });
    }

    if (description.length < 10 || description.length > 500) {
        logger.logValidationFailure('description', description, 'length (10-500)', username, req.ip);
        return res.status(400).json({ error: 'Description must be between 10 and 500 characters' });
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/g;
    if (specialCharRegex.test(name)) {
        logger.logValidationFailure('name', name, 'no special characters', username, req.ip);
        return res.status(400).json({ error: 'Community name cannot contain special characters' });
    }

    next();
};

const validatePost = (req, res, next) => {
    const { title, post_description } = req.body;
    const username = req.session?.user?.username;

    if (!title || !post_description) {
        logger.logValidationFailure('title/description', { title, post_description }, 'required', username, req.ip);
        return res.status(400).json({ error: 'Title and description are required' });
    }

    if (title.length < 5 || title.length > 200) {
        logger.logValidationFailure('title', title, 'length (5-200)', username, req.ip);
        return res.status(400).json({ error: 'Title must be between 5 and 200 characters' });
    }

    if (post_description.length < 10 || post_description.length > 5000) {
        logger.logValidationFailure('post_description', post_description, 'length (10-5000)', username, req.ip);
        return res.status(400).json({ error: 'Description must be between 10 and 5000 characters' });
    }

    next();
};

const validateComment = (req, res, next) => {
    const { text } = req.body;
    const username = req.session?.user?.username;

    if (!text || text.trim().length === 0) {
        logger.logValidationFailure('comment_text', text, 'required', username, req.ip);
        return res.status(400).json({ error: 'Comment text is required' });
    }

    if (text.length > 1000) {
        logger.logValidationFailure('comment_text', text, 'length (max 1000)', username, req.ip);
        return res.status(400).json({ error: 'Comment must be less than 1000 characters' });
    }

    next();
};

const validateModeration = (req, res, next) => {
    const { action, reason } = req.body;
    const username = req.session?.user?.username;

    if (!action || !['lock', 'unlock'].includes(action)) {
        logger.logValidationFailure('moderation_action', action, 'invalid action', username, req.ip);
        return res.status(400).json({ error: 'Action must be either lock or unlock' });
    }

    if (action === 'lock' && (!reason || reason.trim().length < 5)) {
        logger.logValidationFailure('moderation_reason', reason, 'insufficient reason length', username, req.ip);
        return res.status(400).json({ error: 'Violation reason required (minimum 5 characters)' });
    }

    next();
};

module.exports = {
    validateCommunity,
    validatePost,
    validateComment,
    validateModeration
};
const validateCommunity = (req, res, next) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    if (name.length < 3 || name.length > 50) {
        return res.status(400).json({ error: 'Community name must be between 3 and 50 characters' });
    }

    if (description.length < 10 || description.length > 500) {
        return res.status(400).json({ error: 'Description must be between 10 and 500 characters' });
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/g;
    if (specialCharRegex.test(name)) {
        return res.status(400).json({ error: 'Community name cannot contain special characters' });
    }

    next();
};

const validatePost = (req, res, next) => {
    const { title, post_description } = req.body;

    if (!title || !post_description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    if (title.length < 5 || title.length > 200) {
        return res.status(400).json({ error: 'Title must be between 5 and 200 characters' });
    }

    if (post_description.length < 10 || post_description.length > 5000) {
        return res.status(400).json({ error: 'Description must be between 10 and 5000 characters' });
    }

    next();
};

const validateComment = (req, res, next) => {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Comment text is required' });
    }

    if (text.length > 1000) {
        return res.status(400).json({ error: 'Comment must be less than 1000 characters' });
    }

    next();
};

const validateModeration = (req, res, next) => {
    const { action, reason } = req.body;

    if (!action || !['lock', 'unlock'].includes(action)) {
        return res.status(400).json({ error: 'Action must be either lock or unlock' });
    }

    if (action === 'lock' && (!reason || reason.trim().length < 5)) {
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
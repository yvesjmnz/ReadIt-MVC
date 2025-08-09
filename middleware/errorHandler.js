const logger = require('../services/loggerService');

const handleApiError = (error, req, res, next) => {
    // Do not leak stack traces; log a sanitized entry instead
    logger.logValidationFailure('api', req.path, 'api error', req.session?.user?.username || null, req.ip);

    if (error.code === 11000) {
        return res.status(400).json({ error: 'Resource already exists' });
    }

    if (error.message === 'Community not found' || error.message === 'Post not found') {
        return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Permission denied' || error.message.includes('Cannot')) {
        return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
};

const handleViewError = (error, req, res, next) => {
    // Do not leak stack traces; log a sanitized entry instead
    logger.logValidationFailure('view', req.path, 'view error', req.session?.user?.username || null, req.ip);

    if (error.message === 'Community not found' || error.message === 'Post not found') {
        return res.status(404).render('error', {
            status: '404',
            message: error.message,
            description: 'The resource you are looking for does not exist.'
        });
    }

    if (error.message === 'Permission denied') {
        return res.status(403).render('error', {
            status: '403',
            message: 'Permission denied',
            description: 'You do not have permission to perform this action.'
        });
    }

    if (error.message.includes('Invalid post ID') || error.message.includes('Invalid') && error.message.includes('format')) {
        return res.status(400).render('error', {
            status: '400',
            message: 'Invalid request',
            description: 'The provided ID is not valid. Please check the URL and try again.'
        });
    }

    res.status(500).render('error', {
        status: '500',
        message: 'Internal server error',
        description: 'There was an error processing your request. Please try again later.'
    });
};

module.exports = {
    handleApiError,
    handleViewError
};
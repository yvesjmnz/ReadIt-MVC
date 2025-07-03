const Community = require('../models/Community');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// Middleware to check if user is a moderator of a specific community
const requireModerator = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const communityName = req.params.name || req.body.communityName;
        if (!communityName) {
            return res.status(400).json({ error: 'Community name is required' });
        }

        const community = await Community.findOne({ name: communityName });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }

        const username = req.session.user.username;
        if (!community.isModerator(username)) {
            return res.status(403).json({ error: 'Moderator privileges required' });
        }

        req.community = community;
        next();
    } catch (error) {
        console.error('Error checking moderator status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Middleware to check if user is the creator of a community
const requireCreator = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const communityName = req.params.name || req.body.communityName;
        if (!communityName) {
            return res.status(400).json({ error: 'Community name is required' });
        }

        const community = await Community.findOne({ name: communityName });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }

        const username = req.session.user.username;
        if (community.creator !== username) {
            return res.status(403).json({ error: 'Creator privileges required' });
        }

        req.community = community;
        next();
    } catch (error) {
        console.error('Error checking creator status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//require authentication except those intended to be public
const publicPath = [
    '/signup',
    '/public/',
    '/',
];
//check public paths
const checkPublicPath = (req, res, next) => {
    const isPublic = publicPath.some(path => req.path.startsWith(path) || req.path === path);
    console.log(`[AUTH] ${req.path} → ${isPublic ? 'Public' : 'Protected'}`);
    if(isPublic) {
        return next();
    }
    
    return requireAuth(req, res, next);
};

module.exports = {
    requireAuth,
    requireModerator,
    requireCreator, 
    checkPublicPath
};
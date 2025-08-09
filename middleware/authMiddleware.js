const Community = require('../models/Community');
const logger = require('../services/loggerService');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        logger.logAccessDenied(null, req.path, 'Not authenticated', req.ip);
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// Middleware to check if user is a moderator of a specific community
const requireModerator = async (req, res, next) => {
    try {
        if (!req.session.user) {
            logger.logAccessDenied(null, `${req.path} (moderator)`, 'Not authenticated', req.ip);
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
            logger.logAccessDenied(username, `${req.path} (moderator)`, 'Not a moderator', req.ip);
            return res.status(403).json({ error: 'Moderator privileges required' });
        }

        req.community = community;
        next();
    } catch (error) {
        logger.logValidationFailure('authMiddleware', req.path, 'moderator check error', req.session?.user?.username || null, req.ip);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Middleware to check if user is the creator of a community
const requireCreator = async (req, res, next) => {
    try {
        if (!req.session.user) {
            logger.logAccessDenied(null, `${req.path} (creator)`, 'Not authenticated', req.ip);
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
            logger.logAccessDenied(username, `${req.path} (creator)`, 'Not the creator', req.ip);
            return res.status(403).json({ error: 'Creator privileges required' });
        }

        req.community = community;
        next();
    } catch (error) {
        logger.logValidationFailure('authMiddleware', req.path, 'creator check error', req.session?.user?.username || null, req.ip);
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
    // console.log(`[AUTH] ${req.path} → ${isPublic ? 'Public' : 'Protected'}`);
    if(isPublic) {
        return next();
    }
    
    return requireAuth(req, res, next);
};

// Middleware to check if user is banned site-wide
const checkBanStatus = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return next(); // Not logged in, skip ban check
        }

        const User = require('../models/User');
        const user = await User.findOne({ username: req.session.user.username });
        
        if (user && user.isBanned) {
            // Clear session for banned user
            req.session.destroy();
            
            // Always render banned page
            return res.status(403).render('banned', {
                banReason: user.banReason,
                bannedBy: user.bannedBy,
                bannedAt: user.bannedAt,
                pageTitle: 'Account Banned'
            });
        }

        next();
    } catch (error) {
        logger.logValidationFailure('authMiddleware', req.path, 'ban check error', req.session?.user?.username || null, req.ip);
        res.status(500).render('error', { 
            error: 'Internal server error',
            pageTitle: 'Error'
        });
    }
};

// Middleware to check if user is an admin
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.session.user) {
            logger.logAccessDenied(null, `${req.path} (admin)`, 'Not authenticated', req.ip);
            return res.status(401).json({ error: 'Authentication required' });
        }

        const User = require('../models/User');
        const user = await User.findOne({ username: req.session.user.username });
        
        if (!user || !user.isAdmin) {
            logger.logAccessDenied(req.session.user.username, `${req.path} (admin)`, 'Not an administrator', req.ip);
            return res.status(403).json({ error: 'Administrator privileges required' });
        }

        req.adminUser = user;
        next();
    } catch (error) {
        logger.logValidationFailure('authMiddleware', req.path, 'admin check error', req.session?.user?.username || null, req.ip);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    requireAuth,
    requireModerator,
    requireCreator, 
    requireAdmin,
    checkBanStatus,
    checkPublicPath
};
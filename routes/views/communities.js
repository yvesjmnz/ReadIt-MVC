const express = require('express');
const router = express.Router();
const CommunityService = require('../../services/communityService');
const PostService = require('../../services/postService');
const { handleViewError } = require('../../middleware/errorHandler');

// View community page
router.get('/:name', async (req, res, next) => {
    try {
        const community = await CommunityService.findByName(req.params.name);
        if (!community) throw new Error('Community not found');

        const userRole = CommunityService.getUserRole(community, req.session.user?.username);
        const banInfo = userRole === 'banned' ? CommunityService.getBanInfo(community, req.session.user?.username) : null;
        const posts = await PostService.findByCommunity(req.params.name);

        const communityData = {
            ...community.toObject(),
            userRole,
            banInfo,
            bannedUsers: community.getBannedUsersList()
        };

        res.render('community', {
            community: communityData,
            posts: posts.length > 0 ? posts : null,
            user: req.session.user,
            isLoggedIn: !!req.session.user,
            viewerRole: userRole
        });
    } catch (error) {
        next(error);
    }
});

router.use(handleViewError);

module.exports = router;
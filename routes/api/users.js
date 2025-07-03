const express = require('express');
const router = express.Router();
const UserService = require('../../services/userService');
const { handleApiError } = require('../../middleware/errorHandler');

// Get all users (for active users list)
router.get('/', async (req, res, next) => {
    try {
        const users = await UserService.findAll();
        // Return only necessary user info for privacy
        const publicUsers = users.map(user => ({
            username: user.username
        }));
        res.json(publicUsers);
    } catch (error) {
        next(error);
    }
});

router.use(handleApiError);

module.exports = router;
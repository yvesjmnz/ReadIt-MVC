const express = require('express');
const router = express.Router();
const { validateCommunity, validatePost } = require('../../middleware/validation');
const { requireAdmin } = require('../../middleware/authMiddleware');

// Test validation logging - Admin only
router.post('/community', requireAdmin, validateCommunity, (req, res) => {
    res.json({ success: true, message: 'Community validation passed' });
});

router.post('/post', requireAdmin, validatePost, (req, res) => {
    res.json({ success: true, message: 'Post validation passed' });
});

// Test endpoint to trigger various validation failures
router.post('/trigger-validation-failures', requireAdmin, (req, res) => {
    const tests = [
        {
            name: 'Empty community name',
            data: { name: '', description: 'Valid description here' },
            endpoint: '/test/validation/community'
        },
        {
            name: 'Short community name',
            data: { name: 'ab', description: 'Valid description here' },
            endpoint: '/test/validation/community'
        },
        {
            name: 'Long community name',
            data: { name: 'a'.repeat(51), description: 'Valid description here' },
            endpoint: '/test/validation/community'
        },
        {
            name: 'Special characters in name',
            data: { name: 'test@community!', description: 'Valid description here' },
            endpoint: '/test/validation/community'
        },
        {
            name: 'Short description',
            data: { name: 'validname', description: 'short' },
            endpoint: '/test/validation/community'
        },
        {
            name: 'Empty post title',
            data: { title: '', post_description: 'Valid post description here' },
            endpoint: '/test/validation/post'
        },
        {
            name: 'Short post title',
            data: { title: 'abc', post_description: 'Valid post description here' },
            endpoint: '/test/validation/post'
        }
    ];

    res.json({
        message: 'Validation test endpoints available',
        tests: tests,
        instructions: 'Use POST requests to the endpoints above with the provided data to trigger validation failures'
    });
});

module.exports = router;
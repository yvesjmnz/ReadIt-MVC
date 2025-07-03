const express = require('express');
const router = express.Router();

// Mount API routes
router.use('/api/posts', require('./api/posts'));
router.use('/api/post', require('./api/posts'));

// Mount view routes
router.use('/posts', require('./views/posts'));
router.use('/post', require('./views/posts'));

module.exports = router;
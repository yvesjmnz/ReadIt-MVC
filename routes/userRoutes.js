const express = require('express');
const router = express.Router();
const path = require('path');
const { getUserProfile, updateUserProfile, registerUser, loginUser, renderSignup, renderLogin, logoutUser } = require('../controllers/userController');
const User = require('../models/User'); 
const userController = require('../controllers/userController');
const samplePosts = require('../models/samplePost');

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        next(); // User is logged in, continue to the next middleware or route handler
    } else {
        res.redirect('/register'); // Redirect to registration page if user is not logged in
    }
};

// GET home page
router.get('/', async (req, res) => {
    try {
        res.render('home', { user: req.session.user, posts: samplePosts });
    } catch (error) {
        console.error('Error fetching home page:', error);
        res.status(500).json({ error: 'Failed to load home page' });
    }
});
// Route to render home page
router.get('/', requireLogin, (req, res) => {
    const user = req.session.user; // Ensure user object is directly accessible
    res.render('home', { user });
});

// Route to render registration page
router.get('/register', renderSignup);

// Route to handle registration form submission
router.post('/register', registerUser);

// Route to render login page
router.get('/login', renderLogin);

// Route to handle login form submission
router.post('/login', loginUser);

// Route to render user profile
router.get('/profile/:username', getUserProfile);

// Route to handle profile update including file upload
router.post('/profile/:username', (req, res) => {
    const { username } = req.params;
    const user = req.session.user;

    if (req.files && req.files.profilePic) {
        const profilePic = req.files.profilePic;
        const uploadPath = path.join(__dirname, '..', 'public', 'img', profilePic.name);

        profilePic.mv(uploadPath, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send(err);
            }

            user.profilePic = `/img/${profilePic.name}`;
            updateUserProfile(req, res);
        });
    } else {
        updateUserProfile(req, res);
    }
});

// Route to get all users
router.get('/users', userController.getAllUsers);

// Route to handle logout
router.get('/logout', logoutUser);

module.exports = router;

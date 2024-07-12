const express = require('express');
const router = express.Router();
const path = require('path');
const { getUserProfile, updateUserProfile, registerUser, loginUser, renderSignup, renderLogin, logoutUser } = require('../controllers/userController');
const User = require('../models/User'); 
const userController = require('../controllers/userController');
const samplePosts = require('../models/samplePost');
const sampleProfiles = require('../models/sampleProfiles');
const Post = require('../models/Post');

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        next(); // User is logged in, continue to the next middleware or route handler
    } else {
        res.redirect('/register'); // Redirect to registration page if user is not logged in
    }
};

// GET home page
router.get('/', requireLogin, async (req, res) => {
    try {
        const loggedInUser = req.session.user;

        // Fetch all posts from the database
        const dbPosts = await Post.find().sort({ createdAt: -1 });

        // Combine database posts with sample posts
        const posts = [...dbPosts, ...samplePosts];

        res.render('home', { user: loggedInUser, posts });
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

// GET user profile
router.get('/profile/:username', async (req, res) => {
    try {
        const loggedInUser = req.session.user;
        const username = req.params.username;

        // Check if the user exists in MongoDB
        const userFromDB = await User.findOne({ username }).lean();

        // Check if the user exists in the sampleProfiles
        const userFromSample = sampleProfiles.find(profile => profile.username === username);


        // Check if the visited user is the same as the logged-in user
        const isLoggedInUser = loggedInUser && loggedInUser.username === username;

        // Fetch posts from the database for the visited user
        const dbPosts = await Post.find({ user: username });

        // Filter sample posts by username
        const userSamplePosts = samplePosts.filter(post => post.user === username);

        // Combine both sets of posts
        const posts = [...dbPosts, ...userSamplePosts];



        if (!userFromDB && !userFromSample) {
            return res.status(404).send('User not found');
        }

        // Render user profile
        if (userFromDB) {
            // Determine if the profile belongs to the logged-in user or another user
            const isOwnProfile = loggedInUser && loggedInUser.username === username;
            if (isOwnProfile) {
                // Render user's own profile
                res.render('userProfile', { visitedUser: userFromDB, loggedInUser, posts });
            } else {
                // Render another user's profile
                res.render('profile', { visitedUser: userFromDB, loggedInUser, posts });
            }
        } else if (userFromSample) {
            // Render profile using sample data if found
            res.render('profile', { visitedUser: userFromSample, loggedInUser, posts });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

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

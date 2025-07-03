const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const PostService = require('../services/postService');
const CommunityService = require('../services/communityService');
const samplePosts = require('../models/samplePost');
const sampleProfiles = require('../models/sampleProfiles');

const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        next(); 
    } else {
        res.redirect('/register'); 
    }
};

// Home page
router.get('/', requireLogin, async (req, res) => {
    try {
        const loggedInUser = req.session.user;
        const dbPosts = await PostService.findAll();
        const posts = [...dbPosts, ...samplePosts];
        
        // Get user's communities and all communities
        const userCommunities = await CommunityService.getUserCommunities(loggedInUser.username);
        const allCommunities = await CommunityService.findAll();
        
        res.render('home', { 
            user: loggedInUser, 
            posts,
            userCommunities,
            allCommunities
        });
    } catch (error) {
        console.error('Error fetching home page:', error);
        res.status(500).json({ error: 'Failed to load home page' });
    }
});

// Registration
router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', async (req, res) => {
    try {
        const { username, password, confirmPassword, quote } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match');
        }

        const newUser = await UserService.create({
            username,
            password,
            quote
        });

        req.session.user = { 
            username: newUser.username, 
            quote: newUser.quote 
        };
        res.redirect('/');
    } catch (error) {
        console.error(error);
        if (error.message === 'User already exists') {
            return res.status(400).send(error.message);
        }
        res.status(500).send('Server Error');
    }
});

// Login
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;

        const user = await UserService.authenticate(username, password);
        
        req.session.user = { 
            username: user.username, 
            quote: user.quote 
        };

        if (rememberMe) {
            res.cookie('user', JSON.stringify(req.session.user), { 
                maxAge: 30 * 24 * 60 * 60 * 1000, 
                httpOnly: true 
            });
        }

        res.redirect('/');
    } catch (error) {
        console.error(error);
        if (error.message === 'Invalid credentials') {
            return res.status(400).send(error.message);
        }
        res.status(500).send('Server Error');
    }
});

// Profile
router.get('/profile/:username', async (req, res) => {
    try {
        const loggedInUser = req.session.user;
        const username = req.params.username;

        const userFromDB = await UserService.findByUsername(username);
        const userFromSample = sampleProfiles.find(profile => profile.username === username);

        if (!userFromDB && !userFromSample) {
            return res.status(404).send('User not found');
        }

        const dbPosts = await PostService.findAll();
        const userDbPosts = dbPosts.filter(post => post.user === username);
        const userSamplePosts = samplePosts.filter(post => post.user === username);
        const posts = [...userDbPosts, ...userSamplePosts];

        const visitedUser = userFromDB || userFromSample;
        const isOwnProfile = loggedInUser && loggedInUser.username === username;

        if (isOwnProfile) {
            // For own profile, use the fresh data from DB instead of session
            res.render('userProfile', { visitedUser, loggedInUser: visitedUser, posts });
        } else {
            res.render('profile', { visitedUser, loggedInUser, posts });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Update profile
router.post('/profile/:username', async (req, res) => {
    try {
        const { quote } = req.body;
        let updateData = { quote };

        const updatedUser = await UserService.updateProfile(req.params.username, updateData);
        
        // Update session if user is updating their own profile
        if (req.session.user && req.session.user.username === req.params.username) {
            // Update session with new profile data
            req.session.user.quote = updatedUser.quote;
            
            // Update remember me cookie if it exists
            if (req.cookies.user) {
                res.cookie('user', JSON.stringify(req.session.user), { 
                    maxAge: 30 * 24 * 60 * 60 * 1000, 
                    httpOnly: true 
                });
            }
        }
        
        res.redirect(`/profile/${req.params.username}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Get all users (API)
router.get('/users', async (req, res) => {
    try {
        const users = await UserService.findAll();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            res.status(500).send('Server Error');
        } else {
            res.clearCookie('user');
            res.redirect('/login');
        }
    });
});

module.exports = router;
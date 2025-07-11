const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const PostService = require('../services/postService');
const CommunityService = require('../services/communityService');
const PasswordResetService = require('../services/passwordResetService');
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
        
        // Check if user is admin
        const AdminService = require('../services/adminService');
        const isAdmin = await AdminService.isAdmin(loggedInUser.username);
        
        res.render('home', { 
            user: loggedInUser, 
            posts,
            userCommunities,
            allCommunities,
            isLoggedIn: !!loggedInUser,
            isAdmin
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
        const user = await UserService.authenticate(username, password, req.ip, req.get('User-Agent'));

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

        res.status(200).send('Login successful');
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
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

// Change Password (authenticated users)
router.get('/change-password', requireLogin, (req, res) => {
    res.render('changePassword', { user: req.session.user });
});

router.post('/change-password', requireLogin, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (newPassword !== confirmPassword) {
            return res.status(400).send('New passwords do not match');
        }

        await UserService.updatePassword(
            req.session.user.username, 
            currentPassword, 
            newPassword
        );

        res.status(200).send('Password changed successfully');
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

// Security Questions Setup (authenticated users)
router.get('/security-questions', requireLogin, async (req, res) => {
    try {
        const questions = PasswordResetService.getSecurityQuestions();
        const userQuestions = await PasswordResetService.getUserSecurityQuestions(req.session.user.username);
        
        res.render('securityQuestions', { 
            user: req.session.user,
            availableQuestions: questions,
            hasQuestions: userQuestions.length > 0,
            userQuestions
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.post('/security-questions', requireLogin, async (req, res) => {
    try {
        const { questions } = req.body;
        
        if (!Array.isArray(questions) || questions.length < 3) {
            return res.status(400).send('You must set at least 3 security questions');
        }

        await PasswordResetService.setSecurityQuestions(req.session.user.username, questions);
        res.status(200).send('Security questions set successfully');
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

// Password Reset (unauthenticated)
router.get('/forgot-password', (req, res) => {
    res.render('forgotPassword');
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { username } = req.body;
        const questions = await PasswordResetService.getUserSecurityQuestions(username);
        
        if (questions.length === 0) {
            return res.status(400).send('No security questions found for this user. Please contact support.');
        }

        res.render('resetPassword', { username, questions });
    } catch (error) {
        console.error(error);
        res.status(400).send('User not found or no security questions set');
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { username, newPassword, confirmPassword, answers } = req.body;
        
        if (newPassword !== confirmPassword) {
            return res.status(400).send('Passwords do not match');
        }

        if (!Array.isArray(answers) || answers.length < 2) {
            return res.status(400).send('You must answer at least 2 security questions');
        }

        await PasswordResetService.resetPassword(username, newPassword, answers);
        res.status(200).send('Password reset successfully. You can now log in with your new password.');
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
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
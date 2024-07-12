const express = require('express');
const router = express.Router();
const path = require('path');
const { getUserProfile, updateUserProfile, registerUser, loginUser, renderSignup, renderLogin, logoutUser } = require('../controllers/userController');
const User = require('../models/User'); 
const userController = require('../controllers/userController');
const samplePosts = require('../models/samplePost');
const sampleProfiles = require('../models/sampleProfiles');
const Post = require('../models/Post');


const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        next(); 
    } else {
        res.redirect('/register'); 
    }
};


router.get('/', requireLogin, async (req, res) => {
    try {
        const loggedInUser = req.session.user;

        
        const dbPosts = await Post.find().sort({ createdAt: -1 });

        
        const posts = [...dbPosts, ...samplePosts];

        res.render('home', { user: loggedInUser, posts });
    } catch (error) {
        console.error('Error fetching home page:', error);
        res.status(500).json({ error: 'Failed to load home page' });
    }
});

router.get('/', requireLogin, (req, res) => {
    const user = req.session.user; 
    res.render('home', { user });
});


router.get('/register', renderSignup);


router.post('/register', registerUser);


router.get('/login', renderLogin);


router.post('/login', loginUser);


router.get('/profile/:username', async (req, res) => {
    try {
        const loggedInUser = req.session.user;
        const username = req.params.username;

        
        const userFromDB = await User.findOne({ username }).lean();

        
        const userFromSample = sampleProfiles.find(profile => profile.username === username);


        
        const isLoggedInUser = loggedInUser && loggedInUser.username === username;

        
        const dbPosts = await Post.find({ user: username });

        
        const userSamplePosts = samplePosts.filter(post => post.user === username);

        
        const posts = [...dbPosts, ...userSamplePosts];



        if (!userFromDB && !userFromSample) {
            return res.status(404).send('User not found');
        }

        
        if (userFromDB) {
            
            const isOwnProfile = loggedInUser && loggedInUser.username === username;
            if (isOwnProfile) {
                
                res.render('userProfile', { visitedUser: userFromDB, loggedInUser, posts });
            } else {
                
                res.render('profile', { visitedUser: userFromDB, loggedInUser, posts });
            }
        } else if (userFromSample) {
            
            res.render('profile', { visitedUser: userFromSample, loggedInUser, posts });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


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


router.get('/users', userController.getAllUsers);


router.get('/logout', logoutUser);

module.exports = router;

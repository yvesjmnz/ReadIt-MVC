const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const sampleProfiles = require('../models/sampleProfiles');


// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        next(); // User is logged in, continue to the next middleware or route handler
    } else {
        res.redirect('/register'); // Redirect to registration page if user is not logged in
    }
};

// Render Signup Page
exports.renderSignup = (req, res) => {
    res.render('register');
};

// Register User
exports.registerUser = async (req, res) => {
    try {
        const { username, password, confirmPassword, quote } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match');
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        let profilePicPath = '';
        if (req.files && req.files.profilePic) {
            const profilePic = req.files.profilePic;
            profilePicPath = '/img/' + profilePic.name;
            const uploadPath = path.join(__dirname, '..', 'public', 'img', profilePic.name);
            profilePic.mv(uploadPath, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error uploading file');
                }
            });
        }

        const newUser = new User({ username, password, quote, profilePic: profilePicPath });
        await newUser.save();

        // Optionally, log in the user after registration
        req.session.user = { username: newUser.username, profilePic: profilePicPath }; // Store user in session
        res.redirect('/'); // Redirect to home page after successful registration
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Render Login Page
exports.renderLogin = (req, res) => {
    res.render('login');
};

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(400).send('Invalid credentials');
        }

        // Log in the user
        req.session.user = { username: user.username, profilePic: user.profilePic }; // Store user in session
        res.redirect('/'); // Redirect to home page after successful login
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
        const loggedInUser = req.session.user;
        const username = req.params.username;

        // Check if the user exists in MongoDB
        const userFromDB = await User.findOne({ username }).lean();

        // Check if the user exists in the sampleProfiles
        const userFromSample = sampleProfiles.find(profile => profile.username === username);

        if (!userFromDB && !userFromSample) {
            return res.status(404).send('User not found');
        }

        // Render user profile
        if (userFromDB) {
            // Determine if the profile belongs to the logged-in user or another user
            const isOwnProfile = loggedInUser && loggedInUser.username === username;
            if (isOwnProfile) {
                // Render user's own profile
                res.render('userProfile', { visitedUser: userFromDB, loggedInUser });
            } else {
                // Render another user's profile
                res.render('profile', { visitedUser: userFromDB, loggedInUser });
            }
        } else if (userFromSample) {
            // Render profile using sample data if found
            res.render('profile', { visitedUser: userFromSample, loggedInUser });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const { quote } = req.body;
        let updateData = { quote };

        if (req.files && req.files.profilePic) {
            const profilePic = req.files.profilePic;
            const profilePicPath = '/img/' + profilePic.name;
            const uploadPath = path.join(__dirname, '..', 'public', 'img', profilePic.name);
            profilePic.mv(uploadPath, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error uploading file');
                }
            });
            updateData.profilePic = profilePicPath;
        }

        await User.findOneAndUpdate({ username: req.params.username }, updateData);
        res.redirect(`/profile/${req.params.username}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};



exports.getAllUsers = async (req, res) => {
    try {
        const usersFromDB = await User.find().lean();
        const allUsers = [...usersFromDB, ...sampleProfiles];
        res.json(allUsers);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Logout User
exports.logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            res.status(500).send('Server Error');
        } else {
            res.redirect('/login'); // Redirect to login page after logout
        }
    });
};

const User = require('../models/User');
const path = require('path');
const fs = require('fs');

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

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).lean(); // Using .lean() to get a plain JavaScript object
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('userProfile', { user });
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

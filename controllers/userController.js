const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const sampleProfiles = require('../models/sampleProfiles');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Define the salt rounds for bcrypt

const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        next(); 
    } else {
        res.redirect('/register'); 
    }
};

exports.renderSignup = (req, res) => {
    res.render('register');
};

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

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({ username, password: hashedPassword, quote, profilePic: profilePicPath });
        await newUser.save();

        req.session.user = { username: newUser.username, profilePic: profilePicPath }; 
        res.redirect('/'); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.renderLogin = (req, res) => {
    res.render('login');
};

exports.loginUser = async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;

        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).send('Invalid credentials');
        }

        // Set session user
        req.session.user = { username: user.username, profilePic: user.profilePic };

        // If "Remember Me" is checked, set a persistent cookie
        if (rememberMe) {
            res.cookie('user', JSON.stringify(req.session.user), { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true }); // 30 days
        }

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const loggedInUser = req.session.user;
        const username = req.params.username;

        const userFromDB = await User.findOne({ username }).lean();

        const userFromSample = sampleProfiles.find(profile => profile.username === username);

        if (!userFromDB && !userFromSample) {
            return res.status(404).send('User not found');
        }

        if (userFromDB) {
            const isOwnProfile = loggedInUser && loggedInUser.username === username;
            if (isOwnProfile) {
                res.render('userProfile', { visitedUser: userFromDB, loggedInUser });
            } else {
                res.render('profile', { visitedUser: userFromDB, loggedInUser });
            }
        } else if (userFromSample) {
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

exports.logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            res.status(500).send('Server Error');
        } else {
            res.redirect('/login'); 
        }
    });
};

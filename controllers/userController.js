
const User = require('../models/User');



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
        const { username, password, confirmPassword, quote, profilePic } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match');
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        const newUser = new User({ username, password, quote, profilePic });
        await newUser.save();

        // Optionally, log in the user after registration
        req.session.user = { username: newUser.username }; // Store user in session
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
        req.session.user = { username: user.username }; // Store user in session
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
        await User.findOneAndUpdate(
            { username: req.params.username },
            { quote }
        );
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


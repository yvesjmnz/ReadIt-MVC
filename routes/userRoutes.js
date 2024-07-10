const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, registerUser, loginUser, renderSignup, renderLogin } = require('../controllers/userController');
const userController = require('../controllers/userController');
// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        next(); // User is logged in, continue to the next middleware or route handler
    } else {
        res.redirect('/register'); // Redirect to registration page if user is not logged in
    }
};

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

router.get('/profile/:username', getUserProfile);
router.post('/profile/:username', updateUserProfile);

router.get('/logout', userController.logoutUser);

module.exports = router;

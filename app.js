// app.js

const express = require('express');
const mongoose = require('mongoose');
const { engine } = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser'); 
const multer = require('multer');
const fileUpload = require('express-fileupload');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const handlebarsHelpers = require('./helpers/handlebarsHelpers');
require('dotenv').config();

const config = require('./config'); // Import configuration

const app = express();
const PORT = config.port || 3000;

// Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/img'); // Destination folder for uploaded images
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Multer Upload
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('profilePic'); // Field name for the file input in your form

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images only!');
    }
}

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser()); // Add this line
app.use(fileUpload());

// Session middleware setup
app.use(session({
    secret: config.sessionSecret, // Use secret from config
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure: true if using HTTPS
}));

// Middleware to check for "Remember Me" cookie
app.use((req, res, next) => {
    if (!req.session.user && req.cookies.user) {
        req.session.user = JSON.parse(req.cookies.user);
    }
    next();
});

app.engine('hbs', engine({
    extname: 'hbs',
    defaultLayout: false,
    handlebars: allowInsecurePrototypeAccess(Handlebars), // Allow prototype access
    helpers: handlebarsHelpers // Register custom helpers
}));
app.set('view engine', 'hbs');

mongoose.connect(config.mongodbUri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Mount all routes
app.use('/', require('./routes/userRoutes')); // User routes (includes auth)
app.use('/', require('./routes/communityRoutes')); // Community routes (API + views)
app.use('/', require('./routes/postRoutes')); // Post routes (API + views)

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
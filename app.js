// app.js

const express = require('express');
const mongoose = require('mongoose');
const { engine } = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser'); 
const fileUpload = require('express-fileupload');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const handlebarsHelpers = require('./helpers/handlebarsHelpers');
require('dotenv').config();

const config = require('./config');

const app = express();
const PORT = config.port || 3000;

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser()); // Add this line
app.use(fileUpload());

// Session middleware
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Remember me cookie middleware
app.use((req, res, next) => {
    if (!req.session.user && req.cookies.user) {
        req.session.user = JSON.parse(req.cookies.user);
    }
    next();
});

// Handlebars setup
app.engine('hbs', engine({
    extname: 'hbs',
    defaultLayout: false,
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: handlebarsHelpers
}));
app.set('view engine', 'hbs');

// Database connection
mongoose.connect(config.mongodbUri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// API Routes (must come before view routes)
app.use('/api/communities', require('./routes/api/communities'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/users', require('./routes/api/users'));

// View Routes
app.use('/', require('./routes/userRoutes'));
app.use('/', require('./routes/communityRoutes'));
app.use('/', require('./routes/postRoutes'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
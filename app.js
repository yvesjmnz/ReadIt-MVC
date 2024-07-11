const express = require('express');
const mongoose = require('mongoose');
const { engine } = require('express-handlebars');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const multer = require('multer');
const fileUpload = require('express-fileupload');
const communityRoutes = require('./routes/communityRoutes'); // Import community routes
const postRoutes = require('./routes/postRoutes'); // Import post routes
const userRoutes = require('./routes/userRoutes');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(fileUpload());

// Session middleware setup
app.use(session({
    secret: 'your-secret-key', // Change this to a random string (can be generated using a tool)
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure: true if using HTTPS
}));

app.engine('hbs', engine({
    extname: 'hbs',
    defaultLayout: false,
    handlebars: allowInsecurePrototypeAccess(Handlebars) // Allow prototype access
}));
app.set('view engine', 'hbs');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.use('/api', communityRoutes); // Mount community routes under /api
app.use('/api', postRoutes);
app.use('/', userRoutes);

app.use('/', require('./routes/userRoutes'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

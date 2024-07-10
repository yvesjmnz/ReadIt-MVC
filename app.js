const express = require('express');
const mongoose = require('mongoose');
const { engine } = require('express-handlebars');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const communityRoutes = require('./routes/communityRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

app.engine('hbs', engine({ extname: 'hbs', defaultLayout: false }));
app.set('view engine', 'hbs');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.use('/community', communityRoutes); // Mount community routes under /community
app.use('/', userRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

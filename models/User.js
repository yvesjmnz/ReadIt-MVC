const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: 'default.jpg'
    },
    quote: String,
    favoriteCommunities: [String], // Disregard
});

const User = mongoose.model('User', userSchema);

module.exports = User;

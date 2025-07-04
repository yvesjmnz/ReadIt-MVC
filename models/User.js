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
    quote: String,
    favoriteCommunities: [String],

    // 👇 Admin features
    isAdmin: {
        type: Boolean,
        default: false
    },
    adminGrantedBy: String,
    adminGrantedAt: Date,

    // 👇 Site-wide ban features
    isBanned: {
        type: Boolean,
        default: false
    },
    banReason: String,
    bannedBy: String,
    bannedAt: Date,

    // 👇 Security features
    failedAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    lastLogin: Date,
    lastLoginAttempt: Date,
    passwordLastChanged: {
        type: Date,
        default: Date.now
    },
    passwordHistory: [
        {
            hash: String,
            changedAt: Date
        }
    ]
});

const User = mongoose.model('User', userSchema);

module.exports = User;

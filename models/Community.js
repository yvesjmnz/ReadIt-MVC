const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    creator: {
        type: String,
        required: true
    },
    moderators: {
        type: [String],
        default: []
    },
    members: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Method to check if a user is a moderator
communitySchema.methods.isModerator = function(username) {
    return this.creator === username || this.moderators.includes(username);
};

// Method to add a moderator
communitySchema.methods.addModerator = function(username) {
    if (!this.moderators.includes(username) && this.creator !== username) {
        this.moderators.push(username);
    }
};

// Method to remove a moderator
communitySchema.methods.removeModerator = function(username) {
    if (this.creator !== username) { // Can't remove creator
        this.moderators = this.moderators.filter(mod => mod !== username);
    }
};

module.exports = mongoose.model('Community', communitySchema);
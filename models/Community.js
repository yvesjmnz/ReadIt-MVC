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
    bannedUsers: {
        type: Map,
        of: {
            reason: String,
            bannedBy: String,
            bannedAt: {
                type: Date,
                default: Date.now
            }
        },
        default: new Map()
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

// Method to check if a user is banned
communitySchema.methods.isBanned = function(username) {
    return this.bannedUsers.has(username);
};

// Method to get ban info
communitySchema.methods.getBanInfo = function(username) {
    return this.bannedUsers.get(username);
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

// Method to ban a user
communitySchema.methods.banUser = function(username, reason, bannedBy) {
    if (this.creator !== username) { // Can't ban creator
        this.bannedUsers.set(username, {
            reason: reason,
            bannedBy: bannedBy,
            bannedAt: new Date()
        });
        // Remove from moderators if they were one
        this.removeModerator(username);
    }
};

// Method to unban a user
communitySchema.methods.unbanUser = function(username) {
    this.bannedUsers.delete(username);
};

// Method to get all banned users as an array
communitySchema.methods.getBannedUsersList = function() {
    const bannedList = [];
    for (const [username, banInfo] of this.bannedUsers) {
        bannedList.push({
            username,
            reason: banInfo.reason,
            bannedBy: banInfo.bannedBy,
            bannedAt: banInfo.bannedAt
        });
    }
    return bannedList;
};

module.exports = mongoose.model('Community', communitySchema);
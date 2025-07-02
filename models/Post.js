const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    text: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    edited: {
        type: Boolean,
        default: false
    }
});

const violationSchema = new mongoose.Schema({
    moderator: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    action: {
        type: String,
        enum: ['locked', 'unlocked'],
        required: true
    }
});

const postSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    post_description:{
        type: String,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    dislikes: {
        type: Number,
        default: 0
    },
    likedBy: {
        type: [String],
        default: []
    },
    dislikedBy: {
        type: [String],
        default: []
    },
    comments: [commentSchema],
    date: {
        type: Date,
        default: Date.now
    },
    communityName: {
        type: String
    },
    locked: {
        type: Boolean,
        default: false
    },
    lockedBy: {
        type: String
    },
    lockedAt: {
        type: Date
    },
    lockReason: {
        type: String
    },
    violations: [violationSchema]
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
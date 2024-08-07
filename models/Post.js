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
    }
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;

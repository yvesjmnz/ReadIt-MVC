const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    post_description: {
        type: String,
        required: true,
        
    },
   
});

module.exports = mongoose.model('Post', postSchema);

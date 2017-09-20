///
/// @file   chatter.model.js
/// @brief  The database model for our short-length, short-lived venue comments - 'chatters'.
///

// Imports
const mongoose      = require('mongoose');

// Chatter Schema
const chatterSchema = new mongoose.Schema({
    // The display name of the chatter's author.
    authorName: {
        type: String,
        required: true
    },

    // The ID of the bar the user is chatting about.
    businessId: {
        type: String,
        required: true
    },

    // The chatter's body. Limit 140 characters.
    body: {
        type: String,
        required: true,
        validate: {
            validator: v => v.length <= 140,
            msg: 'Chatter comments shall not exceed 140 characters in length.'
        }
    },

    // The chatter's post date - controls when the chatter expires.
    postDate: {
        type: Date,
        default: Date.now,
        expires: 86400
    }
});

// Compile and export the model.
module.exports = mongoose.model('chatter', chatterSchema);
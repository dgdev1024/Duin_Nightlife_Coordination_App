///
/// @file   user.model.js
/// @brief  The database model for our registered users.
///

// Imports
const mongoose  = require('mongoose');
const jwt       = require('jsonwebtoken');

// User Schema
const userSchema = new mongoose.Schema({
    // The user's display name.
    displayName: { 
        type: String,
        required: true
    },

    // The user's signin provider.
    provider: {
        type: String,
        required: true
    },

    // The user's provider ID.
    providerId: { 
        type: String,
        required: true
    }
});

// Generates a JSON web token.
userSchema.methods.generateJwt = function () {
    // Generate an expiry date.
    let date = new Date();
    date.setDate(date.getDate() + 1);

    // Sign and return the JWT.
    return jwt.sign({
        _id: this._id.toString(),
        displayName: this.displayName,
        exp: parseInt(date.getTime()) / 1000
    }, process.env.JWT_SECRET, {
        subject: this._id.toString()
    });
};

// Compile and Export the Model.
module.exports = mongoose.model('user', userSchema);
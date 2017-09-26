///
/// @file   auth.js
/// @brief  Contains our authentication strategies and their configurations.
///

// Imports
const expressJwt = require('express-jwt');
const passport = require('passport');
const passportTwitter = require('passport-twitter');
const passportFacebook = require('passport-facebook');
const userModel = require('../models/user.model');

// Configuration Options
const configuration = {
    // Twitter Configuration
    twitter: {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackUrl: `${process.env.SITE_URL}/api/auth/twitter/callback`
    },

    // Facebook Configuration
    facebook: {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.SITE_URL}/api/auth/facebook/callback`
    }
};

// Export our Login Strategies.
module.exports = {
    // JWT Authentication
    jwt: expressJwt({
        secret: process.env.JWT_SECRET,
        userProperty: 'payload'
    }),

    // Test Login
    testLogin (req, callback) {
        if (!req.payload || !req.payload._id) {
            return callback({
                status: 401,
                message: 'You are not logged in.'
            });
        }

        userModel.findById(req.payload._id)
            .then(user => {
                if (!user) {
                    return callback({
                        status: 401,
                        message: 'You are not logged in.'
                    });
                }

                return callback(null, {
                    id: req.payload._id,
                    displayName: req.payload.displayName
                });
            })
            .catch(err => {
                console.error(`auth.testLogin (poll users): ${err}`);
                return callback({
                    status: 500,
                    message: 'Something went wrong while verifying your login. Try again later.'
                });
            });
    },

    // Facebook Authentication
    facebook: new passportFacebook.Strategy(configuration.facebook, (accessToken, refreshToken, profile, callback) => {
        // Get some details from the fetched profile.
        const { provider, id, displayName } = profile;

        // Find the user by its provider ID.
        userModel.findOne({ providerId: id })
            .then(user => {
                // If the user was not found, then create it and add it to the database.
                if (!user) {
                    userModel.create({
                        displayName,
                        provider,
                        providerId: id
                    }).then(createdUser => {
                        return callback(null, createdUser);
                    }).catch(err => {
                        return callback(err);
                    });
                } else {
                    return callback(null, user);
                }
            })
            .catch(err => {
                return callback(err);
            });
    }),

    // Twitter Authentication
    twitter: new passportTwitter.Strategy(configuration.twitter, (token, tokenSecret, profile, callback) => {
        // Get some details from the fetched profile.
        const { provider, id, displayName } = profile;

        // Find the user by its provider ID.
        userModel.findOne({ providerId: id })
            .then(user => {
                // If the user was not found, then create it and add it to the database.
                if (!user) {
                    userModel.create({
                        displayName,
                        provider,
                        providerId: id
                    }).then(createdUser => {
                        return callback(null, createdUser);
                    }).catch(err => {
                        return callback(err);
                    });
                } else {
                    return callback(null, user);
                }
            })
            .catch(err => {
                return callback(err);
            });
    })
};
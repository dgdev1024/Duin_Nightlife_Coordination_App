///
/// @file   chatter.controller.js
/// @brief  Controller functions for our 'chatters' - short-lived, tweet-sized venue comments.
///

// Imports
const escape            = require('html-escape');
const waterfall         = require('async').waterfall;
const userModel         = require('../models/user.model');
const venueModel        = require('../models/venue.model');
const chatterModel      = require('../models/chatter.model');

// Export Controller Functions.
module.exports = {
    ///
    /// @fn     fetchChatters
    /// @brief  Fetches a list of chatters on the given venue.
    ///
    /// Details: venueId
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    fetchChatters (details, callback) {
        waterfall([
            // Find the venue in question.
            (next) => {
                venueModel.findOne({ businessId: details.venueId })
                    .then(venue => {
                        if (!venue) {
                            return next({
                                status: 404,
                                message: 'The venue you requested was not found in our database.',
                                details: [
                                    'The venue has likely not yet been indexed in our database, yet.',
                                    'It will be indexed if its details are viewed, or it appears in search results.',
                                    'The venue may be available at a later date, so try again later.'
                                ]
                            });
                        }

                        return next(null);
                    })
                    .catch(err => {
                        console.error(`chatterController.fetchChatters (poll venue): ${err}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while polling the venue database. Try again later.'
                        });
                    });
            },

            // Fetch chatters on the venue.
            (next) => {
                chatterModel.find({ businessId: details.venueId })
                    .sort('postDate+')
                    .limit(100)
                    .exec()
                    .then(chatters => {
                        if (chatters.length === 0) {
                            return next({
                                status: 404,
                                message: 'No chatters were found.'
                            });
                        }

                        const mapped = chatters.map(val => {
                            return {
                                author: val.authorName,
                                body: val.body
                            };
                        });

                        return next(null, mapped);
                    })
                    .catch(err => {
                        console.error(`chatterController.fetchChatters (poll chatters): ${err}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong when polling for chatters. Try again later.'
                        });
                    });
            }
        ], (err, results) => {
            if (err) {
                return callback(err);
            }

            return callback(null, { chatters: results });
        });
    },

    ///
    /// @fn     postChatter
    /// @brief  Posts a chatter on the given venue.
    ///
    /// Details: userId, venueId, body, socket
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    postChatter (details, callback) {
        waterfall([
            // Find the registered user.
            (next) => {
                userModel.findById(details.userId)
                    .then(user => {
                        if (!user) {
                            return next({
                                status: 401,
                                message: 'A user with this ID was not found.'
                            });
                        }

                        return next(null, user);
                    })
                    .catch(err => {
                        console.error(`chatterController.postChatter (poll user): ${err}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while polling the user database. Try again later.'
                        });
                    });
            },

            // Find the venue.
            (user, next) => {
                venueModel.findOne({ businessId: details.venueId })
                    .then(venue => {
                        if (!venue) {
                            return next({
                                status: 404,
                                message: 'The venue you requested was not found in our database.',
                                details: [
                                    'The venue has likely not yet been indexed in our database, yet.',
                                    'It will be indexed if its details are viewed, or it appears in search results.',
                                    'The venue may be available at a later date, so try again later.'
                                ]
                            });
                        }

                        if (venue.isAttending(details.userId) === false) {
                            return next({
                                status: 403,
                                message: 'You have to be attending the venue to post a chatter.'
                            });
                        }

                        return next(null, user);
                    })
                    .catch(err => {
                        console.error(`chatterController.postChatter (poll venue): ${err}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while polling the venue database. Try again later.'
                        });
                    });
            },

            // Create the chatter object and post it in the database.
            (user, next) => {
                // Make sure the body is 140 characters or less.
                if (details.body > 140) {
                    return next({
                        status: 400,
                        message: 'Chatter comments cannot exceed 140 characters in length.'
                    });
                }

                // Create the chatter object.
                let chatter = new chatterModel();
                chatter.authorName = user.displayName;
                chatter.businessId = details.venueId;
                chatter.body = details.body;

                // Save the chatter to the database.
                chatter.save()
                    .then(() => { 
                        details.socket.emit('new chatter', {
                            venueId: details.venueId,
                            authorName: user.displayName,
                            body: details.body
                        });
                        return next(null); 
                    })
                    .catch(err => {
                        console.error(`chatterController.postChatter (save chatter): ${err}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while saving the chatter comment. Try again later.'
                        });
                    });
            }
        ], (err) => {
            if (err) {
                return callback(err);
            }

            return callback(null);
        });
    }
};
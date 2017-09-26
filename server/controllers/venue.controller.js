///
/// @file   venue.controller.js
/// @brief  Controller functions for our venue and chatter database models.
///

// Imports
const waterfall         = require('async').waterfall;
const forEachOf         = require('async').forEachOf;
const venueModel        = require('../models/venue.model');
const chatterModel      = require('../models/chatter.model');
const userModel         = require('../models/user.model');
const safeJson          = require('../utility/json');
const yelpFusion        = require('yelp-fusion').client(process.env.YELP_ACCESS_TOKEN);

// Export Functions
module.exports = {
    ///
    /// @fn     findVenues
    /// @brief  Polls the Yelp API for venues.
    ///
    /// Details:
    ///     where (location, latitude, longitude)
    ///     page
    ///
    /// @param {object} details The details object.
    /// @param {function} callback Run when this function finishes.
    ///
    findVenues (details, callback) {
        waterfall([
            // First things first, are we looking at a specific location (city, zip, etc.),
            // or are we checking our current location (latitude, longitude)?
            (next) => {
                // Our search query object.
                let query = {
                    categories: 'bars,sportsbars',
                    radius: 32187,
                    limit: 21,
                    offset: 20 * details.page,
                    sort_by: 'distance'
                };

                // Get the location for our query.
                //
                // Check to see if a specific location (a city name or zip code) is specified, first.
                if (details.where.location) {
                    query.location = details.where.location;
                }

                // Otherwise, the user's current geographical location, or a specific latitude and/or
                // longitude will be specified.
                else {
                    if (details.where.latitude) {
                        query.latitude = details.where.latitude;
                    }

                    if (details.where.longitude) {
                        query.longitude = details.where.longitude;
                    }

                    if (!query.latutide && !query.longitude) {
                        return next({
                            status: 400,
                            message: 'Please specify a location.'
                        });
                    }
                }

                // Send the query object to the next function.
                return next(null, query);
            },

            // Poll the Yelp Fusion API for bars and restaurants matching our
            // query.
            (query, next) => {
                yelpFusion.search(query)
                    .then(response => {
                        // The response from Yelp's API should include an object called
                        // 'jsonBody'. Look for our array of businesses in there.
                        const { businesses, total } = response.jsonBody;

                        // Check to see if there were businesses found.
                        if (total === 0) {
                            return next({
                                status: 404,
                                message: 'No businesses were found near the specified location.'
                            });
                        }

                        // Format the businesses. Filter out any ones that have "closed their doors for good".
                        const mapped = businesses
                            .sort((a, b) => b.distance - a.distance)
                            .slice(0, 20)
                            .filter(v => v.is_closed === false)
                            .map(val => {
                                return {
                                    id: val.id,
                                    name: val.name,
                                    image: val.image_url,
                                    closed_down: val.is_closed
                                };
                            });

                        // Check to see if this is the last page of the query.
                        const lastPage = businesses.length !== 21;

                        // Send this array or businesses to the next function.
                        return next(null, mapped, lastPage);
                    })
                    .catch(err => {
                        console.error(`venueController.findVenues (yelp): ${err}`);
                        return next({
                            status: err.statusCode || 500,
                            message: 'An error occured while polling the Yelp API. Try again later.'
                        });
                    });
            },

            // Cross-reference our list of fetched businesses with the businesses registered
            // in our database. If any fetched businesses are not found in our database, then add them.
            (fetchedBusinesses, lastPage, next) => {
                let entries = [];
                forEachOf(
                    fetchedBusinesses,
                    (val, key, cb) => {
                        venueModel.findOne({ businessId: val.id })
                            .then(response => {
                                // If the business was not found, then add it to the database.
                                if (response) {
                                    entries.push(Object.assign({}, val, { going: response.attendantCount }));
                                    return cb();
                                } else {
                                    venueModel.create({ businessId: val.id })
                                        .then(response => {
                                            entries.push(Object.assign({}, val, { going: 0 }));
                                            console.log(`Found new business with ID: ${response.businessId}!`);
                                            return cb();
                                        })
                                        .catch(err => {
                                            console.error(`Error adding new business with ID: ${val.id} - ${err}`);
                                            return cb();
                                        });
                                }
                            })
                            .catch(err => {
                                // Report the error.
                                console.error(`venueController.findVenues (poll venues): ${err}`);
                                return cb({
                                    status: 500,
                                    message: 'An error occured while polling the business database. Try again later.'
                                });
                            });
                    },
                    (err) => {
                        if (err) { return next(err); }
                        return next(null, entries, lastPage);
                    }
                );
            }
        ], (err, results, lastPage) => {
            if (err) {
                return callback(err);
            }

            return callback(null, { venues: results, lastPage });
        });
    },

    ///
    /// @fn     fetchVenue
    /// @brief  Fetches details on a given venue.
    ///
    /// @param {string} venueId The ID of the venue to fetch.
    /// @param {function} callback Run when this function finishes.
    ///
    fetchVenue (venueId, callback) {
        waterfall([
            // First, find the venue with this ID in the database.
            (next) => {
                venueModel.findOne({ businessId: venueId })
                    .then(venue => {
                        // Check to see if the venue was found in our database.
                        // Send the number of people going to the next function if it was found.
                        // Send zero to the next function if it wasn't.
                        if (!venue) {
                            return next(null, false, 0);
                        } else {
                            return next(null, true, venue.attendantCount);
                        }
                    })
                    .catch(err => {
                        console.error(`venueController.fetchVenue (poll venue): ${err}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while polling the venue database. Try again later.'
                        });
                    });
            },

            // Poll the Yelp API for details on the business in question.
            (venueFound, attendanceCount, next) => {
                yelpFusion.business(venueId)
                    .then(response => {
                        // First, check to see if the business has "closed its doors for good".
                        if (response.is_closed === true) {
                            return next({
                                status: 410,
                                message: 'The business you have requested has closed its doors for good.'
                            }); 
                        }

                        // Replace the response parameter with the JSON body within.
                        response = response.jsonBody;

                        // Prepare the object to be returned on success.
                        const result = {
                            name: response.name,
                            image: response.image_url,
                            yelp: response.url,
                            price: response.price,
                            rating: response.rating,
                            address: response.location.display_address.join(', '),
                            phone: response.display_phone,
                            going: attendanceCount
                        };

                        // If the business has not been added to the database, then register it.
                        if (venueFound === false) {
                            venueModel.create({ businessId: venueId })
                                .then(() => {
                                    console.log(`Found new business with ID: ${venueId}!`);
                                    return next(null, result);
                                })
                                .catch(err => {
                                    console.error(`venueController.fetchVenue (new business): ${err}`);
            
                                    return next({
                                        status: err.status || 500,
                                        message: 'Something went wrong while registering the new business. Try again later.'
                                    });
                                }); 
                        } else {
                            return next(null, result);
                        }
                    })
                    .catch(err => {
                        console.error(`venueController.fetchVenue (yelp): ${err}`);

                        return next({
                            status: err.statusCode || 500,
                            message: 'Something went wrong while polling the Yelp API. Try again later.'
                        });
                    });
            }
        ], (err, result) => {
            if (err) {
                return callback(err);
            }

            return callback(null, result);
        });
    },

    ///
    /// @fn     isUserAttending
    /// @brief  Checks to see if a user is attending the given venue.
    ///
    /// @param {string} userId The ID of the attending user.
    /// @param {string} venueId The ID of the venue.
    /// @param {function} callback Run when this function finishes.
    ///
    isUserAttending (userId, venueId, callback) {
        waterfall([
            // Find the registered user.
            (next) => {
                userModel.findById(userId)
                    .then(user => {
                        if (!user) {
                            return next({
                                status: 401,
                                message: 'A user with this ID was not found.'
                            });
                        }

                        return next(null);
                    })
                    .catch(err => {
                        console.error(`venueController.isUserAttending (poll user): ${err}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while polling the user database. Try again later.'
                        });
                    });
            },

            // Find the venue.
            (next) => {
                venueModel.findOne({ businessId: venueId })
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

                        return next(null, venue.isAttending(userId));
                    })
                    .catch(err => {
                        console.error(`venueController.toggleAttendVenue (poll venue): ${err}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while polling the venue database. Try again later.'
                        });
                    });
            }
        ], (err, attending) => {
            if (err) {
                return callback(err);
            }

            return callback(null, { attending });
        });
    },

    ///
    /// @fn     toggleAttendVenue
    /// @brief  Attends or unattends the venue with the given ID.
    ///
    /// @param {string} userId The ID of the attending user.
    /// @param {string} venueId The ID of the venue.
    /// @param {object} socket The Socket.IO socket.
    /// @param {function} callback Run when this function finishes.
    ///
    toggleAttendVenue (userId, venueId, socket, callback) {
        waterfall([
            // Find the registered user.
            (next) => {
                userModel.findById(userId)
                    .then(user => {
                        if (!user) {
                            return next({
                                status: 401,
                                message: 'A user with this ID was not found.'
                            });
                        }

                        return next(null);
                    })
                    .catch(err => {
                        console.error(`venueController.toggleAttendVenue (poll user): ${err}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while polling the user database. Try again later.'
                        });
                    });
            },

            // Find the venue.
            (next) => {
                venueModel.findOne({ businessId: venueId })
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

                        return next(null, venue);
                    })
                    .catch(err => {
                        console.error(`venueController.toggleAttendVenue (poll venue): ${err}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while polling the venue database. Try again later.'
                        });
                    });
            },

            // Attend the venue.
            (venue, next) => {
                let message = '';
                if (venue.isAttending(userId) === true) {
                    venue.removeAttendant(userId);
                    message = 'remove attendant';
                } else {
                    venue.addAttendant(userId);
                    message = 'add attendant';
                }

                venue.save()
                    .then(() => { 
                        socket.emit(message, { venueId });
                        return next(null); 
                    })
                    .catch(err => {
                        console.error(`venueController.attendVenue (save venue): ${err}`);
                        return next({
                            status: 500,
                            message: 'Something went wrong while updating the venue. Try again later.'
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
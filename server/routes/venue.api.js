///
/// @file   venue.api.js
/// @brief  API routing for our venue functions.
///

// Imports
const express           = require('express');
const venueController   = require('../controllers/venue.controller');
const chatterController = require('../controllers/chatter.controller');
const userModel         = require('../models/user.model');
const auth              = require('../utility/auth');

// Export
module.exports = socket => {
    const router = express.Router();

    router.get('/search', (req, res) => {
        venueController.findVenues({
            where: {
                location: req.query.location,
                latitude: req.query.latitude,
                longitude: req.query.longitude
            },
            page: parseInt(req.query.page) || 0
        }, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            return res.status(200).json({ venues: ok });
        });
    });

    router.get('/view/:venueId', (req, res) => {
        venueController.fetchVenue(req.params.venueId, (err, ok) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            return res.status(200).json({ venue: ok });
        });
    });

    router.get('/attending/:venueId', auth.jwt, (req, res) => {
        auth.testLogin(req, (err, user) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            venueController.isUserAttending(user.id, req.params.venueId, (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json(ok);
            });
        });
    });

    router.put('/toggleAttend/:venueId', auth.jwt, (req, res) => {
        auth.testLogin(req, (err, user) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            venueController.toggleAttendVenue(user.id, req.params.venueId, (err) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).end();
            });
        });
    });

    router.post('/chatter/:venueId', auth.jwt, (req, res) => {
        auth.testLogin(req, (err, user) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            chatterController.postChatter({
                userId: user.id,
                venueId: req.params.venueId,
                body: req.body.body
            }, (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).end();
            });
        });
    });

    router.get('/chatters/:venueId', auth.jwt, (req, res) => {
        auth.testLogin(req, (err, user) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            chatterController.fetchChatters({
                venueId: req.params.venueId,
                page: parseInt(req.params.page) || 0
            }, (err, ok) => {
                if (err) { return res.status(err.status).json({ error: err }); }
                return res.status(200).json({ chatters: ok });
            });
        });
    });

    return router;
};
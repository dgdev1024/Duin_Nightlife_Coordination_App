///
/// @file   auth.api.js
/// @brief  API routing for our user authentication functions.
///

// Imports
const express = require('express');
const passport = require('passport');
const auth = require('../utility/auth');
const userModel = require('../models/user.model');

// Instead of directly exporting an Express router, we need to export
// a function that returns a router, because we may be working with our
// Socket.IO socket in our routes, too.
module.exports = socket => {
    // Express Router
    const router = express.Router();

    // Passport Strategies.
    passport.use(auth.jwt);
    passport.use(auth.twitter);
    passport.use(auth.facebook);

    // GET x2: Twitter Authentication
    router.get('/twitter', passport.authenticate('twitter', { session: false }));
    router.get('/twitter/callback', (req, res) => {
        passport.authenticate('twitter', { session: false }, (err, user, info) => {
            // Any errors?
            if (err) {
                return res.status(err.status).json({ error: err });
            }

            // If the user wasn't found, then a new one was created.
            // Generate a JWT and return it to the user.
            const token = user.generateJwt();

            // Please note that we are using Passport's social media login strategies, which
            // involve redirects to their API pages, then to a callback URL like this route.
            //
            // This makes storing our JWT token on the frontend a bit hairy, so we send the
            // created JWT token to the frontend in a query parameter.
            return res.redirect(`/finishlogin?jwt=${token}`);
        })(req, res);
    });

    // GET x2: Facebook Authentication
    router.get('/facebook', passport.authenticate('facebook', { session: false }));
    router.get('/facebook/callback', (req, res) => {
        passport.authenticate('facebook', { session: false }, (err, user, info) => {
            // Any errors?
            if (err) {
                return res.status(err.status).json({ error: err });
            }

            // If the user wasn't found, then a new one was created.
            // Generate a JWT and return it to the user.
            const token = user.generateJwt();

            // Please note that we are using Passport's social media login strategies, which
            // involve redirects to their API pages, then to a callback URL like this route.
            //
            // This makes storing our JWT token on the frontend a bit hairy, so we send the
            // created JWT token to the frontend in a query parameter.
            return res.redirect(`/finishlogin?jwt=${token}`);
        })(req, res);
    });

    // DELETE: Deletes a user's account.
    router.delete('/delete', auth.jwt, (req, res) => {
        auth.testLogin(req, (err, user) => {
            if (err) { return res.status(err.status).json({ error: err }); }
            
            userModel.findByIdAndRemove(user.id).then(() => {
                return res.status(200).json({
                    message: 'Your account has been deleted.'
                });
            }).catch((err) => {
                console.error(`userController.deleteAccount (delete) - ${err.stack}`);
                return res.status(500).json({
                    error: {
                        status: 500,
                        message: 'Something went wrong while deleting your account. Try again later.'
                    }
                });
            });
        });
    });

    // Return the router.
    return router;
};
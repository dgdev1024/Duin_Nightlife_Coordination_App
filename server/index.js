///
/// @file   index.js
/// @brief  The entry point for our application's backend.
///

// Imports
const path          = require('path');
const http          = require('http');
const express       = require('express');
const session       = require('express-session');
const socketIo      = require('socket.io');
const bodyParser    = require('body-parser');
const cors          = require('cors');
const helmet        = require('helmet');
const passport      = require('passport');
const compression   = require('compression');
const httpStatus    = require('http-status-codes');

// Export Server Main Function
module.exports = () => {
    // Express and Middleware
    const app = express();
    app.use(helmet());
    app.use(cors());
    app.use(compression());
    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.static(path.join(__dirname, '..', 'dist')));

    // Socket.IO
    const server = http.createServer(app);
    const socket = socketIo(server);

    // API Routing
    app.use('/api/auth', require('./routes/auth.api')(socket));
    app.use('/api/venue', require('./routes/venue.api')(socket));

    // Index Routing
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });

    // Error Handling
    app.use((err, req, res, next) => {
        // Create an error object with a status code and type.
        let error = {
            status: err.status || 500,
            type: httpStatus.getStatusText(err.status || 500)
        };

        // Add some additional details to our error object if we are running
        // in development mode.
        if (process.env.NODE_ENV === 'development') {
            error.message = err.message;
            error.stack = err.stack;
        }

        // Return the error in a JSON response.
        return res.status(error.status).json({ error });
    });

    // Socket.IO events.
    socket.on('connection', sck => {
        console.log(`Socket.IO: Created socket with ID: ${sck.id}.`);

        sck.on('disconnect', () => {
            console.log(`Socket.IO: Destroyed socket with ID: ${sck.id}.`);
        });
    });

    // Run the server and listen for connections.
    server.listen(process.env.PORT || 3000, () => {
        console.log(`Running server on port #${server.address().port}. . .`);
    });
};
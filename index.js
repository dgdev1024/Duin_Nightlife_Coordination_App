///
/// @file   index.js
/// @brief  The entry point for our application.
///

// Imports
const mongoose  = require('mongoose');
const loadenv   = require('node-env-file');

// Mongoose Promise
mongoose.Promise = global.Promise;

// Environment Variables
//
// Comment this line out when you are ready to deploy this
// application!
// loadenv('.env');

// Connect to Database
mongoose.connect(process.env.DATABASE_URL, { useMongoClient: true })
    .then(require('./server'))
    .catch(err => {
        // Report the error and exit the program.
        console.error(`[EXCEPTION!] ${err}`);
        console.error(err.stack || 'No Stack');
        mongoose.connection.close().catch(() => process.exit(1));
    });
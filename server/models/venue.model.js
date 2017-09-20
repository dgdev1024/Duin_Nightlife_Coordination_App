///
/// @file   venue.model.js
/// @brief  The database model for our nightlife venues.
///

// Imports
const mongoose = require('mongoose');

// Venue Schema
const venueSchema = new mongoose.Schema({
    // The venue's business ID, per Yelp.
    businessId: {
        type: String,
        required: true
    },

    // The list of users, by ID, going to the venue.
    attendants: [String]
});

// Gets the number of users attending the venue.
venueSchema.virtual('attendantCount').get(function () {
    return this.attendants.length;
});

// Checks to see if a user is attending.
venueSchema.methods.isAttending = function (userId) {
    return this.attendants.indexOf(userId) !== -1;
};

// Adds a user to the attending list.
venueSchema.methods.addAttendant = function (userId) {
    const index = this.attendants.indexOf(userId);
    if (index === -1) {
        this.attendants.push(userId);
        return true;
    } else {
        return false;
    }
};

// Removes a user from the attending list.
venueSchema.methods.removeAttendant = function (userId) {
    const index = this.attendants.indexOf(userId);
    if (index !== -1) {
        this.attendants.splice(index, 1);
        return true;
    } else {
        return false;
    }
};

// Compile and export the model.
module.exports = mongoose.model('venue', venueSchema);
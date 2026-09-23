const { default: mongoose } = require('mongoose');
const bookingSchema = require('../schema/Booking');

const bookingModel = mongoose.model('Booking', bookingSchema);
module.exports = bookingModel;

const mongoose = require('mongoose');
const contactSchema = require('../schema/contactSchema');

// Collection name: "contacts"
const contactModel = mongoose.model('contacts', contactSchema);

module.exports = contactModel;

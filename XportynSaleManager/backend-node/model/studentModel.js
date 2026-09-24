
const { default: mongoose } = require('mongoose');
const studentSchema = require('../schema/studentSchema');

const studentModel = mongoose.model('students', studentSchema);
module.exports = studentModel;

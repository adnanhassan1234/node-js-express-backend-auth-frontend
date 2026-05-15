const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  student_id: {
    type: String,
    required: true,
  },
});


module.exports = studentSchema;

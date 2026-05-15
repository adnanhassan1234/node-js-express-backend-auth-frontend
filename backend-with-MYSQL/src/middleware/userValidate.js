const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    .required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  date_of_birth: Joi.date().less('now').required(),
  salary: Joi.number().min(50).required(),
  age: Joi.number().integer().min(13).max(50).required(),
  address: Joi.string().min(5).max(200).required(),
  phone: Joi.string().pattern(new RegExp('^[0-9]{11}$')).required(),
  city: Joi.string().min(3).max(100).required(),
});

module.exports = { userSchema };

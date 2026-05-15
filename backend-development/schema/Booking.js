const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    items: [
      {
        name: String,
        unit_amount: Number,
        quantity: Number,
      },
    ],
    totalAmount: Number,
    stripeSessionId: String,
    paid: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    booking_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = bookingSchema;

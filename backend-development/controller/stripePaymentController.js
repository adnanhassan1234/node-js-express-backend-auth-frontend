const Stripe = require('stripe');
const bookingModel = require('../model/bookingModel');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res) => {
  try {
    const { cartItems, name, email, phone, booking_id } = req.body;

    const totalAmount = cartItems.reduce((sum, item) => sum + item.unit_amount * item.quantity, 0);

    const booking = await bookingModel.create({
      name,
      email,
      phone,
      booking_id,
      items: cartItems,
      totalAmount,
      paid: false,
      paymentStatus: 'pending',
    });

    const line_items = cartItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: item.unit_amount * 100,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items,
      success_url: `${process.env.CLIENT_URL}/success-payment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/fail-payment`,
      metadata: {
        bookingId: booking._id.toString(),
      },
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    return res.json({ sessionId: session.id, redirectUrl: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// update api status
const handleWebhook = async (req, res) => {
  let event;

  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // console.log('✅ Stripe Event:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    await bookingModel.findByIdAndUpdate(session.metadata.bookingId, {
      paid: true,
      paymentStatus: 'success',
    });
  }

  if (
    event.type === 'checkout.session.expired' ||
    event.type === 'checkout.session.async_payment_failed'
  ) {
    const session = event.data.object;

    await bookingModel.findByIdAndUpdate(session.metadata.bookingId, {
      paid: false,
      paymentStatus: 'failed',
    });
  }

  res.json({ received: true });
};
module.exports = {
  createCheckoutSession,
  handleWebhook,
};

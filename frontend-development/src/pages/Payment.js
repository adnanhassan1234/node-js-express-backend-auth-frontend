const Payment = () => {
  const handlePayment = async () => {
    const cartItems = [
      { name: 'Leather Bag', unit_amount: 500, quantity: 2 },
      { name: 'Leather test ', unit_amount: 200, quantity: 2 },
      { name: 'Leather hull', unit_amount: 456, quantity: 3 },
      { name: 'Leather tee', unit_amount: 794, quantity: 4 },
      { name: 'Leather shirt', unit_amount: 128, quantity: 1 },
    ];
    const response = await fetch('http://localhost:3000/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cartItems,
        name: 'Adnan Hassan',
        email: 'adnan@gmail.com',
        phone: '+923476275532',
      }),
    });

    const data = await response.json();
    window.location.href = data.redirectUrl;
  };

  return (
    <div className="payment-container">
      <h2>Order Summary</h2>

      <div className="order-box">
        <p>
          <b>Name:</b> Adnan Hassan
        </p>
        <p>
          <b>Email:</b> adnan@gmail.com
        </p>
        <p>
          <b>Phone:</b> +923476275532
        </p>
        <p>
          <b>Product:</b> Airport Taxi Booking
        </p>
        <p className="price">$120 USD</p>
      </div>

      <button className="pay-btn" onClick={handlePayment}>
        Pay Now
      </button>
    </div>
  );
};

export default Payment;

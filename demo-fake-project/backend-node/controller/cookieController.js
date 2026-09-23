const setCookie = async (req, res) => {
  res.cookie('token', '123456', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
  res.status(200).send('Cookie "token" has been set');
};

const getCookie = async (req, res) => {
  const myCookieValue = req.cookies.token;
  if (myCookieValue) {
    res.send(`<h2>The cookie name is "token" and the value is: ${myCookieValue}</h2>`);
  } else {
    res.send('No cookie found! Make sure you visited /cookie first.');
  }
};

module.exports = {
  setCookie,
  getCookie,
};

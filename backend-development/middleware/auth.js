const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing or invalid',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded.userId;
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token is not valid or expired, please login again',
    });
  }
};

module.exports = authMiddleware;

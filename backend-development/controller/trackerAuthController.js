const jwt = require('jsonwebtoken');

/**
 * XPORTYN Sales Tracker — simple login
 *
 * Yeh existing `userController` se alag hai (usay chhera nahi gaya).
 * Yahan ek hi admin user hai jiski credentials .env se aati hain:
 *
 *   TRACKER_ADMIN_USER=admin
 *   TRACKER_ADMIN_PASS=admin
 *
 * Token wohi `JWT_SECRET` se sign hota hai jo aapka existing
 * `middleware/auth.js` verify karta hai — is liye dono compatible hain.
 */

const ADMIN_USER = process.env.TRACKER_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.TRACKER_ADMIN_PASS || 'admin';
const TOKEN_EXPIRY = process.env.TRACKER_TOKEN_EXPIRY || '7d';

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username aur password dono required hain',
      });
    }

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return res.status(401).json({
        success: false,
        message: 'Ghalat username ya password',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET .env me set nahi hai',
      });
    }

    // Payload wahi shape rakha hai jo existing auth/role middleware expect karta hai
    const payload = {
      userId: 'tracker-admin',
      username: ADMIN_USER,
      role: 'admin',
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: payload,
    });
  } catch (error) {
    console.error('[TrackerAuth] login failed:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Token valid hai ya nahi — frontend app load par isay call karta hai */
const me = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = { login, me };

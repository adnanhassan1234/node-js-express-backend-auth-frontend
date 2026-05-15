const bcrypt = require('bcryptjs');
const db = require('../config/db');
const crypto = require('crypto');
const validator = require('validator');
// const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const generateTokens = require('../utils/generateTokens');

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const checkEmailSql = `SELECT id FROM auth_user WHERE email = ?`;

    const [existing] = await db.query(checkEmailSql, [email]);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    const insertSql = `
        INSERT INTO auth_user 
        (name, email, password, verificationToken, emailVerified)
        VALUES (?, ?, ?, ?, ?)
      `;

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const [result] = await db.query(insertSql, [
      name,
      email,
      hashedPassword,
      verificationToken,
      false,
    ]);

    res.status(201).json({
      success: true,
      message: `Registered successfully. Please verify your email (${email})`,
      userId: result.insertId,
    });

    const verifyLink = `http://localhost:5000/verify-email?token=${verificationToken}`;

    sendEmail({
      to: email,
      subject: 'Verify your email',
      html: `<h2>Email Verification</h2>
              <p>Click the link below to verify your account:</p>
              <a href="${verifyLink}">Verify Email</a>
            `,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }
    const verifySql = `
      UPDATE auth_user
      SET emailVerified = TRUE, verificationToken = NULL
      WHERE verificationToken = ?
    `;
    const [result] = await db.query(verifySql, [token]);

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const checkEmailSql = `SELECT * FROM auth_user WHERE email = ?`;

    const [existing] = await db.query(checkEmailSql, [email]);

    if (existing.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email not found',
      });
    }

    const user = existing[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified. Please verify your email first.',
      });
    }

    const refreshTokenSql = `UPDATE auth_user SET refreshToken = ? WHERE id = ?`;

    const { accessToken, refreshToken } = generateTokens(user.id, 'user');
    await db.query(refreshTokenSql, [refreshToken, user.id]);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: error.message });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }
    const checkEmailSql = `SELECT id FROM auth_user WHERE email = ?`;

    const [existing] = await db.query(checkEmailSql, [email]);
    if (existing.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email not found',
      });
    }
    const userId = existing[0].id;
    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetPasswordToken).digest('hex');

    const resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);

    const updateTokenSql = `
      UPDATE auth_user
      SET resetPasswordToken = ?, resetPasswordExpire = ?
      WHERE id = ?
    `;
    await db.query(updateTokenSql, [hashedToken, resetPasswordExpire, userId]);
    const resetLink = `http://localhost:5000/reset-password?token=${resetPasswordToken}`;

    sendEmail({
      to: email,
      subject: 'Password Reset',
      html: `<h2>Password Reset</h2>
              <p>Click the link below to reset your password:</p>
              <a href="${resetLink}">Reset Password</a>
            `,
    });
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      resetLink,
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm new password are required',
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm new password do not match',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetPasswordTokenSql = `
        SELECT id FROM auth_user WHERE resetPasswordToken = ? AND resetPasswordExpire >  NOW()
    `;

    const [user] = await db.query(resetPasswordTokenSql, [hashedToken]);

    if (user.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
    const userId = user[0].id;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatePasswordSql = `
      UPDATE auth_user
      SET password = ?,
          resetPasswordToken = NULL,
          resetPasswordExpire = NULL
      WHERE id = ?
    `;

    await db.query(updatePasswordSql, [hashedPassword, userId]);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const refreshTokenSql = `SELECT id FROM auth_user WHERE refreshToken = ?`;
    const [user] = await db.query(refreshTokenSql, [refreshToken]);

    if (user.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }
    const userId = user[0].id;

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(userId, 'user');

    const generateTknSql = `UPDATE auth_user SET refreshToken = ? WHERE id = ?`;
    await db.query(generateTknSql, [newRefreshToken, userId]);

    res.status(200).json({
      success: true,
      refreshToken: newRefreshToken,
      accessToken,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const getAllUsersSql = `SELECT id, name, email, password,verificationToken,emailVerified, refreshToken,resetPasswordToken, resetPasswordExpire , created_at FROM auth_user`;
    const [users] = await db.query(getAllUsersSql);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  getAllUsers,
  refreshToken,
};

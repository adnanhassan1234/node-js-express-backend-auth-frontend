const userModel = require('../model/userModel');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const validator = require('validator');
const sendEmail = require('../utils/sendEmail');
const generateTokens = require('../utils/generateTokens');
const jwt = require('jsonwebtoken');

// export const registerSchema = z.object({
//   name: z.string().min(3, 'Name must be at least 3 characters'),

//   email: z.string().email('Invalid email format'),

//   password: z.string().min(6, 'Password must be at least 6 characters'),
// });
// const validatedData = registerSchema.parse(req.body);

// const { name, email, password } = validatedData;

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send({
        message: 'All fields are required!',
        success: false,
      });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).send({
        message: 'Invalid email format!',
        success: false,
      });
    }
    if (password.length < 6) {
      return res.status(400).send({
        message: 'Password must be at least 6 characters long!',
        success: false,
      });
    }
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send({
        message: 'Email already registered!',
        success: false,
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      emailVerified: false,
    });
    await user.save();

    const verifyLink = `http://localhost:3000/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: 'Verify your email',
      html: `
        <h2>Email Verification</h2>
        <p>Click below to verify your email:</p>
        <a href="${verifyLink}">Verify Email</a>
      `,
    });

    res.status(201).send({
      message: `Please check your email (${email}) to verify your account!`,
      success: true,
    });
  } catch (error) {
    res.status(500).send({ message: error.message, success: false });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await userModel.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).send({ message: 'Invalid or expired token', success: false });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).send({ message: 'Email verified successfully', success: true });
  } catch (error) {
    res.status(500).send({ message: error.message, success: false });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        message: 'All fields are required!',
        success: false,
      });
    }

    const user = await userModel.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).send({ message: 'User not found', success: false });
    }
    // compare the password with the hash password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({ message: 'Incorrect credentials', success: false });
    }
    if (!user.emailVerified) {
      return res.status(403).send({ message: 'Email not verified', success: false });
    }
    // const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    //   expiresIn: '15m',
    // });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    user.refreshToken = refreshToken;
    await user.save();
    res.status(200).send({
      message: 'Login successful',
      success: true,
      id: user._id,
      accessToken,
      refreshToken,
      role: user.role,
    });
  } catch (error) {
    res.status(500).send({ message: error.message, success: false });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    const message = `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password.</p>
      <p>Click the link below to reset it:</p>
      <a href="${resetLink}" target="_blank">${resetLink}</a>
      <p>This link will expire in 10 minutes.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset',
      html: message,
    });

    res.status(200).json({
      success: true,
      message: `please check your email (${user.email}) to reset your password`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

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

    const user = await userModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const loggedInUserId = req.user.userId;

    if (targetUserId === loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own role',
      });
    }

    const user = await userModel.findByIdAndUpdate(
      targetUserId,
      { role: req.user.role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: {
        id: user._id,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find();

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const refreshTokenData = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await userModel.findOne({
      _id: decoded.userId,
      refreshToken,
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);
    // ROTATE refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Refresh token expired, please login again',
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const user = await userModel.findOne({ refreshToken });

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updateUserRole,
  getAllUsers,
  refreshTokenData,
  logoutUser,
};

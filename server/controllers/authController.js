const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../services/emailService');

// ── Safety: warn when CLIENT_URL is localhost in production ──────────────────
// This is the #1 cause of broken email links in production.
const getClientUrl = () => {
  const url = process.env.CLIENT_URL || 'http://localhost:5173';
  if (process.env.NODE_ENV === 'production' && url.includes('localhost')) {
    console.error(
      '❌ CRITICAL: CLIENT_URL is set to localhost in production!\n' +
      '   Email verification and password reset links will NOT work.\n' +
      '   Set CLIENT_URL to your Vercel URL in Render environment variables.\n' +
      `   Current value: ${url}`
    );
  }
  return url;
};

const generateToken = (id, rememberMe = false) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : process.env.JWT_EXPIRE || '7d',
  });
};

// ────────────────────────────────────────────────────────────────────────────
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const user = await User.create({ name, email, password });

  // Generate email verification token
  const verificationToken = user.getEmailVerificationToken();
  await user.save();

  // ── FIX: Send verification email NON-BLOCKING (fire-and-forget) ──────────
  // Previously: await sendEmail(...) blocked the response. If SMTP timed out
  // on Render (common on cold starts), the 30s axios timeout fired and the
  // frontend showed "Something went wrong" — but the account WAS created.
  // Now: response is sent immediately; email is sent in background.
  const verifyUrl = `${getClientUrl()}/verify-email/${verificationToken}`;
  const { subject, html } = emailTemplates.verifyEmail(user.name, verifyUrl);
  // No await — intentional fire-and-forget
  sendEmail({ to: user.email, subject, html }).catch((err) => {
    console.error(`Registration email failed for ${user.email}: ${err.message}`);
  });

  // Respond immediately — user sees success toast right away
  res.status(201).json({
    success: true,
    message: 'Registration successful! Please check your email to verify your account.',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe = false } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('Your account has been suspended. Please contact support.');
  }

  // ── FIX: Use atomic update for lastLogin instead of full document save ───
  // Previously: user.save() re-validates & re-hashes nothing but still hits DB
  // Now: single findByIdAndUpdate is faster and avoids unnecessary middleware
  await User.updateOne({ _id: user._id }, { lastLogin: new Date(), rememberMe });

  const token = generateToken(user._id, rememberMe);

  res.json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
      isVerified: user.isVerified,
      isActive: user.isActive,
      preferences: user.preferences,
      stats: user.stats,
    },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification token');
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Email verified successfully!',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('department', 'name code');

  res.json({
    success: true,
    user,
  });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // Return success even if user not found (security)
    return res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save();

  const resetUrl = `${getClientUrl()}/reset-password/${resetToken}`;
  const { subject, html } = emailTemplates.resetPassword(user.name, resetUrl);

  // Non-blocking — password reset email shouldn't block the response either
  sendEmail({ to: user.email, subject, html }).catch((err) => {
    console.error(`Password reset email failed for ${user.email}: ${err.message}`);
  });

  res.json({
    success: true,
    message: 'Password reset email sent. Please check your inbox.',
  });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Password reset successful!',
    token,
  });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // Always return success — don't reveal if email exists
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      success: true,
      message: 'If that account exists and is unverified, a new email has been sent.',
    });
  }

  if (user.isVerified) {
    return res.json({
      success: true,
      message: 'Your email is already verified. You can log in normally.',
    });
  }

  // Generate fresh token (previous one may have expired)
  const verificationToken = user.getEmailVerificationToken();
  await user.save();

  const verifyUrl = `${getClientUrl()}/verify-email/${verificationToken}`;
  const { subject, html } = emailTemplates.verifyEmail(user.name, verifyUrl);
  sendEmail({ to: user.email, subject, html }).catch((err) => {
    console.error(`Resend verification email failed for ${user.email}: ${err.message}`);
  });

  res.json({
    success: true,
    message: 'If that account exists and is unverified, a new email has been sent.',
  });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = { register, login, verifyEmail, getMe, forgotPassword, resetPassword, logout, resendVerification };

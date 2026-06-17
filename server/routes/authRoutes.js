const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  verifyEmail,
  getMe,
  forgotPassword,
  resetPassword,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

router.post(
  '/register',
  validate([
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ]),
  register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

router.post(
  '/forgot-password',
  validate([body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')]),
  forgotPassword
);

router.post(
  '/reset-password/:token',
  validate([body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')]),
  resetPassword
);

module.exports = router;

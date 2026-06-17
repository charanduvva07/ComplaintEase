const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const asyncHandler = require('express-async-handler');

// @desc    Get all active departments (PUBLIC - no auth required for complaint submission)
// @route   GET /api/departments
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true })
    .select('name code description categories contactEmail contactPhone')
    .sort({ name: 1 });

  res.json({ success: true, departments });
}));

module.exports = router;

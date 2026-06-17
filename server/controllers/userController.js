const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('department', 'name code')
    .select('-password');

  res.json({ success: true, user });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;

  // Handle profile picture upload
  if (req.file) {
    // Delete old profile picture from Cloudinary
    if (user.profilePic?.publicId) {
      await cloudinary.uploader.destroy(user.profilePic.publicId).catch(console.error);
    }
    user.profilePic = {
      url: req.file.path,
      publicId: req.file.filename,
    };
  }

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePic: user.profilePic,
      isVerified: user.isVerified,
    },
  });
});

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
});

// @desc    Update notification preferences
// @route   PUT /api/users/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res) => {
  const { emailNotifications, pushNotifications } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      'preferences.emailNotifications': emailNotifications,
      'preferences.pushNotifications': pushNotifications,
    },
    { new: true }
  );

  res.json({ success: true, message: 'Preferences updated', preferences: user.preferences });
});

// @desc    Get user's complaints
// @route   GET /api/users/complaints
// @access  Private
const getUserComplaints = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { submittedBy: req.user._id };

  if (req.query.status) query.status = req.query.status;
  if (req.query.category) query.category = req.query.category;

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('department', 'name')
      .populate('assignedTo', 'name profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-activityLog -timeline'),
    Complaint.countDocuments(query),
  ]);

  res.json({
    success: true,
    complaints,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get user's notifications
// @route   GET /api/users/notifications
// @access  Private
const getUserNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .populate('sender', 'name profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ recipient: req.user._id }),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  res.json({
    success: true,
    notifications,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:id/read
// @access  Private
const markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() }
  );
  res.json({ success: true, message: 'Notification marked as read' });
});

// @desc    Mark all notifications as read
// @route   PUT /api/users/notifications/read-all
// @access  Private
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Get user dashboard stats
// @route   GET /api/users/dashboard
// @access  Private
const getUserDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [stats, recentComplaints, monthlyTrend] = await Promise.all([
    Complaint.aggregate([
      { $match: { submittedBy: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          submitted: { $sum: { $cond: [{ $eq: ['$status', 'Submitted'] }, 1, 0] } },
          underReview: { $sum: { $cond: [{ $eq: ['$status', 'Under Review'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $in: ['$status', ['Assigned', 'In Progress']] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
        },
      },
    ]),
    Complaint.find({ submittedBy: userId })
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('complaintId title status category createdAt urgency'),
    Complaint.aggregate([
      { $match: { submittedBy: userId } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]),
  ]);

  const categoryBreakdown = await Complaint.aggregate([
    { $match: { submittedBy: userId } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    stats: stats[0] || { total: 0, submitted: 0, underReview: 0, inProgress: 0, resolved: 0, rejected: 0 },
    recentComplaints,
    monthlyTrend,
    categoryBreakdown,
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updatePreferences,
  getUserComplaints,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUserDashboard,
};

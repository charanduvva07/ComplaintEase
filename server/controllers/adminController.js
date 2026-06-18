const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const Report = require('../models/Report');

// @desc    Get admin dashboard overview
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalStats,
    thisMonthStats,
    lastMonthStats,
    userStats,
    categoryBreakdown,
    statusBreakdown,
    departmentStats,
    recentComplaints,
    recentActivity,
  ] = await Promise.all([
    // All-time stats
    Complaint.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ['$status', ['Submitted', 'Under Review', 'Assigned', 'In Progress']] }, 1, 0] } },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $and: ['$resolvedAt', '$createdAt'] },
                { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] }, // hours
                null,
              ],
            },
          },
        },
      },
    ]),
    // This month
    Complaint.countDocuments({ createdAt: { $gte: startOfMonth } }),
    // Last month
    Complaint.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    // User stats
    User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
          thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0] } },
        },
      },
    ]),
    // Category breakdown
    Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    // Status breakdown
    Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    // Department performance
    Department.find({ isActive: true })
      .select('name code performance')
      .sort({ 'performance.totalComplaints': -1 })
      .limit(5),
    // Recent complaints
    Complaint.find()
      .populate('submittedBy', 'name email profilePic')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(8)
      .select('complaintId title status category urgency priority createdAt')
      .lean(),
    // Recent activity
    ActivityLog.find()
      .populate('performedBy', 'name role profilePic')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  res.json({
    success: true,
    stats: {
      ...(totalStats[0] || { total: 0, resolved: 0, pending: 0, avgResolutionTime: 0 }),
      thisMonth: thisMonthStats,
      lastMonth: lastMonthStats,
      growth: lastMonthStats > 0 ? (((thisMonthStats - lastMonthStats) / lastMonthStats) * 100).toFixed(1) : 0,
    },
    userStats: userStats[0] || { total: 0, active: 0, verified: 0, thisMonth: 0 },
    categoryBreakdown,
    statusBreakdown,
    departmentStats,
    recentComplaints,
    recentActivity,
  });
});

// @desc    Get all complaints with advanced filtering (admin)
// @route   GET /api/admin/complaints
// @access  Private (Admin/Staff)
const getAllComplaints = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.status) query.status = req.query.status;
  if (req.query.category) query.category = req.query.category;
  if (req.query.priority) query.priority = req.query.priority;
  if (req.query.department) query.department = req.query.department;
  if (req.query.urgency) query.urgency = req.query.urgency;
  if (req.query.assignedTo) query.assignedTo = req.query.assignedTo === 'unassigned' ? null : req.query.assignedTo;
  if (req.query.location) query.location = { $regex: req.query.location, $options: 'i' };

  if (req.query.from || req.query.to) {
    query.createdAt = {};
    if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) query.createdAt.$lte = new Date(req.query.to + 'T23:59:59');
  }

  if (req.query.search) {
    const r = { $regex: req.query.search, $options: 'i' };
    query.$or = [{ title: r }, { description: r }, { complaintId: r }, { location: r }];
  }

  const sortField = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('submittedBy', 'name email profilePic')
      .populate('department', 'name code')
      .populate('assignedTo', 'name email profilePic')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-activityLog -timeline')
      .lean(),
    Complaint.countDocuments(query),
  ]);

  res.json({
    success: true,
    complaints,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.role) query.role = req.query.role;
  if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
  if (req.query.isVerified !== undefined) query.isVerified = req.query.isVerified === 'true';
  if (req.query.search) {
    const r = { $regex: req.query.search, $options: 'i' };
    query.$or = [{ name: r }, { email: r }];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password')
      .lean(),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Toggle user status (suspend/activate)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot modify admin accounts');
  }

  user.isActive = !user.isActive;
  await user.save();

  await ActivityLog.create({
    action: `User ${user.isActive ? 'activated' : 'suspended'}`,
    performedBy: req.user._id,
    targetId: user._id,
    targetType: 'User',
    metadata: { email: user.email, name: user.name },
  });

  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'suspended'} successfully`,
    isActive: user.isActive,
  });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['user', 'staff', 'admin'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({ success: true, message: 'User role updated', user });
});

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const [
    monthlyTrend,
    categoryTrend,
    resolutionTrend,
    priorityBreakdown,
    urgencyBreakdown,
    topLocations,
    userGrowth,
    avgResolutionByDept,
    staffPerformance,
  ] = await Promise.all([
    // Monthly complaint trend
    Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    // Category breakdown
    Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    // Resolution time trend
    Complaint.aggregate([
      { $match: { status: { $in: ['Resolved', 'Closed'] }, resolvedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { month: { $month: '$resolvedAt' }, year: { $year: '$resolvedAt' } },
          avgTime: {
            $avg: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    // Priority breakdown
    Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    // Urgency breakdown
    Complaint.aggregate([
      { $group: { _id: '$urgency', count: { $sum: 1 } } },
    ]),
    // Top locations
    Complaint.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    // User growth
    User.aggregate([
      { $match: { createdAt: { $gte: startDate }, role: 'user' } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    // Avg resolution time by department
    Complaint.aggregate([
      { $match: { status: { $in: ['Resolved', 'Closed'] }, resolvedAt: { $exists: true } } },
      {
        $group: {
          _id: '$department',
          avgTime: {
            $avg: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] },
          },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' },
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$dept.name', avgTime: 1, count: 1 } },
      { $sort: { avgTime: 1 } },
    ]),
    // Staff performance (tasks completed and avg rating)
    Complaint.aggregate([
      { $match: { assignedTo: { $ne: null }, status: { $in: ['Resolved', 'Closed', 'Completed', 'Verified'] } } },
      {
        $group: {
          _id: '$assignedTo',
          completedTasks: { $sum: 1 },
          avgRating: { $avg: '$rating.score' },
        },
      },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' },
      },
      { $unwind: { path: '$staff', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$staff.name', completedTasks: 1, avgRating: 1 } },
      { $sort: { completedTasks: -1 } },
      { $limit: 10 },
    ]),
  ]);

  res.json({
    success: true,
    monthlyTrend,
    categoryTrend,
    resolutionTrend,
    priorityBreakdown,
    urgencyBreakdown,
    topLocations,
    userGrowth,
    avgResolutionByDept,
    staffPerformance,
  });
});

// @desc    Generate and save a report
// @route   POST /api/admin/reports/generate
// @access  Private (Admin)
const generateReport = asyncHandler(async (req, res) => {
  const { type, dateRange, filters } = req.body;

  const startDate = dateRange?.from ? new Date(dateRange.from) : new Date(Date.now() - 30 * 24 * 3600000);
  const endDate = dateRange?.to ? new Date(dateRange.to) : new Date();

  const query = {
    createdAt: { $gte: startDate, $lte: endDate },
    ...filters,
  };

  const [complaints, stats] = await Promise.all([
    Complaint.find(query)
      .populate('submittedBy', 'name email')
      .populate('department', 'name')
      .populate('assignedTo', 'name')
      .select('-activityLog -timeline -__v'),
    Complaint.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ['$status', ['Submitted', 'Under Review', 'Assigned', 'In Progress']] }, 1, 0] } },
          avgResolutionTime: {
            $avg: {
              $cond: [
                '$resolvedAt',
                { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] },
                null,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const summary = stats[0] || { total: 0, resolved: 0, pending: 0, avgResolutionTime: 0 };

  const report = await Report.create({
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report – ${new Date().toLocaleDateString()}`,
    type,
    generatedBy: req.user._id,
    dateRange: { from: startDate, to: endDate },
    filters,
    data: { complaints: complaints.slice(0, 500) }, // Limit data
    summary: {
      totalComplaints: summary.total,
      resolved: summary.resolved,
      pending: summary.pending,
      resolutionRate: summary.total > 0 ? ((summary.resolved / summary.total) * 100).toFixed(1) : 0,
      avgResolutionTime: Math.round(summary.avgResolutionTime || 0),
    },
  });

  res.status(201).json({ success: true, report });
});

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find()
    .populate('generatedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ success: true, reports });
});

// @desc    Get departments
// @route   GET /api/admin/departments
// @access  Private (Admin)
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find()
    .populate('head', 'name email profilePic')
    .populate('staff', 'name email profilePic')
    .sort({ name: 1 });

  res.json({ success: true, departments });
});

// @desc    Create department
// @route   POST /api/admin/departments
// @access  Private (Admin)
const createDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.create(req.body);
  res.status(201).json({ success: true, department: dept });
});

// @desc    Update department
// @route   PUT /api/admin/departments/:id
// @access  Private (Admin)
const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!dept) {
    res.status(404);
    throw new Error('Department not found');
  }
  res.json({ success: true, department: dept });
});

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
const getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    ActivityLog.find()
      .populate('performedBy', 'name email role profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(),
  ]);

  res.json({ success: true, logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// @desc    Bulk update complaints
// @route   PUT /api/admin/complaints/bulk
// @access  Private (Admin)
const bulkUpdateComplaints = asyncHandler(async (req, res) => {
  const { ids, action, value } = req.body;

  if (!ids?.length) {
    res.status(400);
    throw new Error('No complaint IDs provided');
  }

  const update = {};
  if (action === 'status') update.status = value;
  if (action === 'priority') update.priority = value;
  if (action === 'assign') update.assignedTo = value;

  const result = await Complaint.updateMany({ _id: { $in: ids } }, { $set: update });

  await ActivityLog.create({
    action: `Bulk ${action} update: ${value}`,
    performedBy: req.user._id,
    targetId: req.user._id,
    targetType: 'Complaint',
    metadata: { count: ids.length, ids: ids.slice(0, 10) },
  });

  res.json({ success: true, message: `${result.modifiedCount} complaints updated`, modifiedCount: result.modifiedCount });
});

// @desc    Get staff members for assignment
// @route   GET /api/admin/staff
// @access  Private (Admin)
const getStaff = asyncHandler(async (req, res) => {
  const staff = await User.find({ role: { $in: ['staff', 'admin'] }, isActive: true })
    .select('name email profilePic role department')
    .populate('department', 'name');

  res.json({ success: true, staff });
});

// @desc    Assign staff to a complaint
// @route   PUT /api/admin/complaints/:id/assign
// @access  Private (Admin)
const assignStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.body;
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  const staff = await User.findById(staffId);
  if (!staff || !['staff', 'admin'].includes(staff.role)) {
    res.status(400);
    throw new Error('Invalid staff member selected');
  }

  complaint.assignedTo = staffId;
  complaint.assignedBy = req.user._id;
  complaint.assignedAt = new Date();
  complaint.status = 'Assigned';

  complaint.timeline.push({
    status: 'Assigned',
    message: `Complaint assigned to ${staff.name}`,
    updatedBy: req.user._id
  });

  await complaint.save();

  const io = req.app.get('io');
  if (io) {
    io.to(complaint.submittedBy.toString()).emit('complaint:status_updated', {
      complaintId: complaint._id,
      status: 'Assigned',
      message: `Your complaint has been assigned to a technician`
    });

    if (staffId) {
      io.to(staffId.toString()).emit('staff:new_assignment', {
        complaintId: complaint._id,
        title: complaint.title
      });
    }
  }

  res.json({ success: true, complaint });
});

// @desc    Verify completed work
// @route   PUT /api/admin/complaints/:id/verify
// @access  Private (Admin)
const verifyCompletion = asyncHandler(async (req, res) => {
  const { action, notes } = req.body; // action: 'verify' or 'rework'
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.status !== 'Completed') {
    res.status(400);
    throw new Error('Complaint is not in Completed status');
  }

  const io = req.app.get('io');

  if (action === 'verify') {
    complaint.status = 'Verified';
    complaint.verifiedAt = new Date();
    complaint.verificationNotes = notes || 'Verified by Admin';
    complaint.timeline.push({
      status: 'Verified',
      message: complaint.verificationNotes,
      updatedBy: req.user._id
    });
  } else if (action === 'rework') {
    complaint.status = 'In Progress';
    complaint.verificationNotes = notes || 'Rework requested by Admin';
    complaint.timeline.push({
      status: 'In Progress',
      message: `Rework Requested: ${complaint.verificationNotes}`,
      updatedBy: req.user._id
    });
    if (complaint.assignedTo) {
       io.to(complaint.assignedTo.toString()).emit('staff:rework_requested', {
         complaintId: complaint._id,
         notes: complaint.verificationNotes
       });
    }
  } else {
    res.status(400);
    throw new Error('Invalid verification action');
  }

  await complaint.save();
  res.json({ success: true, complaint });
});

module.exports = {
  getDashboard,
  getAllComplaints,
  getAllUsers,
  toggleUserStatus,
  updateUserRole,
  getAnalytics,
  generateReport,
  getReports,
  getDepartments,
  createDepartment,
  updateDepartment,
  getAuditLogs,
  bulkUpdateComplaints,
  getStaff,
  assignStaff,
  verifyCompletion,
};

const asyncHandler = require('express-async-handler');
const Complaint = require('../models/Complaint');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Department = require('../models/Department');
const { createNotification } = require('../services/notificationService');
const { sendEmail, emailTemplates } = require('../services/emailService');

// Get io from app
const getIo = (req) => req.app.get('io');

// ────────────────────────────────────────────────────────────────────────────
// @desc    Submit a new complaint
// @route   POST /api/complaints
// @access  Private (User)
// ────────────────────────────────────────────────────────────────────────────
const submitComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, department, location, urgency } = req.body;

  // Validate department exists
  const dept = await Department.findById(department).lean();
  if (!dept) {
    res.status(404);
    throw new Error('Department not found');
  }

  const images = [];
  const documents = [];

  if (req.files) {
    req.files.forEach((file) => {
      const isImage = file.mimetype?.startsWith('image/');
      const fileData = {
        url: file.path,
        publicId: file.filename,
        filename: file.originalname,
      };
      if (isImage) {
        images.push(fileData);
      } else {
        documents.push({ ...fileData, mimetype: file.mimetype });
      }
    });
  }

  const complaint = await Complaint.create({
    title,
    description,
    category,
    department,
    location,
    urgency: urgency || 'Medium',
    submittedBy: req.user._id,
    images,
    documents,
  });

  const io = getIo(req);

  // ── FIX: Run stats updates and admin lookup in parallel (was sequential) ──
  const [admins] = await Promise.all([
    User.find({ role: 'admin', isActive: true }, '_id').lean(),
    User.updateOne({ _id: req.user._id }, { $inc: { 'stats.totalComplaints': 1 } }),
    Department.updateOne({ _id: department }, { $inc: { 'performance.totalComplaints': 1 } }),
  ]);

  // ── FIX: Create admin notifications in parallel (was sequential loop) ────
  if (admins.length > 0) {
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          recipient: admin._id,
          sender: req.user._id,
          title: 'New Complaint Submitted',
          message: `${req.user.name} submitted: ${title}`,
          type: 'complaint_submitted',
          relatedComplaint: complaint._id,
          link: `/admin/complaints/${complaint._id}`,
          io,
        })
      )
    );
  }

  // ── FIX: Send email NON-BLOCKING — never block complaint submission ────────
  const { subject, html } = emailTemplates.complaintSubmitted(req.user.name, complaint.complaintId, title);
  sendEmail({ to: req.user.email, subject, html }).catch((err) => {
    console.error(`Complaint email failed for ${req.user.email}: ${err.message}`);
  });

  // Emit real-time event
  if (io) {
    io.emit('complaint:new', {
      complaintId: complaint.complaintId,
      title,
      category,
      submittedBy: { name: req.user.name },
    });
  }

  await complaint.populate([
    { path: 'department', select: 'name code' },
    { path: 'submittedBy', select: 'name email profilePic' },
  ]);

  res.status(201).json({ success: true, message: 'Complaint submitted successfully', complaint });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Get all complaints (with filters)
// @route   GET /api/complaints
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
const getComplaints = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};

  // For regular users, only show their own complaints
  if (req.user.role === 'user') {
    query.submittedBy = req.user._id;
  }

  // Apply filters
  if (req.query.status) query.status = req.query.status;
  if (req.query.category) query.category = req.query.category;
  if (req.query.priority) query.priority = req.query.priority;
  if (req.query.department) query.department = req.query.department;
  if (req.query.urgency) query.urgency = req.query.urgency;
  if (req.query.location) query.location = { $regex: req.query.location, $options: 'i' };

  // Date range
  if (req.query.from || req.query.to) {
    query.createdAt = {};
    if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) query.createdAt.$lte = new Date(req.query.to);
  }

  // Search
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { complaintId: searchRegex },
      { location: searchRegex },
    ];
  }

  // Sort
  const sortField = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('department', 'name code')
      .populate('submittedBy', 'name email profilePic')
      .populate('assignedTo', 'name email profilePic')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-activityLog')
      .lean(),
    Complaint.countDocuments(query),
  ]);

  res.json({
    success: true,
    complaints,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('department', 'name code contactEmail contactPhone')
    .populate('submittedBy', 'name email profilePic phone')
    .populate('assignedTo', 'name email profilePic')
    .populate('timeline.updatedBy', 'name role profilePic')
    .populate('activityLog.performedBy', 'name role profilePic');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Check access: user can only view own complaints
  if (req.user.role === 'user' && complaint.submittedBy._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this complaint');
  }

  // Increment view count (non-blocking — don't await)
  Complaint.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).catch(() => {});

  res.json({ success: true, complaint });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Update complaint (admin/staff)
// @route   PUT /api/complaints/:id
// @access  Private (Admin/Staff)
// ────────────────────────────────────────────────────────────────────────────
const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate('submittedBy', 'name email preferences');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  const { status, priority, adminNotes, resolutionNotes, rejectionReason, assignedTo } = req.body;
  const oldStatus = complaint.status;
  const io = getIo(req);

  // Track changes for activity log
  const changes = [];

  if (status && status !== complaint.status) {
    complaint.status = status;
    changes.push(`Status changed from ${oldStatus} to ${status}`);

    // Add to timeline
    complaint.timeline.push({
      status,
      message: req.body.statusMessage || `Status updated to ${status}`,
      updatedBy: req.user._id,
    });

    if (status === 'Resolved') {
      complaint.resolvedAt = new Date();
      // Update department and user stats in parallel
      await Promise.all([
        Department.updateOne({ _id: complaint.department }, { $inc: { 'performance.resolvedComplaints': 1 } }),
        User.updateOne({ _id: complaint.submittedBy._id }, { $inc: { 'stats.resolvedComplaints': 1 } }),
      ]);
    }
    if (status === 'Closed') complaint.closedAt = new Date();

    // ── FIX: Send status email NON-BLOCKING ────────────────────────────────
    if (complaint.submittedBy.preferences?.emailNotifications) {
      const { subject, html } = emailTemplates.statusChanged(
        complaint.submittedBy.name,
        complaint.complaintId,
        complaint.title,
        oldStatus,
        status
      );
      sendEmail({ to: complaint.submittedBy.email, subject, html }).catch((err) => {
        console.error(`Status email failed: ${err.message}`);
      });
    }

    await createNotification({
      recipient: complaint.submittedBy._id,
      sender: req.user._id,
      title: 'Complaint Status Updated',
      message: `Your complaint ${complaint.complaintId} status changed to ${status}`,
      type: 'status_changed',
      relatedComplaint: complaint._id,
      link: `/complaints/${complaint._id}`,
      io,
    });

    // Real-time event
    if (io) {
      io.to(`user_${complaint.submittedBy._id}`).emit('complaint:statusChanged', {
        complaintId: complaint._id,
        complaintNumber: complaint.complaintId,
        newStatus: status,
        oldStatus,
      });
    }
  }

  if (priority) {
    if (priority !== complaint.priority) changes.push(`Priority changed to ${priority}`);
    complaint.priority = priority;
  }
  if (adminNotes !== undefined) complaint.adminNotes = adminNotes;
  if (resolutionNotes !== undefined) complaint.resolutionNotes = resolutionNotes;
  if (rejectionReason !== undefined) complaint.rejectionReason = rejectionReason;

  if (assignedTo !== undefined) {
    complaint.assignedTo = assignedTo || null;
    if (assignedTo) {
      complaint.status = complaint.status === 'Submitted' ? 'Assigned' : complaint.status;
      changes.push(`Assigned to staff member`);

      await createNotification({
        recipient: assignedTo,
        sender: req.user._id,
        title: 'Complaint Assigned to You',
        message: `Complaint ${complaint.complaintId}: ${complaint.title}`,
        type: 'complaint_assigned',
        relatedComplaint: complaint._id,
        link: `/complaints/${complaint._id}`,
        io,
      });
    }
  }

  // Add to activity log
  if (changes.length > 0) {
    complaint.activityLog.push({
      action: changes.join('; '),
      performedBy: req.user._id,
      details: JSON.stringify(req.body),
    });
  }

  await complaint.save();

  await complaint.populate([
    { path: 'department', select: 'name code' },
    { path: 'submittedBy', select: 'name email profilePic' },
    { path: 'assignedTo', select: 'name email profilePic' },
  ]);

  res.json({ success: true, message: 'Complaint updated successfully', complaint });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Admin or owner)
// ────────────────────────────────────────────────────────────────────────────
const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).lean();

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Only admin or the owner can delete (only if Submitted)
  if (req.user.role === 'user') {
    if (complaint.submittedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this complaint');
    }
    if (complaint.status !== 'Submitted') {
      res.status(400);
      throw new Error('Cannot delete a complaint that is already being processed');
    }
  }

  await Complaint.deleteOne({ _id: req.params.id });

  res.json({ success: true, message: 'Complaint deleted successfully' });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Add comment to complaint
// @route   POST /api/complaints/:id/comments
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
const addComment = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('submittedBy', '_id name email preferences')
    .lean();

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Check access
  if (req.user.role === 'user' && complaint.submittedBy._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to comment on this complaint');
  }

  const attachments = req.files?.map((f) => ({
    url: f.path,
    publicId: f.filename,
    filename: f.originalname,
    mimetype: f.mimetype,
  })) || [];

  const comment = await Comment.create({
    complaintId: complaint._id,
    author: req.user._id,
    content: req.body.content,
    parentId: req.body.parentId || null,
    attachments,
    isAdminReply: ['admin', 'staff'].includes(req.user.role),
    isInternal: req.body.isInternal && req.user.role !== 'user',
  });

  await comment.populate('author', 'name email profilePic role');

  const io = getIo(req);
  const isAdminComment = ['admin', 'staff'].includes(req.user.role);

  const notifyUser = isAdminComment ? complaint.submittedBy._id : null;
  const notifyAdmins = !isAdminComment;

  if (notifyUser) {
    await createNotification({
      recipient: notifyUser,
      sender: req.user._id,
      title: 'New Reply on Your Complaint',
      message: `Admin replied to your complaint ${complaint.complaintId}`,
      type: 'admin_reply',
      relatedComplaint: complaint._id,
      link: `/complaints/${complaint._id}`,
      io,
    });

    // ── FIX: Send reply email NON-BLOCKING ────────────────────────────────
    if (complaint.submittedBy.preferences?.emailNotifications) {
      sendEmail({
        to: complaint.submittedBy.email,
        subject: `New reply on complaint ${complaint.complaintId}`,
        html: `<p>Hello ${complaint.submittedBy.name}, an admin has replied to your complaint <strong>${complaint.complaintId}</strong>.</p>`,
      }).catch((err) => console.error(`Reply email failed: ${err.message}`));
    }
  }

  if (notifyAdmins) {
    // ── FIX: Notify admins in parallel (was sequential loop) ─────────────
    const admins = await User.find({ role: 'admin', isActive: true }, '_id').lean();
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          recipient: admin._id,
          sender: req.user._id,
          title: 'New Comment on Complaint',
          message: `User commented on complaint ${complaint.complaintId}`,
          type: 'new_comment',
          relatedComplaint: complaint._id,
          link: `/admin/complaints/${complaint._id}`,
          io,
        })
      )
    );
  }

  // Real-time
  if (io) {
    io.to(`complaint_${complaint._id}`).emit('comment:new', { comment });
  }

  res.status(201).json({ success: true, comment });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Get comments for a complaint
// @route   GET /api/complaints/:id/comments
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
const getComments = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).lean();
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Check access
  if (req.user.role === 'user' && complaint.submittedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const baseQuery = {
    complaintId: req.params.id,
    isDeleted: false,
  };

  // Regular users can't see internal comments
  if (req.user.role === 'user') {
    baseQuery.isInternal = false;
  }

  // ── FIX: Fetch ALL comments in 2 queries instead of N+1 ─────────────────
  // Previously: 1 query for top-level, then 1 query per comment for replies
  // Now: fetch all at once, group by parentId in memory
  const allComments = await Comment.find(baseQuery)
    .populate('author', 'name email profilePic role')
    .sort({ createdAt: 1 })
    .lean();

  // Group into top-level + replies map
  const topLevel = [];
  const repliesMap = new Map();

  for (const comment of allComments) {
    if (!comment.parentId) {
      topLevel.push(comment);
    } else {
      const pid = comment.parentId.toString();
      if (!repliesMap.has(pid)) repliesMap.set(pid, []);
      repliesMap.get(pid).push(comment);
    }
  }

  // Attach replies to their parent comment
  const commentsWithReplies = topLevel.map((comment) => ({
    ...comment,
    replies: repliesMap.get(comment._id.toString()) || [],
  }));

  // Mark as read (non-blocking — don't await)
  Comment.updateMany(
    { complaintId: req.params.id, 'readBy.user': { $ne: req.user._id } },
    { $addToSet: { readBy: { user: req.user._id, readAt: new Date() } } }
  ).catch(() => {});

  res.json({ success: true, comments: commentsWithReplies });
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Rate a resolved complaint
// @route   POST /api/complaints/:id/rate
// @access  Private (User, owner only)
// ────────────────────────────────────────────────────────────────────────────
const rateComplaint = asyncHandler(async (req, res) => {
  const { score, feedback } = req.body;

  if (!score || score < 1 || score > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.submittedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the complaint owner can rate it');
  }

  if (complaint.status !== 'Resolved' && complaint.status !== 'Closed') {
    res.status(400);
    throw new Error('Can only rate resolved or closed complaints');
  }

  if (complaint.rating.score) {
    res.status(400);
    throw new Error('You have already rated this complaint');
  }

  complaint.rating = { score, feedback: feedback || '', ratedAt: new Date() };
  await complaint.save();

  res.json({ success: true, message: 'Thank you for your feedback!', rating: complaint.rating });
});

module.exports = {
  submitComplaint,
  getComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
  addComment,
  getComments,
  rateComplaint,
};

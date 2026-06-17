const asyncHandler = require('express-async-handler');
const Complaint = require('../models/Complaint');
const { sendEmail, emailTemplates } = require('../services/emailService');

// @desc    Get assigned complaints for staff
// @route   GET /api/staff/complaints
// @access  Private/Staff
const getAssignedComplaints = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const match = { assignedTo: req.user._id };

  if (req.query.status) {
    match.status = req.query.status;
  }
  if (req.query.priority) {
    match.priority = req.query.priority;
  }

  const complaints = await Complaint.find(match)
    .populate('submittedBy', 'name email profilePic phone')
    .populate('department', 'name code')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await Complaint.countDocuments(match);

  // Performance stats for staff dashboard
  const stats = await Complaint.aggregate([
    { $match: { assignedTo: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    count: complaints.length,
    total,
    pages: Math.ceil(total / limit),
    page,
    complaints,
    stats
  });
});

// @desc    Accept assigned complaint
// @route   PUT /api/staff/complaints/:id/accept
// @access  Private/Staff
const acceptComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.assignedTo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not assigned to this complaint');
  }

  if (complaint.status !== 'Assigned') {
    res.status(400);
    throw new Error('Complaint is not in Assigned status');
  }

  complaint.status = 'Accepted';
  complaint.timeline.push({
    status: 'Accepted',
    message: `Work accepted by staff ${req.user.name}`,
    updatedBy: req.user._id
  });

  await complaint.save();

  // Notify User
  const io = req.app.get('io');
  if (io) {
    io.to(complaint.submittedBy.toString()).emit('complaint:status_updated', {
      complaintId: complaint._id,
      status: 'Accepted',
      message: 'Your assigned technician has accepted the work'
    });
  }

  res.json({ success: true, complaint });
});

// @desc    Start work on complaint
// @route   PUT /api/staff/complaints/:id/start
// @access  Private/Staff
const startWork = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.assignedTo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not assigned to this complaint');
  }

  complaint.status = 'In Progress';
  complaint.startedAt = new Date();
  complaint.timeline.push({
    status: 'In Progress',
    message: `Work started by staff ${req.user.name}`,
    updatedBy: req.user._id
  });

  await complaint.save();

  // Notify User
  const io = req.app.get('io');
  if (io) {
    io.to(complaint.submittedBy.toString()).emit('complaint:status_updated', {
      complaintId: complaint._id,
      status: 'In Progress',
      message: 'Technician has started working on your complaint'
    });
  }

  res.json({ success: true, complaint });
});

// @desc    Complete complaint work
// @route   PUT /api/staff/complaints/:id/complete
// @access  Private/Staff
const completeWork = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate('submittedBy', 'name email');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.assignedTo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not assigned to this complaint');
  }

  const { resolutionNotes } = req.body;
  if (!resolutionNotes) {
    res.status(400);
    throw new Error('Resolution notes are required');
  }

  const images = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      images.push({
        url: file.path,
        publicId: file.filename,
      });
    });
  }

  complaint.status = 'Completed';
  complaint.completedAt = new Date();
  complaint.resolutionNotes = resolutionNotes;
  complaint.completionProofImages = images;
  
  complaint.timeline.push({
    status: 'Completed',
    message: `Work marked as completed. Pending Admin Verification.`,
    updatedBy: req.user._id
  });

  await complaint.save();

  // Notify Admin (we can broadcast to admins room if setup, or just log)
  const io = req.app.get('io');
  if (io) {
    io.to(complaint.submittedBy._id.toString()).emit('complaint:status_updated', {
      complaintId: complaint._id,
      status: 'Completed',
      message: 'Technician has completed the work. It is currently pending verification.'
    });
  }

  // Send Email to User (Optional: Wait for Verified/Resolved instead, but let's send a heads up)
  const verifyUrl = `${process.env.CLIENT_URL}/complaints/${complaint._id}`;
  const html = emailTemplates.statusChanged(complaint.submittedBy.name, complaint.complaintId, complaint.title, 'In Progress', 'Completed (Pending Verification)').html;
  await sendEmail({ to: complaint.submittedBy.email, subject: `Work Completed: ${complaint.complaintId}`, html });

  res.json({ success: true, complaint });
});

module.exports = {
  getAssignedComplaints,
  acceptComplaint,
  startWork,
  completeWork
};

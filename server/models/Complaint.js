const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Water', 'Electricity', 'Internet', 'Roads', 'Sanitation', 'Transport', 'Hostel', 'Academic', 'Technical', 'Other'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Verified', 'Resolved', 'Closed', 'Rejected'],
      default: 'Submitted',
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: Date,
    startedAt: Date,
    completedAt: Date,
    verifiedAt: Date,
    verificationNotes: { type: String, default: '' },
    completionProofImages: [
      {
        url: String,
        publicId: String,
      },
    ],
    images: [
      {
        url: String,
        publicId: String,
        filename: String,
      },
    ],
    documents: [
      {
        url: String,
        publicId: String,
        filename: String,
        mimetype: String,
      },
    ],
    timeline: [
      {
        status: String,
        message: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    activityLog: [
      {
        action: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        details: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    adminNotes: { type: String, default: '' },
    resolutionNotes: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    resolvedAt: Date,
    closedAt: Date,
    dueDate: Date,
    rating: {
      score: { type: Number, min: 1, max: 5, default: null },
      feedback: { type: String, default: '' },
      ratedAt: Date,
    },
    isEscalated: { type: Boolean, default: false },
    escalationReason: { type: String, default: '' },
    tags: [String],
    viewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for comment count
complaintSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'complaintId',
  count: true,
});

// Auto-generate complaint ID (timestamp-based to avoid race conditions)
complaintSchema.pre('save', async function (next) {
  if (!this.complaintId) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.complaintId = `CE-${ts}-${rand}`;
  }
  // Add initial timeline entry
  if (this.isNew) {
    this.timeline.push({
      status: 'Submitted',
      message: 'Complaint submitted successfully',
      updatedBy: this.submittedBy,
    });
  }
  next();
});


// Indexes
complaintSchema.index({ submittedBy: 1, createdAt: -1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ department: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ createdAt: -1 });
// Note: complaintId has unique:true, so index is auto-created


module.exports = mongoose.model('Complaint', complaintSchema);

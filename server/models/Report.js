const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['monthly', 'department', 'resolution', 'analytics', 'custom'],
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dateRange: {
      from: Date,
      to: Date,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    summary: {
      totalComplaints: Number,
      resolved: Number,
      pending: Number,
      resolutionRate: Number,
      avgResolutionTime: Number,
    },
    fileUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'ready',
    },
  },
  { timestamps: true }
);

reportSchema.index({ generatedBy: 1, createdAt: -1 });
reportSchema.index({ type: 1 });

module.exports = mongoose.model('Report', reportSchema);

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    description: { type: String, default: '' },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    categories: [
      {
        type: String,
        enum: ['Water', 'Electricity', 'Internet', 'Roads', 'Sanitation', 'Transport', 'Hostel', 'Academic', 'Technical', 'Other'],
      },
    ],
    isActive: { type: Boolean, default: true },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    performance: {
      totalComplaints: { type: Number, default: 0 },
      resolvedComplaints: { type: Number, default: 0 },
      avgResolutionTime: { type: Number, default: 0 }, // in hours
      rating: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Note: name and code have unique:true, so their indexes are auto-created
departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);

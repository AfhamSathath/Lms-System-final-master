const mongoose = require('mongoose');

const repeatExamSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  previousGrade: {
    type: String,
    enum: ['F', 'E', 'D', 'D+', 'C-'], // Only certain grades can repeat
    required: true
  },
  academicYear: {
    type: String, // e.g. "2025-2026"
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  feeStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  paymentReference: String
}, {
  timestamps: true
});

// Ensure a student can only register for a repeat once per course per academic year
repeatExamSchema.index({ student: 1, course: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.models.RepeatExam || mongoose.model('RepeatExam', repeatExamSchema);

const mongoose = require('mongoose');

const moderatorAssignmentSchema = new mongoose.Schema({
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lecturer is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Moderator is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure unique assignment per subject/lecturer per semester
moderatorAssignmentSchema.index({ lecturer: 1, subject: 1, academicYear: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('ModeratorAssignment', moderatorAssignmentSchema);

const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // e.g., '08:30 AM'
    required: true
  },
  lecturerHour: {
    type: Number, // Number of hours expected for the session
    required: true
  },
  batch: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published_to_hod', 'approved_by_hod'],
    default: 'draft'
  },
  attendanceRecords: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'present'
    },
    remarks: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

attendanceSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);

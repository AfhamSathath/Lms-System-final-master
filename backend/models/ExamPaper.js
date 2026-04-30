const mongoose = require('mongoose');

const examPaperSchema = new mongoose.Schema({
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
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String,
    required: [true, 'Please upload the exam paper file']
  },
  fileName: String,
  instructions: String,
  duration: String, // e.g., "3 Hours"
  totalMarks: Number,
  examType: {
    type: String,
    enum: ['Final', 'Midterm', 'Repeat', 'Special'],
    default: 'Final'
  },
  examDate: Date,
  status: {
    type: String,
    enum: [
      'Draft',
      'Pending_Moderation',
      'Changes_Requested_Moderator',
      'Moderated',
      'Pending_HOD_Approval',
      'Changes_Requested_HOD',
      'Approved', // Approved by HOD
      'Pending_Exam_Officer',
      'Accepted_By_Exam_Officer'
    ],
    default: 'Draft'
  },
  moderatorComments: [{
    comment: String,
    date: { type: Date, default: Date.now }
  }],
  hodComments: [{
    comment: String,
    date: { type: Date, default: Date.now }
  }],
  version: {
    type: Number,
    default: 1
  },
  department: String,
  academicYear: String,
  semester: Number,
  submittedAt: Date,
  moderatedAt: Date,
  approvedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('ExamPaper', examPaperSchema);

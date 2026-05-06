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
  batch: String,
  submittedAt: Date,
  moderatedAt: Date,
  approvedAt: Date,
  moderatorSignature: String,
  hodSignature: String,
  examOfficerSignature: String,
  acceptedAtExamOfficer: Date,
  moderationReport: {
    submittedDocuments: {
      examPaperSigned: { type: Boolean, default: false },
      examPaperSignedUrl: String,
      examPaperSignedApproved: { type: Boolean, default: false },
      coursePlan: { type: Boolean, default: false },
      coursePlanUrl: String,
      coursePlanApproved: { type: Boolean, default: false },
      modelAnswers: { type: Boolean, default: false },
      modelAnswersUrl: String,
      modelAnswersApproved: { type: Boolean, default: false },
      continuousAssessmentPapers: { type: Boolean, default: false },
      continuousAssessmentPapersUrl: [String],
      continuousAssessmentPapersApproved: { type: Boolean, default: false },
      previousExamPapers: { type: Boolean, default: false },
      previousExamPapersUrl: [String],
      previousExamPapersApproved: { type: Boolean, default: false }
    },
    ilosAssessed: [{
      questionNo: String,
      ilo: String,
      bloomsTaxonomy: {
        remembering: { type: Boolean, default: false },
        understanding: { type: Boolean, default: false },
        applying: { type: Boolean, default: false },
        analyzing: { type: Boolean, default: false },
        evaluating: { type: Boolean, default: false },
        creating: { type: Boolean, default: false }
      }
    }],
    reportDate: { type: Date, default: Date.now },
    moderatorSection: {
      ilosComments: String,
      paperAssessment: String,
      organizationClear: { type: String, enum: ['YES', 'NO', ''], default: '' },
      organizationSuggestions: String,
      wordingProper: { type: String, enum: ['YES', 'NO', ''], default: '' },
      wordingSuggestions: String,
      modelAnswersPrepared: { type: String, enum: ['YES', 'NO', ''], default: '' },
      modelAnswersSuggestions: String,
      grammarSpelling: String,
      improvementComments: String,
      moderatorSignature: String,
      moderatedAt: Date
    }
  },
  versionHistory: [{
    version: Number,
    fileUrl: String,
    fileName: String,
    submittedAt: Date,
    moderatedAt: Date,
    approvedAt: Date,
    moderationReport: Object,
    moderatorComments: Array,
    hodComments: Array,
    status: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ExamPaper', examPaperSchema);

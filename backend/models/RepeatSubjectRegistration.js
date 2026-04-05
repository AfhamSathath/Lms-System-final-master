const mongoose = require('mongoose');

const repeatSubjectRegistrationSchema = new mongoose.Schema({
  // ===== STUDENT INFORMATION =====
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
    index: true
  },
  studentIndex: {
    type: String,
    required: true, // Captured from student record for quick reference
    index: true
  },
  studentName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },

  // ===== SUBJECT INFORMATION =====
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  subjectCode: {
    type: String,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    required: true
  },

  // ===== PREVIOUS ATTEMPT DETAILS =====
  previousAttempt: {
    year: String, // e.g., "2024"
    semester: Number, // 1 or 2
    examType: String, // "Midterm", "Final"
    marks: Number,
    grade: {
      type: String,
      enum: ['F', 'E', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A', 'A+'],
      required: true
    },
    gpa: Number,
    attendancePercentage: Number // Added for lecturer approval criteria
  },


  // ===== CURRENT REGISTRATION =====
  academicYear: {
    type: String, // "2025-2026"
    required: true
  },
  semester: {
    type: Number,
    enum: [1, 2],
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },

  // ===== REPEAT REASON =====
  repeatReason: {
    type: String,
    enum: ['FAILED', 'GRADE_IMPROVEMENT', 'INCOMPLETE'],
    default: 'FAILED',
    required: true
  },
  additionalComments: String, // Optional comment from student

  // ===== APPROVAL WORKFLOW =====
  registrationStatus: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'LECTURER_APPROVED', 'HOD_APPROVED', 'REGISTRAR_APPROVED', 'EXAM_OFFICER_APPROVED', 'ADMIN_APPROVED', 'FEE_ALLOCATED', 'PAYMENT_PENDING', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'EXAM_SCHEDULED', 'COMPLETED', 'REJECTED'],
    default: 'DRAFT',
    index: true
  },


  // === Student Request Status ===
  studentSubmittedAt: Date,

  // === Lecturer Review ===
  lecturerReviewStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  lecturerReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lecturerReviewedAt: Date,
  lecturerReviewComments: String,


  // === HOD Review ===
  hodReviewStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  hodReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hodReviewedAt: Date,
  hodReviewComments: String,

  // === Registrar Approval ===
  registrarApprovalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  registrarApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  registrarApprovedAt: Date,
  registrarApprovalReason: String,

  // === Exam Officer Review ===
  examOfficerReviewStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  examOfficerReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  examOfficerReviewedAt: Date,
  examOfficerReviewComments: String,

  // === Admin Final Approval ===
  adminApprovalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  adminApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminApprovedAt: Date,
  adminApprovalReason: String,

  // === Fee Allocation (By Exam Officer) ===
  feeAllocationStatus: {
    type: String,
    enum: ['PENDING', 'ALLOCATED', 'REJECTED'],
    default: 'PENDING'
  },
  feeAllocatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  feeAllocatedAt: Date,
  feeAllocationComments: String,

  // === Finance ===
  feeStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'WAIVED', 'PAYMENT_DELAYED', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PAYMENT_REJECTED'],
    default: 'PENDING'
  },
  repeatFeeAmount: {
    type: Number,
    default: 2500 // Standard repeat fee in LKR
  },
  invoiceNumber: String,
  paymentReference: String,
  paymentProof: {
    type: String, // Storage path for payment receipt
  },
  paymentSubmittedAt: Date,
  paymentVerifiedAt: Date,
  paymentVerifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentVerificationComments: String,

  // === Exam Slot Allocation ===
  examScheduleStatus: {
    type: String,
    enum: ['NOT_SCHEDULED', 'SCHEDULED', 'COMPLETED'],
    default: 'NOT_SCHEDULED'
  },
  allocatedExamSlot: {
    date: Date,
    time: String,
    venue: String,
    examCode: String
  },

  // ===== AUDIT TRAIL =====
  workflowHistory: [{
    stage: String, // "SUBMITTED", "HOD_APPROVED", "PAYMENT_COMPLETED", etc.
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    actedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: String
  }],

  // ===== SYSTEM TRACKING =====
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate registrations
repeatSubjectRegistrationSchema.index({ student: 1, subject: 1, academicYear: 1, semester: 1 }, { unique: true });

// Index for quick queries
repeatSubjectRegistrationSchema.index({ registrationStatus: 1, academicYear: 1 });
repeatSubjectRegistrationSchema.index({ hodReviewStatus: 1 });
repeatSubjectRegistrationSchema.index({ registrarApprovalStatus: 1 });

module.exports = mongoose.models.RepeatSubjectRegistration || mongoose.model('RepeatSubjectRegistration', repeatSubjectRegistrationSchema);

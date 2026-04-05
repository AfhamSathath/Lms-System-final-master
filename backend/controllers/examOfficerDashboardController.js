/**
 * EXAM OFFICER DASHBOARD CONTROLLER
 * Handles exam scheduling and fee management for repeat subject registrations
 */

const RepeatSubjectRegistration = require('../models/RepeatSubjectRegistration');
const User = require('../models/user');
const emailService = require('../utils/emailService');

/**
 * @desc    Get pending registrations for Exam Officer review
 * @route   GET /api/exam-officer/pending-reviews
 * @access  Private/Exam Officer
 * @scenario Exam Officer sees registrations approved by Registrar
 */
exports.getPendingExamAllocations = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const pendingReviews = await RepeatSubjectRegistration.find({
      registrationStatus: 'REGISTRAR_APPROVED',
      examOfficerReviewStatus: 'PENDING'
    })
    .populate('student', 'name studentId department email')
    .populate('subject', 'name code')
    .populate('hodReviewedBy', 'name')
    .populate('registrarApprovedBy', 'name')
    .sort({ registrarApprovedAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingReviews.length,
      data: pendingReviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Exam Officer reviews registration
 * @route   PUT /api/exam-officer/review/:id
 * @access  Private/Exam Officer
 * @scenario Exam Officer reviews and forwards to Admin
 */
exports.reviewApplication = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const { action, comments } = req.body; // action: 'APPROVE' or 'REJECT'

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      registrationStatus: 'REGISTRAR_APPROVED',
      examOfficerReviewStatus: 'PENDING'
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or already processed'
      });
    }

    if (action === 'APPROVE') {
      registration.registrationStatus = 'EXAM_OFFICER_REVIEW';
      registration.examOfficerReviewStatus = 'APPROVED';
      registration.workflowHistory.push({
        stage: 'EXAM_OFFICER_REVIEW',
        status: 'COMPLETED',
        timestamp: new Date(),
        performedBy: req.user.id,
        comments: comments || 'Exam Officer reviewed and forwarded to Admin'
      });
    } else if (action === 'REJECT') {
      registration.registrationStatus = 'REJECTED';
      registration.examOfficerReviewStatus = 'REJECTED';
      registration.workflowHistory.push({
        stage: 'EXAM_OFFICER_REJECTED',
        status: 'COMPLETED',
        timestamp: new Date(),
        performedBy: req.user.id,
        comments: comments || 'Exam Officer rejected the registration'
      });
    }

    registration.examOfficerReviewedBy = req.user.id;
    registration.examOfficerReviewedAt = new Date();
    registration.examOfficerReviewComments = comments;

    await registration.save();
    await registration.populate(['student', 'subject', 'examOfficerReviewedBy']);

    // Send email notification
    if (action === 'APPROVE') {
      await emailService.sendRepeatApplicationExamOfficerReviewed(registration);
    } else {
      await emailService.sendRepeatApplicationRejected(registration, 'Exam Officer', comments);
    }

    res.status(200).json({
      success: true,
      message: `Registration ${action.toLowerCase()}d by Exam Officer`,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get registrations ready for fee allocation
 * @route   GET /api/exam-officer/fee-pending
 * @access  Private/Exam Officer
 * @scenario Exam Officer sees approved registrations ready for fee allocation
 */
exports.getPendingFeeAllocations = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const registrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'ADMIN_APPROVED',
      feeAllocationStatus: 'PENDING'
    })
    .populate('student', 'name studentId department email')
    .populate('subject', 'name code')
    .sort({ adminApprovedAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Exam Officer allocates fees for repeat examination
 * @route   PUT /api/exam-officer/allocate-fees/:id
 * @access  Private/Exam Officer
 * @scenario Exam Officer sets the fee amount and notifies student
 */
exports.allocateRepeatFees = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const { feeAmount, comments } = req.body;

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      registrationStatus: 'ADMIN_APPROVED',
      feeAllocationStatus: 'PENDING'
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or not ready for fee allocation'
      });
    }

    // Generate invoice number
    const invoiceNumber = `REP-${Date.now()}-${registration._id.toString().slice(-6).toUpperCase()}`;

    registration.registrationStatus = 'FEE_ALLOCATED';
    registration.feeAllocationStatus = 'ALLOCATED';
    registration.feeAllocatedBy = req.user.id;
    registration.feeAllocatedAt = new Date();
    registration.feeAllocationComments = comments;
    registration.repeatFeeAmount = feeAmount || 2500;
    registration.invoiceNumber = invoiceNumber;
    registration.feeStatus = 'PENDING';

    registration.workflowHistory.push({
      stage: 'FEE_ALLOCATED',
      status: 'COMPLETED',
      timestamp: new Date(),
      performedBy: req.user.id,
      comments: `Fee allocated: LKR ${feeAmount || 2500}, Invoice: ${invoiceNumber}`
    });

    await registration.save();
    await registration.populate(['student', 'subject', 'feeAllocatedBy']);

    // Send email notification to student with fee details
    await emailService.sendRepeatFeeDueNotification(registration);

    res.status(200).json({
      success: true,
      message: 'Fees allocated successfully. Student notified.',
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pending payment verifications
 * @route   GET /api/exam-officer/payment-pending
 * @access  Private/Exam Officer
 * @scenario Exam Officer sees submitted payment proofs
 */
exports.getPendingPaymentVerifications = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const registrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'PAYMENT_SUBMITTED',
      feeStatus: 'PAYMENT_SUBMITTED'
    })
    .populate('student', 'name studentId department email')
    .populate('subject', 'name code')
    .sort({ paymentSubmittedAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Exam Officer verifies or rejects payment
 * @route   PUT /api/exam-officer/verify-payment/:id
 * @access  Private/Exam Officer
 * @scenario Exam Officer checks payment proof and approves/rejects
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const { action, comments } = req.body; // action: 'APPROVE' or 'REJECT'

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      registrationStatus: 'PAYMENT_SUBMITTED',
      feeStatus: 'PAYMENT_SUBMITTED'
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or payment already verified'
      });
    }

    if (action === 'APPROVE') {
      registration.registrationStatus = 'PAYMENT_VERIFIED';
      registration.feeStatus = 'PAYMENT_VERIFIED';
      registration.paymentVerifiedAt = new Date();
      registration.paymentVerifiedBy = req.user.id;
      registration.paymentVerificationComments = comments;

      registration.workflowHistory.push({
        stage: 'PAYMENT_VERIFIED',
        status: 'COMPLETED',
        timestamp: new Date(),
        performedBy: req.user.id,
        comments: comments || 'Payment verified successfully'
      });

      // Send email notification to student
      await emailService.sendRepeatPaymentVerifiedNotification(registration);

    } else if (action === 'REJECT') {
      registration.registrationStatus = 'PAYMENT_PENDING';
      registration.feeStatus = 'PAYMENT_REJECTED';
      registration.paymentVerificationComments = comments;

      registration.workflowHistory.push({
        stage: 'PAYMENT_REJECTED',
        status: 'COMPLETED',
        timestamp: new Date(),
        performedBy: req.user.id,
        comments: comments || 'Payment verification failed'
      });

      // Send email notification to student
      await emailService.sendRepeatPaymentRejectedNotification(registration, comments);
    }

    await registration.save();
    await registration.populate(['student', 'subject', 'paymentVerifiedBy']);

    res.status(200).json({
      success: true,
      message: `Payment ${action.toLowerCase()}d`,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get registrations ready for exam scheduling
 * @route   GET /api/exam-officer/schedule-pending
 * @access  Private/Exam Officer
 * @scenario Exam Officer sees verified payments ready for exam scheduling
 */
exports.getPendingExamSchedules = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const registrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'PAYMENT_VERIFIED',
      examScheduleStatus: 'NOT_SCHEDULED'
    })
    .populate('student', 'name studentId department email')
    .populate('subject', 'name code')
    .sort({ paymentVerifiedAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Exam Officer allocates exam slot
 * @route   PUT /api/exam-officer/allocate-exam-slot/:id
 * @access  Private/Exam Officer
 * @scenario Exam Officer assigns date, time, and venue for repeat exam
 */
exports.allocateExamSlot = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const { examDate, examTime, venue } = req.body;

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      registrationStatus: 'PAYMENT_VERIFIED',
      examScheduleStatus: 'NOT_SCHEDULED'
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or exam already scheduled'
      });
    }

    // Generate exam code
    const examCode = `REP-${registration.subject.toString().slice(-4).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    registration.registrationStatus = 'EXAM_SCHEDULED';
    registration.examScheduleStatus = 'SCHEDULED';
    registration.allocatedExamSlot = {
      date: new Date(examDate),
      time: examTime,
      venue: venue,
      examCode: examCode
    };

    registration.workflowHistory.push({
      stage: 'EXAM_SCHEDULED',
      status: 'COMPLETED',
      timestamp: new Date(),
      performedBy: req.user.id,
      comments: `Exam scheduled: ${examDate} ${examTime} at ${venue}, Code: ${examCode}`
    });

    await registration.save();
    await registration.populate(['student', 'subject']);

    // Send email notification to student
    await emailService.sendRepeatExamScheduleNotification(registration);

    res.status(200).json({
      success: true,
      message: 'Exam slot allocated successfully. Student notified.',
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get exam schedule overview
 * @route   GET /api/exam-officer/exam-schedule
 * @access  Private/Exam Officer
 * @scenario Exam Officer views all scheduled repeat exams
 */
exports.getExamSchedule = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        'allocatedExamSlot.date': {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const scheduledExams = await RepeatSubjectRegistration.find({
      examScheduleStatus: 'SCHEDULED',
      ...dateFilter
    })
    .populate('student', 'name studentId department')
    .populate('subject', 'name code')
    .sort({ 'allocatedExamSlot.date': 1, 'allocatedExamSlot.time': 1 });

    // Group by date and venue
    const groupedByDate = {};
    scheduledExams.forEach(exam => {
      const dateKey = exam.allocatedExamSlot.date.toISOString().split('T')[0];
      const venue = exam.allocatedExamSlot.venue;

      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {};
      }
      if (!groupedByDate[dateKey][venue]) {
        groupedByDate[dateKey][venue] = [];
      }
      groupedByDate[dateKey][venue].push(exam);
    });

    res.status(200).json({
      success: true,
      count: scheduledExams.length,
      groupedSchedule: groupedByDate,
      data: scheduledExams
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update exam status
 * @route   PUT /api/exam-officer/update-exam-status/:id
 * @access  Private/Exam Officer
 * @scenario Exam Officer updates exam status (completed, cancelled, etc.)
 */
exports.updateExamStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const { status, comments } = req.body; // status: 'COMPLETED', 'CANCELLED', etc.

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      examScheduleStatus: 'SCHEDULED'
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled exam not found'
      });
    }

    registration.examScheduleStatus = status;
    if (status === 'COMPLETED') {
      registration.registrationStatus = 'COMPLETED';
    }

    registration.workflowHistory.push({
      stage: 'EXAM_STATUS_UPDATE',
      status: 'COMPLETED',
      timestamp: new Date(),
      performedBy: req.user.id,
      comments: `Exam status updated to ${status}: ${comments || ''}`
    });

    await registration.save();
    await registration.populate(['student', 'subject']);

    res.status(200).json({
      success: true,
      message: `Exam status updated to ${status}`,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard statistics for Exam Officer
 * @route   GET /api/exam-officer/dashboard-stats
 * @access  Private/Exam Officer
 * @scenario Exam Officer views key metrics on dashboard
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const [
      pendingReviews,
      pendingFeeAllocations,
      pendingPaymentVerifications,
      pendingExamSchedules,
      scheduledExams
    ] = await Promise.all([
      // Pending reviews
      RepeatSubjectRegistration.countDocuments({
        registrationStatus: 'REGISTRAR_APPROVED',
        examOfficerReviewStatus: 'PENDING'
      }),

      // Pending fee allocations
      RepeatSubjectRegistration.countDocuments({
        registrationStatus: 'ADMIN_APPROVED',
        feeAllocationStatus: 'PENDING'
      }),

      // Pending payment verifications
      RepeatSubjectRegistration.countDocuments({
        registrationStatus: 'PAYMENT_SUBMITTED',
        feeStatus: 'PAYMENT_SUBMITTED'
      }),

      // Pending exam schedules
      RepeatSubjectRegistration.countDocuments({
        registrationStatus: 'PAYMENT_VERIFIED',
        examScheduleStatus: 'NOT_SCHEDULED'
      }),

      // Today's scheduled exams
      RepeatSubjectRegistration.find({
        examScheduleStatus: 'SCHEDULED',
        'allocatedExamSlot.date': {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
      .populate('student', 'name studentId')
      .populate('subject', 'code')
      .sort({ 'allocatedExamSlot.time': 1 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        pendingReviews,
        pendingFeeAllocations,
        pendingPaymentVerifications,
        pendingExamSchedules,
        todaysExams: scheduledExams
      }
    });
  } catch (error) {
    next(error);
  }
};
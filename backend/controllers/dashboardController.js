/**
 * FINANCE & EXAM OFFICER DASHBOARD API CONTROLLER
 * Provides endpoints for Finance and Exam Officer dashboards
 */

const RepeatSubjectRegistration = require('../models/RepeatSubjectRegistration');
const User = require('../models/user');
const Subject = require('../models/course');

// ================================
// FINANCE DASHBOARD ENDPOINTS
// ================================

/**
 * @desc    Get finance dashboard data
 * @route   GET /api/repeat-registration/finance/dashboard
 * @access  Private/Bursar
 */
exports.getFinanceDashboard = async (req, res, next) => {
  try {
    const { month } = req.query;

    // Get all approved registrations
    const allRegistrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'ACCEPTED',
      registrarApprovalStatus: 'APPROVED'
    })
      .populate('student', 'name studentId email')
      .populate('subject', 'code name')
      .sort('-createdAt');

    // Separate pending and confirmed payments
    const pendingPayments = allRegistrations.filter(r => r.feeStatus === 'PENDING');
    const confirmedPayments = allRegistrations.filter(r => r.feeStatus === 'PAID');

    // Calculate statistics
    const totalExpected = allRegistrations.length * 2500; // LKR 2,500 per repeat
    const totalReceived = confirmedPayments.length * 2500;
    const pendingAmount = pendingPayments.length * 2500;

    // Calculate overdue (past due date)
    const currentDate = new Date();
    const overduPayments = pendingPayments.filter(p => {
      const fianceRecord = p.invoiceNumber;
      return p.registrarApprovedAt && 
             (new Date(p.registrarApprovedAt).getTime() + 14 * 24 * 60 * 60 * 1000) < currentDate.getTime();
    });
    const overdue = overduPayments.length * 2500;

    // Format response for frontend
    const formattedPendingPayments = pendingPayments.map(p => ({
      _id: p._id,
      studentName: p.studentName,
      studentIndex: p.studentIndex,
      subjectCode: p.subjectCode,
      subjectName: p.subjectName,
      amount: p.repeatFeeAmount,
      dueDate: new Date(p.registrarApprovedAt).getTime() + 14 * 24 * 60 * 60 * 1000, // 14 days from approval
      feeStatus: p.feeStatus
    }));

    const formattedConfirmedPayments = confirmedPayments.map(p => ({
      _id: p._id,
      studentName: p.studentName,
      studentIndex: p.studentIndex,
      subjectCode: p.subjectCode,
      subjectName: p.subjectName,
      amount: p.repeatFeeAmount,
      paymentReference: p.paymentReference,
      paymentReceivedDate: p.paymentReceivedDate,
      feeStatus: p.feeStatus
    }));

    res.json({
      success: true,
      overview: {
        totalExpected,
        totalReceived,
        pendingAmount,
        overdue
      },
      pendingPayments: formattedPendingPayments,
      confirmedPayments: formattedConfirmedPayments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pending payment registrations
 * @route   GET /api/repeat-registration/finance/pending
 * @access  Private/Bursar
 */
exports.getPendingPayments = async (req, res, next) => {
  try {
    const registrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'ACCEPTED',
      registrarApprovalStatus: 'APPROVED',
      feeStatus: 'PENDING'
    })
      .populate('student', 'name studentId email')
      .populate('subject', 'code name')
      .sort('-registrarApprovedAt');

    const formattedData = registrations.map(r => ({
      _id: r._id,
      studentName: r.studentName,
      studentIndex: r.studentIndex,
      studentEmail: r.student.email,
      subjectCode: r.subjectCode,
      subjectName: r.subjectName,
      amount: r.repeatFeeAmount,
      dueDate: new Date(r.registrarApprovedAt).getTime() + 14 * 24 * 60 * 60 * 1000,
      approvedDate: r.registrarApprovedAt
    }));

    res.json({
      success: true,
      count: formattedData.length,
      payments: formattedData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payment history
 * @route   GET /api/repeat-registration/finance/history
 * @access  Private/Bursar
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {
      registrationStatus: 'ACCEPTED',
      feeStatus: 'PAID'
    };

    if (startDate || endDate) {
      query.paymentReceivedDate = {};
      if (startDate) query.paymentReceivedDate.$gte = new Date(startDate);
      if (endDate) query.paymentReceivedDate.$lte = new Date(endDate);
    }

    const registrations = await RepeatSubjectRegistration.find(query)
      .populate('student', 'name studentId email')
      .populate('subject', 'code name')
      .sort('-paymentReceivedDate');

    const formattedData = registrations.map(r => ({
      _id: r._id,
      studentName: r.studentName,
      studentIndex: r.studentIndex,
      subjectCode: r.subjectCode,
      subjectName: r.subjectName,
      amount: r.repeatFeeAmount,
      paymentReference: r.paymentReference,
      paymentReceivedDate: r.paymentReceivedDate,
      paymentProof: r.paymentProof
    }));

    res.json({
      success: true,
      count: formattedData.length,
      history: formattedData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export finance report
 * @route   GET /api/repeat-registration/finance/export
 * @access  Private/Bursar
 */
exports.exportFinanceReport = async (req, res, next) => {
  try {
    const allRegistrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'ACCEPTED'
    }).populate('student', 'name studentId email');

    // Create CSV content
    let csv = 'Student Name,Student Index,Subject Code,Amount,Payment Status,Payment Date,Reference\n';
    
    allRegistrations.forEach(r => {
      csv += `"${r.studentName}","${r.studentIndex}","${r.subjectCode}",${r.repeatFeeAmount},"${r.feeStatus}","${r.paymentReceivedDate || ''}","${r.paymentReference || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=finance_report.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// ================================
// EXAM OFFICER DASHBOARD ENDPOINTS
// ================================

/**
 * @desc    Get exam officer dashboard data
 * @route   GET /api/repeat-registration/exam-officer/dashboard
 * @access  Private/Exam Officer
 */
exports.getExamOfficerDashboard = async (req, res, next) => {
  try {
    // Get registrations ready to schedule (paid but not scheduled)
    const readyToSchedule = await RepeatSubjectRegistration.find({
      registrationStatus: 'ACCEPTED',
      feeStatus: 'PAID',
      examScheduleStatus: 'NOT_SCHEDULED'
    })
      .populate('student', 'name studentId email')
      .populate('subject', 'code name')
      .sort('-paymentReceivedDate');

    // Get scheduled exams
    const scheduledExams = await RepeatSubjectRegistration.find({
      examScheduleStatus: 'SCHEDULED'
    })
      .populate('student', 'name studentId email')
      .populate('subject', 'code name')
      .sort('allocatedExamSlot.date');

    // Calculate statistics
    const allRegistrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'ACCEPTED'
    });

    const statistics = {
      totalExams: allRegistrations.length,
      scheduled: scheduledExams.length,
      pending: readyToSchedule.length,
      venues: 7 // Predefined venues
    };

    // Format data for frontend
    const formattedReadyToSchedule = readyToSchedule.map(r => ({
      _id: r._id,
      studentName: r.studentName,
      studentIndex: r.studentIndex,
      subjectCode: r.subjectCode,
      subjectName: r.subjectName,
      department: r.department,
      credits: r.credits
    }));

    const formattedScheduledExams = scheduledExams.map(r => ({
      _id: r._id,
      studentName: r.studentName,
      studentIndex: r.studentIndex,
      subjectCode: r.subjectCode,
      subjectName: r.subjectName,
      department: r.department,
      allocatedExamSlot: r.allocatedExamSlot,
      examCode: r.allocatedExamSlot?.examCode
    }));

    res.json({
      success: true,
      readyToSchedule: formattedReadyToSchedule,
      scheduledExams: formattedScheduledExams,
      statistics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get exam timetable
 * @route   GET /api/repeat-registration/exam-officer/timetable
 * @access  Private/Exam Officer
 */
exports.getExamTimetable = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { examScheduleStatus: 'SCHEDULED' };

    if (startDate || endDate) {
      query['allocatedExamSlot.date'] = {};
      if (startDate) query['allocatedExamSlot.date'].$gte = new Date(startDate);
      if (endDate) query['allocatedExamSlot.date'].$lte = new Date(endDate);
    }

    const exams = await RepeatSubjectRegistration.find(query)
      .populate('student', 'name studentId email')
      .populate('subject', 'code name credits')
      .sort('allocatedExamSlot.date');

    // Group by date and time
    const timetable = {};
    exams.forEach(exam => {
      if (exam.allocatedExamSlot) {
        const dateKey = new Date(exam.allocatedExamSlot.date).toISOString().split('T')[0];
        if (!timetable[dateKey]) {
          timetable[dateKey] = [];
        }
        timetable[dateKey].push({
          time: exam.allocatedExamSlot.time,
          venue: exam.allocatedExamSlot.venue,
          examCode: exam.allocatedExamSlot.examCode,
          subject: {
            code: exam.subjectCode,
            name: exam.subjectName,
            credits: exam.credits
          },
          student: {
            name: exam.studentName,
            index: exam.studentIndex
          }
        });
      }
    });

    res.json({
      success: true,
      timetable,
      totalExams: exams.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate exam statistics
 * @route   GET /api/repeat-registration/exam-officer/statistics
 * @access  Private/Exam Officer
 */
exports.getExamStatistics = async (req, res, next) => {
  try {
    const registrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'ACCEPTED'
    }).populate('subject', 'code name');

    // Department-wise breakdown
    const byDepartment = {};
    registrations.forEach(r => {
      if (!byDepartment[r.department]) {
        byDepartment[r.department] = 0;
      }
      byDepartment[r.department]++;
    });

    // Subject-wise breakdown
    const bySubject = {};
    registrations.forEach(r => {
      const key = `${r.subjectCode} - ${r.subjectName}`;
      bySubject[key] = (bySubject[key] || 0) + 1;
    });

    // Time-wise distribution (morning/afternoon)
    const scheduledExams = registrations.filter(r => r.examScheduleStatus === 'SCHEDULED');
    const morning = scheduledExams.filter(r => {
      const hour = parseInt(r.allocatedExamSlot?.time?.split(':')[0] || 0);
      return hour < 12;
    }).length;
    const afternoon = scheduledExams.filter(r => {
      const hour = parseInt(r.allocatedExamSlot?.time?.split(':')[0] || 0);
      return hour >= 12;
    }).length;

    res.json({
      success: true,
      statistics: {
        total: registrations.length,
        scheduled: registrations.filter(r => r.examScheduleStatus === 'SCHEDULED').length,
        pending: registrations.filter(r => r.examScheduleStatus === 'NOT_SCHEDULED').length,
        completed: registrations.filter(r => r.examScheduleStatus === 'COMPLETED').length,
        byDepartment,
        bySubject,
        timeDistribution: {
          morning,
          afternoon
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate admission letters
 * @route   GET /api/repeat-registration/exam-officer/admission-letters
 * @access  Private/Exam Officer
 */
exports.generateAdmissionLetters = async (req, res, next) => {
  try {
    const { examDate } = req.query;

    const query = { 
      examScheduleStatus: 'SCHEDULED'
    };

    if (examDate) {
      const date = new Date(examDate);
      query['allocatedExamSlot.date'] = {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      };
    }

    const exams = await RepeatSubjectRegistration.find(query)
      .populate('student', 'name studentId email')
      .populate('subject', 'code name');

    // Format for letter generation
    const letters = exams.map(exam => ({
      studentName: exam.studentName,
      studentIndex: exam.studentIndex,
      subject: {
        code: exam.subjectCode,
        name: exam.subjectName
      },
      examDate: exam.allocatedExamSlot.date,
      examTime: exam.allocatedExamSlot.time,
      venue: exam.allocatedExamSlot.venue,
      examCode: exam.allocatedExamSlot.examCode,
      academicYear: exam.academicYear
    }));

    res.json({
      success: true,
      count: letters.length,
      letters
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update exam completion status
 * @route   PUT /api/repeat-registration/:id/mark-completed
 * @access  Private/Exam Officer
 */
exports.markExamCompleted = async (req, res, next) => {
  try {
    const registration = await RepeatSubjectRegistration.findByIdAndUpdate(
      req.params.id,
      {
        examScheduleStatus: 'COMPLETED',
        updatedBy: req.user.id
      },
      { new: true }
    );

    // Add to workflow history
    registration.workflowHistory.push({
      stage: 'EXAM_COMPLETED',
      status: 'COMPLETED',
      actedBy: req.user.id,
      comments: 'Exam completed successfully'
    });

    await registration.save();

    res.json({
      success: true,
      message: 'Exam marked as completed',
      registration
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
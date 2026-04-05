/**
 * BURSAR DASHBOARD CONTROLLER
 * Handles financial operations for repeat subject registrations
 */

const RepeatSubjectRegistration = require('../models/RepeatSubjectRegistration');
const User = require('../models/user');
const Finance = require('../models/finance');
const Notification = require('../models/notification');

/**
 * @desc    Get pending payment verifications for Bursar
 * @route   GET /api/bursar/pending-payments
 * @access  Private/Bursar
 * @scenario Bursar sees all pending payments that need verification
 */
exports.getPendingPayments = async (req, res, next) => {
  try {
    if (req.user.role !== 'bursar') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Bursar role required.'
      });
    }

    const pendingPayments = await RepeatSubjectRegistration.find({
      feeStatus: { $in: ['PAYMENT_SUBMITTED', 'PENDING'] },
      registrationStatus: { $nin: ['REJECTED', 'COMPLETED'] }
    })
    .populate('student', 'name studentId department email')
    .populate('subject', 'name code')
    .sort({ paymentSubmittedAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingPayments.length,
      data: pendingPayments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark fee as paid (for manual payment processing)
 * @route   PUT /api/bursar/mark-paid/:id
 * @access  Private/Bursar
 * @scenario Bursar manually marks a payment as completed
 */
exports.markFeePaid = async (req, res, next) => {
  try {
    if (req.user.role !== 'bursar') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Bursar role required.'
      });
    }

    const { paymentReference, comments } = req.body;

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      feeStatus: { $in: ['PENDING', 'PAYMENT_SUBMITTED'] }
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or payment already processed'
      });
    }

    registration.feeStatus = 'PAYMENT_VERIFIED';
    registration.paymentReference = paymentReference || registration.paymentReference;
    registration.paymentVerifiedAt = new Date();
    registration.paymentVerifiedBy = req.user.id;
    registration.paymentVerificationComments = comments;

    registration.workflowHistory.push({
      stage: 'PAYMENT_VERIFIED',
      status: 'COMPLETED',
      timestamp: new Date(),
      performedBy: req.user.id,
      comments: `Payment verified by Bursar: ${comments || 'Manual payment confirmation'}`
    });

    await registration.save();
    await registration.populate(['student', 'subject', 'paymentVerifiedBy']);

    // Create finance record
    await Finance.create({
      student: registration.student._id,
      title: `Repeat Exam Fee - ${registration.subject.code}`,
      amount: registration.repeatFeeAmount,
      type: 'repeat_fee',
      status: 'paid',
      reference: registration.invoiceNumber,
      description: `Repeat examination fee for ${registration.subject.name}`,
      processedBy: req.user.id,
      processedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payment history and financial reports
 * @route   GET /api/bursar/payment-history
 * @access  Private/Bursar
 * @scenario Bursar views payment history and generates reports
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    if (req.user.role !== 'bursar') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Bursar role required.'
      });
    }

    const { startDate, endDate, status } = req.query;

    let filter = {};
    if (startDate && endDate) {
      filter.paymentVerifiedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (status) {
      filter.feeStatus = status;
    }

    const payments = await RepeatSubjectRegistration.find({
      ...filter,
      feeStatus: { $in: ['PAYMENT_VERIFIED', 'PAID'] }
    })
    .populate('student', 'name studentId department')
    .populate('subject', 'name code')
    .populate('paymentVerifiedBy', 'name')
    .sort({ paymentVerifiedAt: -1 });

    // Calculate summary statistics
    const totalAmount = payments.reduce((sum, payment) => sum + payment.repeatFeeAmount, 0);
    const paymentCount = payments.length;

    res.status(200).json({
      success: true,
      count: payments.length,
      summary: {
        totalAmount,
        paymentCount,
        averageAmount: paymentCount > 0 ? totalAmount / paymentCount : 0
      },
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate financial reports
 * @route   GET /api/bursar/financial-reports
 * @access  Private/Bursar
 * @scenario Bursar generates comprehensive financial reports
 */
exports.getFinancialReports = async (req, res, next) => {
  try {
    if (req.user.role !== 'bursar') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Bursar role required.'
      });
    }

    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all payments in the period
    const payments = await RepeatSubjectRegistration.find({
      paymentVerifiedAt: { $gte: startDate },
      feeStatus: 'PAYMENT_VERIFIED'
    })
    .populate('student', 'name studentId department')
    .populate('subject', 'name code department')
    .sort({ paymentVerifiedAt: -1 });

    // Generate department-wise breakdown
    const departmentBreakdown = {};
    payments.forEach(payment => {
      const dept = payment.student.department || 'Unknown';
      if (!departmentBreakdown[dept]) {
        departmentBreakdown[dept] = {
          count: 0,
          totalAmount: 0,
          subjects: {}
        };
      }
      departmentBreakdown[dept].count++;
      departmentBreakdown[dept].totalAmount += payment.repeatFeeAmount;

      const subject = payment.subject.code;
      if (!departmentBreakdown[dept].subjects[subject]) {
        departmentBreakdown[dept].subjects[subject] = { count: 0, amount: 0 };
      }
      departmentBreakdown[dept].subjects[subject].count++;
      departmentBreakdown[dept].subjects[subject].amount += payment.repeatFeeAmount;
    });

    // Calculate totals
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.repeatFeeAmount, 0);
    const totalTransactions = payments.length;

    res.status(200).json({
      success: true,
      period: {
        startDate,
        endDate: now,
        type: period
      },
      summary: {
        totalRevenue,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      },
      departmentBreakdown,
      recentPayments: payments.slice(0, 10) // Last 10 payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard statistics for Bursar
 * @route   GET /api/bursar/dashboard-stats
 * @access  Private/Bursar
 * @scenario Bursar views key financial metrics on dashboard
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'bursar') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Bursar role required.'
      });
    }

    // Current month payments
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      pendingPayments,
      monthlyPayments,
      totalRevenue,
      recentPayments
    ] = await Promise.all([
      // Pending payment verifications
      RepeatSubjectRegistration.countDocuments({
        feeStatus: 'PAYMENT_SUBMITTED',
        registrationStatus: { $nin: ['REJECTED', 'COMPLETED'] }
      }),

      // This month's payments
      RepeatSubjectRegistration.find({
        paymentVerifiedAt: { $gte: startOfMonth },
        feeStatus: 'PAYMENT_VERIFIED'
      }),

      // Total revenue this year
      RepeatSubjectRegistration.aggregate([
        {
          $match: {
            paymentVerifiedAt: { $gte: new Date(now.getFullYear(), 0, 1) },
            feeStatus: 'PAYMENT_VERIFIED'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$repeatFeeAmount' }
          }
        }
      ]),

      // Recent payments (last 5)
      RepeatSubjectRegistration.find({
        feeStatus: 'PAYMENT_VERIFIED'
      })
      .populate('student', 'name studentId')
      .populate('subject', 'code')
      .sort({ paymentVerifiedAt: -1 })
      .limit(5)
    ]);

    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.repeatFeeAmount, 0);
    const monthlyCount = monthlyPayments.length;
    const yearlyRevenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        pendingVerifications: pendingPayments,
        monthlyRevenue,
        monthlyTransactionCount: monthlyCount,
        yearlyRevenue,
        recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
};
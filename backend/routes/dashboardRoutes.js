/**
 * DASHBOARD ROUTES
 * Finance and Exam Officer dashboard endpoints
 */

const express = require('express');
const router = express.Router();
const {
  getFinanceDashboard,
  getPendingPayments,
  getPaymentHistory,
  exportFinanceReport,
  getExamOfficerDashboard,
  getExamTimetable,
  getExamStatistics,
  generateAdmissionLetters,
  markExamCompleted
} = require('../controllers/dashboardController');

const { protect, authorize } = require('../middleware/auth');

// ================================
// FINANCE DASHBOARD ROUTES
// ================================

/**
 * @route   GET /api/dashboard/finance
 * @desc    Get finance dashboard overview
 * @access  Private - Bursar/Admin
 */
router.get('/finance', protect, authorize('bursar', 'admin'), getFinanceDashboard);

/**
 * @route   GET /api/dashboard/finance/pending
 * @desc    Get pending payment registrations
 * @access  Private - Bursar/Admin
 */
router.get('/finance/pending', protect, authorize('bursar', 'admin'), getPendingPayments);

/**
 * @route   GET /api/dashboard/finance/history
 * @desc    Get payment history
 * @access  Private - Bursar/Admin
 */
router.get('/finance/history', protect, authorize('bursar', 'admin'), getPaymentHistory);

/**
 * @route   GET /api/dashboard/finance/export
 * @desc    Export finance report as CSV
 * @access  Private - Bursar/Admin
 */
router.get('/finance/export', protect, authorize('bursar', 'admin'), exportFinanceReport);

// ================================
// EXAM OFFICER DASHBOARD ROUTES
// ================================

/**
 * @route   GET /api/dashboard/exam-officer
 * @desc    Get exam officer dashboard overview
 * @access  Private - Exam Officer/Admin
 */
router.get('/exam-officer', protect, authorize('exam_officer', 'admin'), getExamOfficerDashboard);

/**
 * @route   GET /api/dashboard/exam-officer/timetable
 * @desc    Get exam timetable
 * @access  Private - Exam Officer/Admin
 */
router.get('/exam-officer/timetable', protect, authorize('exam_officer', 'admin'), getExamTimetable);

/**
 * @route   GET /api/dashboard/exam-officer/statistics
 * @desc    Get exam statistics
 * @access  Private - Exam Officer/Admin
 */
router.get('/exam-officer/statistics', protect, authorize('exam_officer', 'admin'), getExamStatistics);

/**
 * @route   GET /api/dashboard/exam-officer/admission-letters
 * @desc    Generate admission letters
 * @access  Private - Exam Officer/Admin
 */
router.get('/exam-officer/admission-letters', protect, authorize('exam_officer', 'admin'), generateAdmissionLetters);

/**
 * @route   PUT /api/dashboard/exam/:id/completed
 * @desc    Mark exam as completed
 * @access  Private - Exam Officer/Admin
 */
router.put('/exam/:id/completed', protect, authorize('exam_officer', 'admin'), markExamCompleted);

module.exports = router;

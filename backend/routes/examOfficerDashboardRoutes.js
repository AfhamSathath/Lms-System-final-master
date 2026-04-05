/**
 * EXAM OFFICER DASHBOARD ROUTES
 * Routes for exam scheduling and fee management
 */

const express = require('express');
const router = express.Router();
const {
  getPendingExamAllocations,
  reviewApplication,
  getPendingFeeAllocations,
  allocateRepeatFees,
  getPendingPaymentVerifications,
  verifyPayment,
  getPendingExamSchedules,
  allocateExamSlot,
  getExamSchedule,
  updateExamStatus,
  getDashboardStats
} = require('../controllers/examOfficerDashboardController');

const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and exam_officer role
router.use(protect);
router.use(authorize('exam_officer'));

// Dashboard statistics
router.get('/dashboard-stats', getDashboardStats);

// Pending reviews (Registrar approved -> Exam Officer review)
router.get('/pending-reviews', getPendingExamAllocations);
router.put('/review/:id', reviewApplication);

// Fee allocation (Admin approved -> Fee allocation)
router.get('/fee-pending', getPendingFeeAllocations);
router.put('/allocate-fees/:id', allocateRepeatFees);

// Payment verification (Student submitted payment proof)
router.get('/payment-pending', getPendingPaymentVerifications);
router.put('/verify-payment/:id', verifyPayment);

// Exam scheduling (Payment verified -> Schedule exam)
router.get('/schedule-pending', getPendingExamSchedules);
router.put('/allocate-exam-slot/:id', allocateExamSlot);

// Exam schedule management
router.get('/exam-schedule', getExamSchedule);
router.put('/update-exam-status/:id', updateExamStatus);

module.exports = router;
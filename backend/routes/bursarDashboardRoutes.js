/**
 * BURSAR DASHBOARD ROUTES
 * Routes for bursar payment management
 */

const express = require('express');
const router = express.Router();
const {
  getPendingPayments,
  markFeePaid,
  getPaymentHistory,
  getFinancialReports,
  getDashboardStats
} = require('../controllers/bursarDashboardController');

const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and bursar role
router.use(protect);
router.use(authorize('bursar'));

// Dashboard statistics
router.get('/dashboard-stats', getDashboardStats);

// Payment management
router.get('/pending-payments', getPendingPayments);
router.put('/mark-paid/:id', markFeePaid);

// Payment history and reports
router.get('/payment-history', getPaymentHistory);
router.get('/financial-reports', getFinancialReports);

module.exports = router;
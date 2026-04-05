const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllFinances,
  getMyFinances,
  createFinance,
  recordPayment,
  bulkCreateFinance,
  submitPaymentSlip
} = require('../controllers/financeController');
const { uploadPaymentProof } = require('../middleware/upload');

router.use(protect);

router.get('/my', authorize('student'), getMyFinances);
router.get('/', authorize('admin', 'registrar'), getAllFinances);
router.post('/', authorize('admin', 'registrar'), createFinance);
router.post('/bulk-create', authorize('admin', 'registrar'), bulkCreateFinance);
router.put('/:id/pay', authorize('admin', 'registrar', 'student'), recordPayment);
router.put('/:id/submit-slip', authorize('student'), uploadPaymentProof, submitPaymentSlip);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllFinances,
  getMyFinances,
  createFinance,
  recordPayment,
  bulkCreateFinance
} = require('../controllers/financeController');

router.use(protect);

router.get('/my', authorize('student'), getMyFinances);
router.get('/', authorize('admin', 'registrar'), getAllFinances);
router.post('/', authorize('admin', 'registrar'), createFinance);
router.post('/bulk-create', authorize('admin', 'registrar'), bulkCreateFinance);
router.put('/:id/pay', authorize('admin', 'registrar', 'student'), recordPayment);

module.exports = router;

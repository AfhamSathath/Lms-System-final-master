const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getHalls,
  createHall,
  updateHall,
  deleteHall
} = require('../controllers/hallController');

router.use(protect);

router.get('/', getHalls);
router.post('/', authorize('admin', 'registrar'), createHall);
router.put('/:id', authorize('admin', 'registrar'), updateHall);
router.delete('/:id', authorize('admin', 'registrar'), deleteHall);

module.exports = router;

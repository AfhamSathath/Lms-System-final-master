const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  registerRepeat,
  getRepeats,
  getMyRepeats,
  updateApprovalStatus
} = require('../controllers/repeatExamController');

router.use(protect);

router.post('/register', authorize('student'), registerRepeat);
router.get('/my', authorize('student'), getMyRepeats);
router.get('/', authorize('admin', 'hod'), getRepeats);
router.put('/:id/approve', authorize('admin', 'hod'), updateApprovalStatus);

module.exports = router;

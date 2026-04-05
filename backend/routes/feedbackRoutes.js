const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  submitFeedback,
  getCourseFeedback,
  getMyFeedbackHistory
} = require('../controllers/feedbackController');

router.use(protect);

router.get('/my', authorize('student'), getMyFeedbackHistory);
router.post('/', authorize('student'), submitFeedback);
router.get('/course/:id', authorize('admin', 'hod', 'lecturer'), getCourseFeedback);

module.exports = router;

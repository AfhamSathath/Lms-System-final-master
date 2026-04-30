const express = require('express');
const router = express.Router();
const { 
  submitPaper, 
  moderatePaper, 
  sendToHod, 
  hodReview, 
  examOfficerAccept,
  getPapersForReview, 
  getMyPapers 
} = require('../controllers/examPaperController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('lecturer', 'hod'), submitPaper);
router.get('/my-papers', authorize('lecturer', 'hod'), getMyPapers);
router.get('/review-list', authorize('lecturer', 'hod', 'exam_officer'), getPapersForReview);

router.put('/:id/moderate', authorize('lecturer', 'hod'), moderatePaper);
router.put('/:id/send-to-hod', authorize('lecturer', 'hod'), sendToHod);
router.put('/:id/hod-review', authorize('hod', 'admin'), hodReview);
router.put('/:id/exam-officer-accept', authorize('exam_officer'), examOfficerAccept);

module.exports = router;

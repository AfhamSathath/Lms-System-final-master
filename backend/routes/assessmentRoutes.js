const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createAssessment,
  getAssessmentsBySubject,
  updateMarks,
  submitToHOD,
  getPendingAssessments,
  approveAssessment,
  updateAssessment,
  deleteAssessment
} = require('../controllers/assessmentController');

router.use(protect);

// HOD Routes
router.get('/hod/pending', authorize('hod', 'admin'), getPendingAssessments);
router.put('/:id/approve', authorize('hod', 'admin'), approveAssessment);

// General Routes
router.post('/', authorize('lecturer', 'admin'), createAssessment);
router.get('/course/:subjectId', authorize('lecturer', 'student', 'hod', 'admin'), getAssessmentsBySubject);
router.put('/:id/marks', authorize('lecturer', 'admin'), updateMarks);
router.put('/:id', authorize('lecturer', 'admin'), updateAssessment);
router.delete('/:id', authorize('lecturer', 'admin'), deleteAssessment);
router.put('/:id/submit-hod', authorize('lecturer', 'admin'), submitToHOD);

module.exports = router;

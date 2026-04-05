const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadPaymentProof } = require('../middleware/upload');
const {
  // Student Routes
  getEligibleSubjectsForRepeat,
  createRepeatRegistration,
  submitRepeatRegistration,
  getMyRepeatRegistrations,
  submitPaymentProof,

  // Lecturer Routes
  getPendingLecturerReviews,
  lecturerReviewApplication,

  // HOD Routes
  getPendingHODReviews,
  hodReviewApplication,

  // Exam Officer Routes
  getPendingExamOfficerReviews,
  examOfficerReviewApplication,
  getPendingPaymentVerifications,
  verifyPayment,

  // Bursar/Finance Routes
  getPendingBursarReviews,
  bursarAllocateFees,

  // General Routes
  getRepeatRegistrationById
} = require('../controllers/repeatSubjectRegistrationController');

router.use(protect);

// ===== STUDENT ROUTES =====
router.get('/eligible-subjects', authorize('student'), getEligibleSubjectsForRepeat);
router.post('/', authorize('student'), createRepeatRegistration);
router.put('/:id/submit', authorize('student'), submitRepeatRegistration);
router.put('/:id/submit-payment', authorize('student'), uploadPaymentProof, submitPaymentProof);
router.get('/my-registrations', authorize('student'), getMyRepeatRegistrations);

// ===== LECTURER ROUTES =====
router.get('/lecturer/pending', authorize('lecturer'), getPendingLecturerReviews);
router.put('/:id/lecturer-review', authorize('lecturer'), lecturerReviewApplication);

// ===== HOD ROUTES =====
router.get('/hod/pending', authorize('hod'), getPendingHODReviews);
router.put('/:id/hod-review', authorize('hod'), hodReviewApplication);

// ===== EXAM OFFICER ROUTES =====
router.get('/exam-officer/pending', authorize('exam_officer'), getPendingExamOfficerReviews);
router.put('/:id/exam-officer-review', authorize('exam_officer'), examOfficerReviewApplication);
router.get('/exam-officer/payment-pending', authorize('exam_officer'), getPendingPaymentVerifications);
router.put('/:id/verify-payment', authorize('exam_officer'), verifyPayment);

// ===== BURSAR ROUTES =====
router.get('/bursar/pending', authorize('bursar'), getPendingBursarReviews);
router.put('/:id/bursar-allocate-fees', authorize('bursar'), bursarAllocateFees);

// ===== GENERAL ROUTES =====
router.get('/:id', getRepeatRegistrationById);

module.exports = router;


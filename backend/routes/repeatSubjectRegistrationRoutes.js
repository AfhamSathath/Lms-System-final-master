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

  // HOD Routes
  getPendingHODReviews,
  hodReviewApplication,

  // Registrar Routes
  getPendingRegistrarApprovals,
  registrarApproveApplication,

  // Exam Officer Routes
  getPendingExamOfficerReviews,
  examOfficerReviewApplication,
  getPendingFeeAllocations,
  allocateRepeatFees,
  getPendingPaymentVerifications,
  verifyPayment,
  getPendingExamSchedules,
  allocateExamSlot,

  // Admin Routes
  getPendingAdminApprovals,
  adminApproveApplication,
  getAllRepeatRegistrations,

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

// ===== HOD ROUTES =====
router.get('/hod/pending', authorize('hod'), getPendingHODReviews);
router.put('/:id/hod-review', authorize('hod'), hodReviewApplication);

// ===== REGISTRAR ROUTES =====
router.get('/registrar/pending', authorize('registrar'), getPendingRegistrarApprovals);
router.put('/:id/registrar-approve', authorize('registrar'), registrarApproveApplication);

// ===== EXAM OFFICER ROUTES =====
router.get('/exam-officer/pending', authorize('exam_officer'), getPendingExamOfficerReviews);
router.put('/:id/exam-officer-review', authorize('exam_officer'), examOfficerReviewApplication);
router.get('/exam-officer/fee-pending', authorize('exam_officer'), getPendingFeeAllocations);
router.put('/:id/allocate-fees', authorize('exam_officer'), allocateRepeatFees);
router.get('/exam-officer/payment-pending', authorize('exam_officer'), getPendingPaymentVerifications);
router.put('/:id/verify-payment', authorize('exam_officer'), verifyPayment);
router.get('/exam-officer/schedule-pending', authorize('exam_officer'), getPendingExamSchedules);
router.put('/:id/allocate-exam-slot', authorize('exam_officer'), allocateExamSlot);

// ===== ADMIN ROUTES =====
router.get('/admin/pending', authorize('admin'), getPendingAdminApprovals);
router.put('/:id/admin-approve', authorize('admin'), adminApproveApplication);
router.get('/admin/all', authorize('admin'), getAllRepeatRegistrations);

// ===== GENERAL ROUTES =====
router.get('/:id', getRepeatRegistrationById);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateEnrollment } = require('../middleware/validation');
const {
  getEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  bulkEnrollStudents,
  updateGrades,
  updateAttendance,
  bulkUpdateAttendance,
  enrollBatchStudents,
  getStudentEnrollments,
  getCourseEnrollments,
  withdrawStudent,
  registerCourse,
  generateGradeSheet,
  certifyResult,
  confirmStudentAttendance,
  reviewAttendanceByHOD,
  publishAttendanceByHOD,
  getAttendanceDetails
} = require('../controllers/enrollmentController');

// All routes require authentication
router.use(protect);

/* =====================================
   IMPORTANT: Specific routes FIRST
===================================== */

// Student enrollments
router.get('/student/:studentId', getStudentEnrollments);

// Course enrollments
router.get('/course/:courseId', getCourseEnrollments);

// Course grade sheet
router.get(
  '/course/:courseId/grade-sheet',
  authorize('lecturer', 'hod', 'admin'),
  generateGradeSheet
);

// Bulk Update Course Attendance
router.put(
  '/course/:courseId/bulk-attendance',
  authorize('lecturer', 'hod', 'admin'),
  bulkUpdateAttendance
);

// Get all enrollments
router.get('/', getEnrollments);

// Get single enrollment (KEEP LAST)
router.get('/:id', getEnrollment);

/* =====================================
   Protected routes
===================================== */

// Create enrollment
router.post(
  '/',
  authorize('admin', 'registrar', 'hod', 'lecturer'),
  validateEnrollment,
  createEnrollment
);

// Bulk enroll
router.post(
  '/bulk',
  authorize('admin', 'registrar'),
  bulkEnrollStudents
);

// Enroll by batch
router.post(
  '/enroll-batch',
  authorize('admin', 'hod', 'lecturer'),
  enrollBatchStudents
);

// Self registration
router.post(
  '/register',
  authorize('student', 'admin'),
  registerCourse
);

// Update enrollment
router.put(
  '/:id',
  authorize('admin', 'registrar', 'lecturer'),
  updateEnrollment
);

// Update grades
router.put(
  '/:id/grades',
  authorize('lecturer', 'hod', 'admin'),
  updateGrades
);

// Update attendance
router.put(
  '/:id/attendance',
  authorize('lecturer', 'hod', 'admin'),
  updateAttendance
);

// Withdraw student
router.put(
  '/:id/withdraw',
  authorize('student', 'admin', 'registrar'),
  withdrawStudent
);

// Delete enrollment
router.delete(
  '/:id',
  authorize('admin', 'lecturer'),
  deleteEnrollment
);

// Certify Result
router.put(
  '/:id/certify',
  authorize('exam_officer', 'admin'),
  certifyResult
);

// Student confirms attendance
router.put(
  '/:id/confirm-attendance',
  authorize('student'),
  confirmStudentAttendance
);

// HOD reviews attendance
router.put(
  '/:id/review-attendance',
  authorize('hod', 'admin'),
  reviewAttendanceByHOD
);

// HOD publishes attendance
router.put(
  '/:id/publish-attendance',
  authorize('hod', 'admin'),
  publishAttendanceByHOD
);

// Get detailed attendance information
router.get(
  '/:id/attendance-details',
  authorize('student', 'lecturer', 'hod', 'admin', 'dean'),
  getAttendanceDetails
);

module.exports = router;
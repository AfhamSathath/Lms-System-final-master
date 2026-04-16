const express = require('express');
const router = express.Router();
const {
  assignLecturerToSubject,
  getLecturerSubjects,
  getDepartmentAssignments,
  updateAssignmentProgress,
  updateAssignmentStatus,
  verifyQualification,
  getAllAssignments,
  updateAssignment,
  deleteAssignment,
  bulkDeleteAssignments
} = require('../controllers/lecturerAssignmentController');
const { protect, authorize } = require('../middleware/auth');

/* =====================================================
   Lecturer Assignment Routes
===================================================== */

// Admin: Assign lecturer to subject
router.post('/assign', protect, authorize('admin', 'hod', 'registrar'), (req, res, next) => {
  console.log('Post to /assign reached');
  next();
}, assignLecturerToSubject);

// Get all assignments
router.get('/all', protect, authorize('admin', 'hod', 'dean', 'registrar'), getAllAssignments);

// Get lecturer's assigned subjects
router.get('/lecturer/:lecturerId', protect, getLecturerSubjects);

// Get department assignments
router.get('/department/:departmentId', protect, authorize('admin', 'hod', 'registrar'), getDepartmentAssignments);

// Update assignment progress
router.put('/:assignmentId/progress', protect, updateAssignmentProgress);

// Update assignment status
router.put('/:assignmentId/status', protect, authorize('admin', 'hod', 'registrar'), updateAssignmentStatus);

// Verify lecturer qualification
router.put('/:assignmentId/qualification', protect, authorize('admin', 'registrar'), verifyQualification);

// Update assignment details
router.put('/:assignmentId', protect, authorize('admin', 'hod', 'dean', 'registrar'), updateAssignment);

// Delete assignment
router.delete('/bulk', protect, authorize('admin', 'hod', 'dean', 'registrar'), bulkDeleteAssignments);
router.delete('/:assignmentId', protect, authorize('admin', 'hod', 'dean', 'registrar'), deleteAssignment);

module.exports = router;

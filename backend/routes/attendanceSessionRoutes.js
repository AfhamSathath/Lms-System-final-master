const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createSession,
  getSessionsBySubject,
  updateAttendanceRecords,
  deleteSession,
  submitToHOD,
  getPendingSessions,
  approveSession,
  updateSession
} = require('../controllers/attendanceSessionController');

router.use(protect);

// HOD Routes
router.get('/hod/pending', authorize('hod', 'admin'), getPendingSessions);
router.put('/:id/approve', authorize('hod', 'admin'), approveSession);

// General Routes
router.post('/', authorize('lecturer', 'admin'), createSession);
router.get('/course/:subjectId', authorize('lecturer', 'hod', 'admin'), getSessionsBySubject);
router.put('/:id/records', authorize('lecturer', 'admin'), updateAttendanceRecords);
router.put('/:id', authorize('lecturer', 'admin'), updateSession);
router.delete('/:id', authorize('lecturer', 'admin'), deleteSession);
router.put('/:id/submit-hod', authorize('lecturer', 'admin'), submitToHOD);

module.exports = router;

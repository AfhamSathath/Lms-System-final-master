const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const courseController = require('../controllers/courseController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsByYearAndSemester,
  getSubjectsByYear,
  getSubjectsByDepartment,
  getSubjectsByCategory,
  assignLecturer,
  getSubjectStatsByYear,
  seedSubjects,
  getSubjectsByLecturer,
  bulkCreateSubjects,
  bulkUploadSubjects
} = courseController;

// All routes require authentication
router.use(protect);

// Public routes (authenticated users)
router.get('/', getSubjects);
router.get('/stats/by-year', authorize('admin', 'hod', 'dean', 'registrar'), getSubjectStatsByYear);
router.get('/year/:year', getSubjectsByYear);
router.get('/year/:year/semester/:semester', getSubjectsByYearAndSemester);
router.get('/department/:department', getSubjectsByDepartment);
router.get('/category/:category', getSubjectsByCategory);
router.get('/lecturer/:lecturerId', authorize('admin', 'lecturer', 'hod', 'dean'), getSubjectsByLecturer);
router.get('/:id', getSubject);

// Lecturer assignment
router.put('/:id/assign-lecturer', authorize('admin', 'hod', 'dean', 'registrar'), assignLecturer);

// Admin, HOD, Dean, Registrar routes
router.post('/', authorize('admin', 'hod', 'dean', 'registrar'), createSubject);
router.post('/bulk', authorize('admin', 'hod', 'dean', 'registrar'), bulkCreateSubjects);
router.post('/bulk-upload', authorize('admin', 'hod', 'dean', 'registrar'), upload.single('file'), bulkUploadSubjects);
router.post('/seed', authorize('admin', 'hod', 'dean', 'registrar'), seedSubjects);
router.put('/:id', authorize('admin', 'hod', 'dean', 'registrar'), updateSubject);
router.delete('/:id', authorize('admin', 'hod', 'dean', 'registrar'), deleteSubject);

module.exports = router;
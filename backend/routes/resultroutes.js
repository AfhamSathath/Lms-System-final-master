const express = require('express');
const router = express.Router();
const multer = require('multer');

const { protect, authorize } = require('../middleware/auth');
const resultController = require('../controllers/resultController');

const {
  getResults,
  getStudentResults,
  createResult,
  updateResult,
  deleteResult,
  getResultsByYearAndSemester,
  getResultsByYear,
  getTranscript,
  getDepartmentStats,
  getYearlyStats,
  bulkUploadResults,
  bulkDeleteResults,
  bulkCreateResults,
  getResult,
} = resultController;

// ================= MULTER SETUP =================
// Store file in memory (best for Excel processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ================= APPLY AUTH PROTECTION =================
router.use(protect);

// ================= STUDENT ROUTES =================
// note: use studentId parameter so controller can pick it up consistently
router.get('/student/:studentId', protect, getStudentResults);
router.get('/transcript/:studentId', getTranscript);

// ================= PDF DOWNLOAD ROUTE =================
router.get('/download/:fileName', protect, resultController.downloadResultPDF);

// ================= ADMIN STATISTICS ROUTES =================
router.get('/department/stats', authorize('admin'), getDepartmentStats);
router.get('/yearly/stats', authorize('admin'), getYearlyStats);

// ================= ADMIN / LECTURER / HOD ROUTES =================
router.get('/', authorize('admin', 'lecturer', 'hod'), getResults);
router.get('/year/:year', authorize('admin', 'lecturer', 'hod'), getResultsByYear);
router.get(
  '/year/:year/semester/:semester',
  authorize('admin', 'lecturer', 'hod'),
  getResultsByYearAndSemester
);

// ================= ADMIN ONLY ROUTES =================
router.post('/', authorize('admin'), createResult);

// 🔥 BULK UPLOAD ROUTE (FIXED)
router.post(
  '/bulk-upload',
  authorize('admin'),
  upload.single('file'), // MUST match frontend FormData key
  bulkUploadResults
);

router.post('/bulk', authorize('admin'), bulkCreateResults);
router.get('/:id', getResult);
router.put('/:id', authorize('admin'), updateResult);
router.delete('/bulk', authorize('admin'), bulkDeleteResults);
router.delete('/:id', authorize('admin'), deleteResult);

module.exports = router;
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { protect, authorize } = require('../middleware/auth');
const {
  submitMedical,
  getMedicalFormsByStudent,
  getMedicalsForHOD,
  reviewMedicalByHOD,
  getMedicalsForAdmin,
  reviewMedicalByAdmin,
} = require('../controllers/medicalController');

// Ensure directory exists
const uploadDir = path.join(__dirname, '../uploads/medicals');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer for PDF upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `medical_${Date.now()}_${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for Medical Certificates'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Student routes
router.post('/submit', protect, authorize('student'), upload.single('medicalPdf'), submitMedical);
router.get('/my-applications', protect, authorize('student'), getMedicalFormsByStudent);

// HOD routes
router.get('/hod/pending', protect, authorize('hod'), getMedicalsForHOD);
router.put('/hod/review/:id', protect, authorize('hod'), reviewMedicalByHOD);

// Admin routes
router.get('/admin/pending', protect, authorize('admin'), getMedicalsForAdmin);
router.put('/admin/review/:id', protect, authorize('admin'), reviewMedicalByAdmin);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const mahapolaController = require('../controllers/mahapolaController');

router.post('/submit', protect, authorize('student'), mahapolaController.submitApplication);
router.get('/me', protect, authorize('student'), mahapolaController.getMyApplications);
router.get('/', protect, authorize('bursar', 'admin'), mahapolaController.getApplications);
router.put('/:id/process', protect, authorize('bursar', 'admin'), mahapolaController.processApplication);
router.post('/process-all', protect, authorize('bursar', 'admin'), mahapolaController.processAllPending);

module.exports = router;

const express = require('express');
const router = express.Router();
const { 
  assignModerator, 
  getDepartmentAssignments, 
  getMyAssignments 
} = require('../controllers/moderatorAssignmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('hod', 'admin'), assignModerator);
router.get('/department', authorize('hod', 'admin'), getDepartmentAssignments);
router.get('/my-assignments', authorize('lecturer', 'hod'), getMyAssignments);

module.exports = router;

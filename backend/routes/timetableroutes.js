const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

// Middleware for authentication (assuming you have one)
const { protect } = require('../middleware/auth');

// CRUD routes
router.route('/')
  .get(protect, timetableController.getAllTimetables)
  .post(protect, timetableController.createTimetable);

// Named routes MUST come before /:id to avoid 'upcoming' being cast as ObjectId
router.get('/upcoming', protect, timetableController.getUpcomingTimetables);
router.post('/bulk', protect, timetableController.bulkCreateTimetables);
router.post('/generate', protect, timetableController.generateTimetable);
router.put('/bulk-status', protect, timetableController.bulkUpdateTimetableStatus);

router.route('/:id')
  .get(protect, timetableController.getTimetable)
  .put(protect, timetableController.updateTimetable)
  .delete(protect, timetableController.deleteTimetable);

router.put('/:id/supervisor', protect, timetableController.assignSupervisor);

module.exports = router;
const Timetable = require('../models/timetable');
const Subject = require('../models/course');


// @desc    Get upcoming timetables (date >= today)
// @route   GET /api/timetables/upcoming
// @access  Private
exports.getUpcomingTimetables = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const timetables = await Timetable.find({ date: { $gte: today } })
      .populate('subject', 'name code year semester')
      .populate('supervisors', 'name email')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: timetables.length,
      timetables
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all timetables
// @route   GET /api/timetables
// @access  Private
exports.getAllTimetables = async (req, res, next) => {
  try {
    const timetables = await Timetable.find()
      .populate('subject', 'name code year semester')
      .populate('supervisors', 'name email')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: timetables.length,
      timetables
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single timetable
// @route   GET /api/timetables/:id
// @access  Private
exports.getTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('subject', 'name code year semester')
      .populate('supervisors', 'name email');

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    res.json({ success: true, timetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a timetable entry
// @route   POST /api/timetables
// @access  Private
exports.createTimetable = async (req, res, next) => {
  try {
    const { subject, examType, department, date, startTime, endTime, venue } = req.body;

    if (!subject || !department || !date || !startTime || !endTime || !venue) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const timetable = new Timetable({
      subject,
      examType,
      department,
      date,
      startTime,
      endTime,
      venue
    });

    await timetable.save(); // year & semester autofill via pre('save') hook

    const populatedTimetable = await timetable.populate('subject', 'name code year semester');

    res.status(201).json({ success: true, timetable: populatedTimetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a timetable entry
// @route   PUT /api/timetables/:id
// @access  Private
exports.updateTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    const fieldsToUpdate = ['subject', 'examType', 'department', 'date', 'startTime', 'endTime', 'venue', 'status', 'supervisors'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) timetable[field] = req.body[field];
    });

    await timetable.save(); // pre('save') hook will autofill year/semester if subject changed

    const populatedTimetable = await timetable.populate('subject', 'name code year semester');

    res.json({ success: true, timetable: populatedTimetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a timetable entry
// @route   DELETE /api/timetables/:id
// @access  Private
exports.deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    await timetable.deleteOne();

    res.json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    next(error);
  }
};
// @desc    Bulk create timetable entries
// @route   POST /api/timetables/bulk
// @access  Private
exports.bulkCreateTimetables = async (req, res, next) => {
  try {
    const { timetables } = req.body;

    if (!timetables || !Array.isArray(timetables) || timetables.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty timetables array' });
    }

    // Validate entries
    for (const entry of timetables) {
      if (!entry.subject || !entry.department || !entry.date || !entry.startTime || !entry.endTime || !entry.venue) {
        return res.status(400).json({ success: false, message: 'Missing required fields in one or more entries' });
      }
    }

    // Create entries one by one to ensure pre('save') hooks run (for year/semester autofill)
    const createdTimetables = [];
    for (const entry of timetables) {
      const timetable = new Timetable({
        subject: entry.subject,
        examType: entry.examType || 'final',
        department: entry.department,
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        venue: entry.venue
      });
      await timetable.save();
      createdTimetables.push(timetable);
    }

    res.status(201).json({
      success: true,
      count: createdTimetables.length,
      message: ` timetable entries created successfully` 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update timetable status (Workflow)
// @route   PUT /api/timetables/bulk-status
// @access  Private
exports.bulkUpdateTimetableStatus = async (req, res, next) => {
  try {
    const { timetableIds, status } = req.body;
    
    if (!timetableIds || !Array.isArray(timetableIds) || timetableIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No timetables selected' });
    }

    if (!['draft', 'pending_dean', 'pending_hod', 'published'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await Timetable.updateMany(
      { _id: { $in: timetableIds } },
      { $set: { status } }
    );

    res.json({
      success: true,
      message: `Successfully updated ${timetableIds.length} timetables to ${status}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign supervisor to timetable
// @route   PUT /api/timetables/:id/supervisor
// @access  Private (HOD)
exports.assignSupervisor = async (req, res, next) => {
  try {
    const { supervisorIds } = req.body;
    
    // Convert single string back to array if sent sequentially instead of an array
    const supervisorsArray = Array.isArray(supervisorIds) ? supervisorIds : [supervisorIds].filter(Boolean);

    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { supervisors: supervisorsArray },
      { new: true }
    ).populate('subject', 'name code year semester').populate('supervisors', 'name email');

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    res.json({ success: true, timetable });
  } catch (error) {
    next(error);
  }
};


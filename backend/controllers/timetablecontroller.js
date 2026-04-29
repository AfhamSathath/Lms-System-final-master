const Timetable = require('../models/timetable');
const Subject = require('../models/course');
const User = require('../models/user');
const emailService = require('../utils/emailService');


// @desc    Get upcoming timetables (date >= today)
// @route   GET /api/timetables/upcoming
// @access  Private
exports.getUpcomingTimetables = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    let query = { date: { $gte: today } };

    // Role-based filtering
    if (req.user.role === 'student') {
      query.status = 'published';
      if (req.user.department) {
        query.department = req.user.department;
      }
    } else if (req.user.role === 'lecturer') {
      // Lecturers see published for their dept OR ones they supervise
      let lecturerQuery = { status: 'published' };
      if (req.user.department) {
        lecturerQuery.department = req.user.department;
      }
      query.$or = [
        lecturerQuery,
        { supervisors: req.user._id }
      ];
    } else if (req.user.role === 'dean') {
      query.status = { $in: ['pending_dean', 'pending_hod', 'published'] };
      // Deans usually see everything in their faculty. 
      // If we don't have faculty in Timetable, we might need to filter by departments in that faculty.
      // For now, let them see all non-drafts.
    } else if (req.user.role === 'hod') {
      query.status = { $in: ['pending_hod', 'published'] };
      if (req.user.department) {
        query.department = req.user.department;
      }
    }

    const timetables = await Timetable.find(query)
      .populate('subject', 'name code year semester department')
      .populate('supervisors', 'name email department')
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
    let query = {};

    // Role-based filtering for "All" view
    if (req.user.role === 'student') {
      query.status = 'published';
      if (req.user.department) query.department = req.user.department;
    } else if (req.user.role === 'lecturer') {
      let lecturerQuery = { status: 'published' };
      if (req.user.department) lecturerQuery.department = req.user.department;
      query.$or = [
        lecturerQuery,
        { supervisors: req.user._id }
      ];
    } else if (req.user.role === 'dean') {
      query.status = { $in: ['pending_dean', 'pending_hod', 'published'] };
    } else if (req.user.role === 'hod') {
      query.status = { $in: ['pending_hod', 'published'] };
      if (req.user.department) query.department = req.user.department;
    }

    const timetables = await Timetable.find(query)
      .populate('subject', 'name code year semester department')
      .populate('supervisors', 'name email department')
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

    const canUpdate = ['exam_officer', 'registrar', 'admin', 'dean', 'hod'].includes(req.user.role);
    if (!canUpdate) {
      return res.status(403).json({ success: false, message: 'Not authorized to update timetables' });
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

    const canDelete = ['exam_officer', 'registrar', 'admin'].includes(req.user.role);
    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete timetables' });
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

    // Role-based status transition validation
    const role = req.user.role;
    if (status === 'pending_dean' && !['exam_officer', 'registrar', 'admin', 'hod'].includes(role)) {
       return res.status(403).json({ success: false, message: 'Only Exam Officers can send for Dean approval' });
    }
    if (status === 'pending_hod' && !['dean', 'admin'].includes(role)) {
       return res.status(403).json({ success: false, message: 'Only Deans can approve and send to HOD' });
    }
    if (status === 'published' && !['hod', 'admin'].includes(role)) {
       return res.status(403).json({ success: false, message: 'Only HODs can publish timetables' });
    }
    if (status === 'draft' && !['dean', 'exam_officer', 'registrar', 'admin'].includes(role)) {
       return res.status(403).json({ success: false, message: 'Unauthorized to revert to draft' });
    }

    // Perform update
    await Timetable.updateMany(
      { _id: { $in: timetableIds } },
      { $set: { status } }
    );

    // Fetch updated timetables for notification
    const updatedTimetables = await Timetable.find({ _id: { $in: timetableIds } })
      .populate('subject', 'name code department');

    // Trigger Notifications
    try {
      if (status === 'pending_dean') {
        const deans = await User.find({ role: 'dean' });
        for (const t of updatedTimetables) {
          for (const dean of deans) {
            await emailService.sendTimetablePendingDean(dean, t);
          }
        }
      } else if (status === 'pending_hod') {
        // Group by department and notify HODs
        const depts = [...new Set(updatedTimetables.map(t => t.department))];
        for (const dept of depts) {
          const hods = await User.find({ role: 'hod', department: dept });
          const deptTimetables = updatedTimetables.filter(t => t.department === dept);
          for (const t of deptTimetables) {
            for (const hod of hods) {
              await emailService.sendTimetablePendingHOD(hod, t);
            }
          }
        }
      } else if (status === 'published') {
        for (const t of updatedTimetables) {
          const students = await User.find({ role: 'student', department: t.department });
          const recipientEmails = students.map(s => s.email).filter(Boolean);
          if (recipientEmails.length > 0) {
            await emailService.sendTimetablePublished(recipientEmails, t);
          }
        }
      } else if (status === 'draft' || (status === 'pending_dean' && req.user.role === 'hod')) {
        // Rejections
        const examOfficers = await User.find({ role: { $in: ['exam_officer', 'registrar', 'admin'] } });
        for (const t of updatedTimetables) {
          for (const officer of examOfficers) {
            await emailService.sendTimetableRejected(officer, t, req.user.role);
          }
        }
      }
    } catch (emailError) {
      console.error('Email Notification Error:', emailError);
      // Don't fail the request if emails fail
    }

    res.json({
      success: true,
      message: `Successfully updated ${timetableIds.length} timetables to ${status.replace('_', ' ').toUpperCase()}`
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

    // Trigger Notifications for supervisors
    try {
      const supervisors = await User.find({ _id: { $in: supervisorsArray } });
      for (const lecturer of supervisors) {
        await emailService.sendTimetableSupervisorAssignment(lecturer, timetable);
      }
    } catch (emailError) {
      console.error('Supervisor Email Error:', emailError);
    }

    res.json({ success: true, timetable });
  } catch (error) {
    next(error);
  }
};


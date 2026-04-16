const AttendanceSession = require('../models/AttendanceSession');
const Course = require('../models/course');
const User = require('../models/user');
const Notification = require('../models/notification');
const Enrollment = require('../models/Enrollment');

// Helper to sync session data to Enrollment records
const syncSessionToEnrollments = async (session) => {
  if (!session.attendanceRecords || session.attendanceRecords.length === 0) {
    console.log('[sync] No records to sync for session:', session._id);
    return;
  }

  const dateStr = new Date(session.date).toISOString().split('T')[0];
  console.log(`[sync] Starting sync for session ${session._id} on ${dateStr}`);
  
  for (const record of session.attendanceRecords) {
    console.log(`[sync] Processing record for student ${record.student} in subject ${session.subject}`);
    const enrollment = await Enrollment.findOne({
      student: record.student,
      course: session.subject
    });

    if (enrollment) {
      console.log(`[sync] Found enrollment ${enrollment._id}. Syncing...`);
      if (!enrollment.attendance) enrollment.attendance = [];
      
      const existingIndex = enrollment.attendance.findIndex(
        a => a.date && a.date.toISOString().split('T')[0] === dateStr
      );

      const attendanceItem = {
        date: session.date,
        status: record.status,
        startTime: session.startTime,
        lecturerHour: session.lecturerHour,
        markedBy: session.lecturer,
        markedAt: new Date(),
        remarks: record.remarks
      };

      if (existingIndex >= 0) {
        enrollment.attendance[existingIndex] = attendanceItem;
      } else {
        enrollment.attendance.push(attendanceItem);
      }
      
      // Recalculate attendance percentage
      const total = enrollment.attendance.length;
      const present = enrollment.attendance.filter(
        a => a.status === 'present' || a.status === 'late'
      ).length;
      enrollment.attendancePercentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;
      
      await enrollment.save();
      console.log(`[sync] Sync complete for ${record.student}. New %: ${enrollment.attendancePercentage}`);
    } else {
      console.warn(`[sync] FAILED: No enrollment found for student ${record.student} and course ${session.subject}`);
    }
  }
};

// @desc    Create an attendance session
// @route   POST /api/attendance-sessions
// @access  Private (Lecturer)
exports.createSession = async (req, res, next) => {
  try {
    const { subject, date, startTime, lecturerHour, batch } = req.body;

    const session = await AttendanceSession.create({
      subject,
      lecturer: req.user.id,
      date,
      startTime,
      lecturerHour,
      batch
    });

    res.status(201).json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update session details
// @route   PUT /api/attendance-sessions/:id
// @access  Private (Lecturer)
exports.updateSession = async (req, res, next) => {
  try {
    const { date, startTime, lecturerHour, batch } = req.body;
    let session = await AttendanceSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update this session' });
    }

    if (session.status === 'approved_by_hod') {
      return res.status(403).json({ success: false, message: 'Cannot edit session once approved by HOD' });
    }

    session.date = date || session.date;
    session.startTime = startTime || session.startTime;
    session.lecturerHour = lecturerHour || session.lecturerHour;
    session.batch = batch || session.batch;

    await session.save();

    // Sync to Enrollment models
    await syncSessionToEnrollments(session);

    res.json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendance sessions for a subject
// @route   GET /api/attendance-sessions/course/:subjectId
// @access  Private (Lecturer, HOD)
exports.getSessionsBySubject = async (req, res, next) => {
  try {
    const sessions = await AttendanceSession.find({ subject: req.params.subjectId })
      .populate('lecturer', 'name')
      .sort('-date');

    res.json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update attendance records within a session
// @route   PUT /api/attendance-sessions/:id/records
// @access  Private (Lecturer)
exports.updateAttendanceRecords = async (req, res, next) => {
  try {
    const { attendanceRecords } = req.body; // Array of { student, status, remarks }
    const session = await AttendanceSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status === 'approved_by_hod') {
      return res.status(403).json({ success: false, message: 'Cannot modify mathematically locked and approved attendance sessions' });
    }

    session.attendanceRecords = attendanceRecords;
    await session.save();

    // Sync to Enrollment models
    await syncSessionToEnrollments(session);

    res.json({
      success: true,
      message: 'Attendance records updated and synced with enrollments',
      session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete session
// @route   DELETE /api/attendance-sessions/:id
// @access  Private (Lecturer)
exports.deleteSession = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });

    if (session.status === 'approved_by_hod') {
      return res.status(403).json({ success: false, message: 'Cannot delete approved session' });
    }

    await session.deleteOne();
    res.json({ success: true, message: 'Session removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit to HOD
// @route   PUT /api/attendance-sessions/:id/submit-hod
// @access  Private (Lecturer)
exports.submitToHOD = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id).populate('subject');
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });

    if (session.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to submit this session' });
    }

    session.status = 'published_to_hod';
    await session.save();

    // Notify HOD of the department
    const hod = await User.findOne({
      role: 'hod',
      department: session.subject.department
    });

    if (hod) {
      await Notification.create({
        user: hod._id,
        title: 'New Attendance Session for Approval',
        message: `Lecturer ${req.user.name} submitted an attendance session for ${session.subject.name} (${session.subject.code})`,
        type: 'attendance_approval',
        relatedId: session._id
      });
    }

    res.json({
      success: true,
      message: hod ? 'Submitted and HOD notified' : 'Submitted (No HOD found to notify)'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending sessions for HOD
// @route   GET /api/attendance-sessions/hod/pending
// @access  Private (HOD)
exports.getPendingSessions = async (req, res, next) => {
  try {
    const sessions = await AttendanceSession.find({ status: 'published_to_hod' })
      .populate('subject', 'name code')
      .populate('lecturer', 'name');
    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve Session
// @route   PUT /api/attendance-sessions/:id/approve
// @access  Private (HOD)
exports.approveSession = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });

    session.status = 'approved_by_hod';
    await session.save();

    res.json({ success: true, message: 'Approved' });
  } catch (error) {
    next(error);
  }
};

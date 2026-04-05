const RepeatExam = require('../models/RepeatExam');
const Enrollment = require('../models/Enrollment');
const Finance = require('../models/finance');
const Notification = require('../models/notification');
const User = require('../models/user');
const emailService = require('../utils/emailService');
const Course = require('../models/course');

// @desc    Register for a repeat exam (Student)
// @route   POST /api/repeatexams/register
// @access  Private (Student)
exports.registerRepeat = async (req, res, next) => {
  try {
    const { course, previousGrade, academicYear, semester } = req.body;

    // Check if student has an existing failing grade in that subject
    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: course,
      grade: { $in: ['F', 'E', 'D', 'D+', 'C-'] }
    });

    if (!existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Only courses with failing or low grades can be repeated.'
      });
    }

    // Create the repeat record
    const repeatRecord = await RepeatExam.create({
      student: req.user.id,
      course,
      previousGrade,
      academicYear,
      semester
    });

    const courseData = await Course.findById(course);

    // Automatically trigger a finance record (Repeat Fee)
    await Finance.create({
      student: req.user.id || req.user._id,
      title: 'exam_fee',
      description: `Repeat Exam Fee: ${courseData?.name || course}`,
      amount: 100, // Hardcoded for simulation
      dueDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days from now
      semester,
      academicYear,
      createdBy: req.user.id || req.user._id // student themselves can trigger for self-service
    });

    // Notify HOD
    const hod = await User.findOne({ role: 'hod', department: req.user.department });
    if (hod) {
      await Notification.create({
        user: hod._id,
        title: 'New Repeat Registration',
        message: `${req.user.name} has registered for a repeat in ${course}`,
        type: 'repeat_approval',
        sender: req.user.id
      });

      // Send email to HOD
      const courseData = await Course.findById(course);
      emailService.sendRepeatRequestForHOD(hod, req.user, courseData || { courseName: course }).catch(console.error);
    }

    res.status(201).json({
      success: true,
      message: 'Repeat registration submitted. Please settle the repeat fee.',
      repeatRecord
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Approval Status (HOD / Admin)
// @route   PUT /api/repeatexams/:id/approve
// @access  Private (HOD, Admin)
exports.updateApprovalStatus = async (req, res, next) => {
  try {
    const { approvalStatus, rejectionReason } = req.body;
    const repeatRecord = await RepeatExam.findById(req.params.id);

    if (!repeatRecord) {
      return res.status(404).json({ success: false, message: 'Repeat record not found.' });
    }

    repeatRecord.approvalStatus = approvalStatus;
    repeatRecord.rejectionReason = rejectionReason;
    repeatRecord.approvedBy = req.user.id;

    await repeatRecord.save();

    // Notify student
    await Notification.create({
      user: repeatRecord.student,
      title: 'Repeat Request Updated',
      message: `Your repeat exam request for ${repeatRecord.course} has been ${approvalStatus}.`,
      type: 'repeat_approval',
      sender: req.user.id
    });

    // Send email to student
    const student = await User.findById(repeatRecord.student);
    const courseData = await Course.findById(repeatRecord.course);
    if (student) {
      emailService.sendRepeatDecisionToStudent(student, courseData || { courseName: 'The requested course' }, approvalStatus, rejectionReason).catch(console.error);
    }

    res.json({
      success: true,
      message: `Repeat request ${approvalStatus} successfully.`,
      repeatRecord
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Repeat Exam Records
// @route   GET /api/repeatexams
// @access  Private (Admin, HOD)
exports.getRepeats = async (req, res, next) => {
  try {
    const { status, student } = req.query;
    let query = {};

    if (status) query.approvalStatus = status;
    if (student) query.student = student;

    // Filter by HOD department if necessary
    if (req.user.role === 'hod') {
      const studentsInDept = await User.find({ department: req.user.department }).select('_id');
      query.student = { $in: studentsInDept.map(s => s._id) };
    }

    const records = await RepeatExam.find(query)
      .populate('student', 'name studentId')
      .populate('course', 'name code')
      .sort('-createdAt');

    res.json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get My Repeats (Student)
// @route   GET /api/repeatexams/my
// @access  Private (Student)
exports.getMyRepeats = async (req, res, next) => {
  try {
    const records = await RepeatExam.find({ student: req.user.id || req.user._id })
      .populate('course', 'name code credits')
      .sort('-createdAt');

    res.json({
      success: true,
      records
    });
  } catch (error) {
    next(error);
  }
};

const Feedback = require('../models/feedback');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/course');
const emailService = require('../utils/emailService');
const User = require('../models/user');

// @desc    Submit Course Feedback
// @route   POST /api/feedback
// @access  Private (Student)
exports.submitFeedback = async (req, res, next) => {
  try {
    const { course, ratings, comments, semester, academicYear, isAnonymous } = req.body;

    // Verify if student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: course,
      academicYear: academicYear,
      semester: semester
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You can only give feedback for courses you are enrolled in.'
      });
    }

    // Get the lecturer for the course
    const courseData = await Course.findById(course);
    const primaryLecturer = courseData.lecturer; // assuming this field or lecturerAssignment

    const feedback = await Feedback.create({
      student: req.user.id,
      course,
      lecturer: primaryLecturer || null,
      ratings,
      comments,
      semester,
      academicYear,
      isAnonymous
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });

    // Send email to lecturer
    if (primaryLecturer) {
      const lecturerUser = await User.findById(primaryLecturer);
      if (lecturerUser) {
        emailService.sendFeedbackNotification(lecturerUser, courseData).catch(console.error);
      }
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get Feedback for a Course
// @route   GET /api/feedback/course/:id
// @access  Private (Admin, HOD, Lecturer)
exports.getCourseFeedback = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const feedbacks = await Feedback.find({ course: courseId })
      .populate('lecturer', 'name')
      .populate(req.user.role === 'admin' ? 'student' : '', 'name email'); // show student only to admin if anonymous is false? maybe it's safer to not show

    // Sanitize anonymous feedbacks
    const sanitized = feedbacks.map(f => {
      if (f.isAnonymous && req.user.role !== 'admin') {
        const doc = f.toObject();
        delete doc.student;
        return doc;
      }
      return f;
    });

    // Calculate Average Ratings
    const totals = sanitized.reduce((acc, f) => {
      acc.teachingQuality += f.ratings.teachingQuality;
      acc.courseContent += f.ratings.courseContent;
      acc.resourcesAvailability += f.ratings.resourcesAvailability;
      acc.overallExperience += f.ratings.overallExperience;
      return acc;
    }, { teachingQuality: 0, courseContent: 0, resourcesAvailability: 0, overallExperience: 0 });

    const count = sanitized.length || 1;
    const averages = {
      teachingQuality: (totals.teachingQuality / count).toFixed(1),
      courseContent: (totals.courseContent / count).toFixed(1),
      resourcesAvailability: (totals.resourcesAvailability / count).toFixed(1),
      overallExperience: (totals.overallExperience / count).toFixed(1)
    };

    res.json({
      success: true,
      count: sanitized.length,
      averages,
      feedbacks: sanitized
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Student Feedback History
// @route   GET /api/feedback/my
// @access  Private (Student)
exports.getMyFeedbackHistory = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ student: req.user.id })
      .populate('course', 'courseName courseCode')
      .sort('-createdAt');

    res.json({
      success: true,
      feedbacks
    });
  } catch (error) {
    next(error);
  }
};

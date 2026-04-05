const mongoose = require('mongoose');
const User = require('../models/user');
const Course = require('../models/course');
const Result = require('../models/result');
const Enrollment = require('../models/Enrollment');
const Timetable = require('../models/timetable');

const Notification = require('../models/notification');
const Finance = require('../models/finance');
const RepeatExam = require('../models/RepeatExam');

// @desc    Get dashboard stats based on user role
// @route   GET /api/stats/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const { role, id } = req.user;
    let stats = {};

    switch (role) {
      case 'admin':
        stats = await getAdminStats();
        break;
      case 'lecturer':
        stats = await getLecturerStats(id);
        break;
      case 'student':
        stats = await getStudentStats(id);
        break;
      case 'dean':
        stats = await getDeanStats(req.user.facultyManaged);
        break;
      case 'registrar':
        stats = await getRegistrarStats();
        break;
      case 'bursar':
        stats = await getBursarStats();
        break;
      case 'exam_officer':
        stats = await getExamOfficerStats();
        break;
      default:
        return res.status(403).json({ message: 'Invalid role' });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user statistics (Admin only)
// @route   GET /api/stats/users
// @access  Private/Admin
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
          students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          lecturers: { $sum: { $cond: [{ $eq: ['$role', 'lecturer'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          active: 1,
          inactive: 1,
          students: 1,
          lecturers: 1,
          admins: 1
        }
      }
    ]);

    // Get recent users
    const recentUsers = await User.find()
      .select('name email role createdAt isActive')
      .sort('-createdAt')
      .limit(10);

    res.json({
      success: true,
      data: {
        summary: stats[0] || { total: 0, active: 0, inactive: 0, students: 0, lecturers: 0, admins: 0 },
        recentUsers
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get course statistics
// @route   GET /api/stats/courses
// @access  Private/Admin
const getCourseStats = async (req, res) => {
  try {
    const stats = await Course.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          bySemester: { $push: { semester: '$semester', count: 1 } },
          totalCredits: { $sum: '$credits' }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          totalCredits: 1,
          bySemester: 1
        }
      }
    ]);

    // Get courses by semester
    const coursesBySemester = await Course.aggregate([
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 },
          courses: { $push: { name: '$courseName', code: '$courseCode' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get popular courses (most enrolled)
    const popularCourses = await Enrollment.aggregate([
      {
        $group: {
          _id: '$course',
          enrollmentCount: { $sum: 1 }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' },
      {
        $project: {
          'courseDetails.courseName': 1,
          'courseDetails.courseCode': 1,
          enrollmentCount: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || { total: 0, totalCredits: 0 },
        bySemester: coursesBySemester,
        popularCourses
      }
    });
  } catch (error) {
    console.error('Error fetching course stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get result statistics
// @route   GET /api/stats/results
// @access  Private/Admin
const getResultStats = async (req, res) => {
  try {
    const { semester } = req.query;

    let matchStage = {};
    if (semester) {
      matchStage.semester = parseInt(semester);
    }

    const stats = await Result.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalResults: { $sum: 1 },
          averageGPA: { $avg: '$totalGPA' },
          highestGPA: { $max: '$totalGPA' },
          lowestGPA: { $min: '$totalGPA' },
          byExamType: {
            $push: { examType: '$examType', gpa: '$totalGPA' }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalResults: 1,
          averageGPA: { $round: ['$averageGPA', 2] },
          highestGPA: { $round: ['$highestGPA', 2] },
          lowestGPA: { $round: ['$lowestGPA', 2] },
          byExamType: 1
        }
      }
    ]);

    // Grade distribution
    const gradeDistribution = await Result.aggregate([
      { $match: matchStage },
      { $unwind: '$results' },
      {
        $group: {
          _id: '$results.grade',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || { totalResults: 0, averageGPA: 0, highestGPA: 0, lowestGPA: 0 },
        gradeDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching result stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get system overview statistics
// @route   GET /api/stats/overview
// @access  Private/Admin
const getSystemOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalResults,
      recentActivities
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments({ enrollmentStatus: 'enrolled' }),
      Result.countDocuments(),
      getRecentActivities()
    ]);

    // Get daily new users for the last 7 days
    const dailyNewUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalResults,
        recentActivities,
        dailyNewUsers
      }
    });
  } catch (error) {
    console.error('Error fetching system overview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function for admin stats
const getAdminStats = async () => {
  const [
    userStats,
    courseStats,
    enrollmentStats,
    resultStats
  ] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          lecturers: { $sum: { $cond: [{ $eq: ['$role', 'lecturer'] }, 1, 0] } }
        }
      }
    ]),
    Course.countDocuments(),
    Enrollment.countDocuments({ enrollmentStatus: 'enrolled' }),
    Result.aggregate([
      {
        $group: {
          _id: null,
          averageGPA: { $avg: '$totalGPA' },
          total: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    users: userStats[0] || { total: 0, students: 0, lecturers: 0 },
    courses: courseStats,
    enrollments: enrollmentStats,
    results: resultStats[0] || { total: 0, averageGPA: 0 }
  };
};

// Helper function for lecturer stats
const getLecturerStats = async (lecturerId) => {
  const LecturerAssignment = require('../models/LecturerAssignment');
  
  // Find subjects assigned via LecturerAssignment model
  const assignments = await LecturerAssignment.find({
    lecturer: lecturerId,
    isActive: true
  });
  const assignedSubjectIds = assignments.map(a => a.subject);

  // Define the flexible query for subjects taught by this lecturer
  const subjectQuery = {
    $or: [
      { lecturer: lecturerId },
      { _id: { $in: assignedSubjectIds } }
    ],
    isActive: true
  };

  const [courses, totalStudents, recentResults] = await Promise.all([
    Course.countDocuments(subjectQuery),
    Enrollment.aggregate([
      {
        $lookup: {
          from: 'subjects', // The collection name is 'subjects' in course.js exports
          localField: 'course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      { 
        $match: { 
          $or: [
            { 'course.lecturer': mongoose.Types.ObjectId(lecturerId) },
            { 'course._id': { $in: assignedSubjectIds } }
          ],
          'course.isActive': true
        } 
      },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]),
    Result.find({ 'publishedBy': lecturerId })
      .sort('-publishedAt')
      .limit(5)
      .populate('student', 'name registrationNumber')
  ]);

  return {
    totalCourses: courses,
    totalStudents: totalStudents[0]?.count || 0,
    recentResults
  };
};

// Helper function for student stats
const getStudentStats = async (studentId) => {
  const [currentSemester, totalCourses, gpa, notifications] = await Promise.all([
    User.findById(studentId).select('semester'),
    Enrollment.countDocuments({ student: studentId, enrollmentStatus: 'enrolled' }),
    Result.aggregate([
      { $match: { student: studentId } },
      { $group: { _id: null, averageGPA: { $avg: '$totalGPA' } } }
    ]),
    Notification.countDocuments({ user: studentId, read: false })
  ]);

  return {
    currentSemester: currentSemester?.semester || 1,
    enrolledCourses: totalCourses,
    currentGPA: gpa[0]?.averageGPA?.toFixed(2) || 0,
    unreadNotifications: notifications
  };
};

// Helper function for Dean stats
const getDeanStats = async (facultyId) => {
  const Department = require('../models/Department');
  const LecturerAssignment = require('../models/LecturerAssignment');
  let deptQuery = facultyId; // fallback

  if (facultyId) {
    const departments = await Department.find({ faculty: facultyId });
    const deptIds = departments.map(d => d._id.toString());
    const deptNames = departments.map(d => d.name);
    deptQuery = { $in: [...deptIds, ...deptNames, ...departments.map(d => d._id)] };
  } else {
    deptQuery = { $in: [] };
  }

  const [totalStudents, avgGPA, totalCourses, repeatRequests, hodList, auditRaw] = await Promise.all([
    User.countDocuments({ role: 'student', department: deptQuery }),
    Result.aggregate([
      { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'stu' } },
      { $unwind: '$stu' },
      { $match: { 'stu.department': deptQuery } },
      { $group: { _id: null, avg: { $avg: '$totalGPA' } } }
    ]),
    Course.countDocuments({ department: deptQuery }),
    RepeatExam.countDocuments({ status: 'pending' }),
    User.find({ role: 'hod', department: deptQuery }).select('name department email phone'),
    LecturerAssignment.find({ department: deptQuery }).populate('subject', 'courseName courseCode credits semester year')
  ]);

  // Enriched hod stats
  const hodStats = await Promise.all(hodList.map(async hod => {
    const [lecturers, courses] = await Promise.all([
      User.countDocuments({ role: 'lecturer', department: hod.department }),
      Course.countDocuments({ department: hod.department })
    ]);
    return {
      ...hod.toObject(),
      lecturerCount: lecturers,
      courseCount: courses
    };
  }));

  return {
    totalStudents,
    averageGPA: avgGPA[0]?.avg?.toFixed(2) || '0.00',
    totalCourses,
    pendingRepeats: repeatRequests,
    hodStats,
    auditData: auditRaw.map(a => ({
      _id: a._id,
      code: a.subject?.courseCode,
      name: a.subject?.courseName,
      department: a.department,
      semester: a.semester,
      year: a.academicYear,
      progress: a.curriculum?.progressPercentage || 0,
      lecturer: a.lecturer,
      credits: a.subject?.credits || 0
    }))
  };
};

const getAuditStats = async (req, res) => {
  try {
    const { facultyManaged } = req.user;
    const deanStats = await getDeanStats(facultyManaged);
    res.json({
      success: true,
      data: deanStats.auditData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Audit fetch failed' });
  }
};

// Helper function for Registrar stats
const getRegistrarStats = async () => {
  const [activeEnrollments, totalStudents, userGrowth, pendingTranscripts] = await Promise.all([
    Enrollment.countDocuments({ enrollmentStatus: 'enrolled' }),
    User.countDocuments({ role: 'student' }),
    User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$semester', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Notification.countDocuments({ type: 'transcript_request', read: false })
  ]);

  return {
    activeEnrollments,
    totalStudents,
    growth: userGrowth,
    pendingTranscripts
  };
};

// Helper function for Bursar stats
const getBursarStats = async () => {
  const [totalRevenue, pendingFees, recentTransactions, scholarships] = await Promise.all([
    Finance.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Finance.aggregate([{ $match: { status: { $ne: 'paid' } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Finance.find().sort('-createdAt').limit(10).populate('student', 'name studentId'),
    Finance.countDocuments({ description: /scholarship/i })
  ]);

  return {
    revenue: totalRevenue[0]?.total || 0,
    outstanding: pendingFees[0]?.total || 0,
    recentTransactions,
    activeScholarships: scholarships
  };
};

// Helper function for Exam Officer stats
const getExamOfficerStats = async () => {
  const [totalResults, pendingVerification, gradeDist, examSchedule] = await Promise.all([
    Result.countDocuments(),
    Enrollment.countDocuments({ grade: { $exists: true }, enrollmentStatus: 'completed' }), // simplified logic
    Result.aggregate([{ $unwind: '$results' }, { $group: { _id: '$results.grade', count: { $sum: 1 } } }]),
    Timetable.countDocuments({ type: 'exam' })
  ]);

  return {
    totalResults,
    verificationQueue: pendingVerification,
    gradeDist,
    scheduledExams: examSchedule
  };
};

// Helper function to get recent activities
const getRecentActivities = async () => {
  const activities = [];

  // Recent user registrations
  const recentUsers = await User.find()
    .sort('-createdAt')
    .limit(5)
    .select('name role createdAt');

  recentUsers.forEach(user => {
    activities.push({
      type: 'user_registration',
      description: `${user.name} registered as ${user.role}`,
      timestamp: user.createdAt,
      user: user.name
    });
  });

  // Recent results published
  const recentResults = await Result.find()
    .sort('-publishedAt')
    .limit(5)
    .populate('student', 'name');

  recentResults.forEach(result => {
    activities.push({
      type: 'result_published',
      description: `Results published for ${result.student?.name}`,
      timestamp: result.publishedAt,
      semester: result.semester
    });
  });

  // Sort by timestamp descending
  activities.sort((a, b) => b.timestamp - a.timestamp);

  return activities.slice(0, 10);
};

// @desc    Create custom stat report
// @route   POST /api/stats/report
// @access  Private/Admin
const createCustomReport = async (req, res) => {
  try {
    const { type, filters, dateRange } = req.body;
    let reportData = {};

    switch (type) {
      case 'student_performance':
        reportData = await gener3t24NpUrJMNunMMASmhAM953bFGeLXzN7(filters, dateRange);
        break;
      case 'course_popularity':
        reportData = await generateCoursePopularityReport(dateRange);
        break;
      case 'grade_analysis':
        reportData = await generateGradeAnalysisReport(filters, dateRange);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Error generating custom report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper functions for custom reports
const gener3t24NpUrJMNunMMASmhAM953bFGeLXzN7 = async (filters, dateRange) => {
  const matchStage = {};

  if (dateRange?.start && dateRange?.end) {
    matchStage.publishedAt = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end)
    };
  }

  if (filters?.semester) {
    matchStage.semester = parseInt(filters.semester);
  }

  const performance = await Result.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$student',
        averageGPA: { $avg: '$totalGPA' },
        resultsCount: { $sum: 1 },
        semester: { $first: '$semester' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'studentInfo'
      }
    },
    { $unwind: '$studentInfo' },
    {
      $project: {
        'studentInfo.name': 1,
        'studentInfo.registrationNumber': 1,
        'studentInfo.department': 1,
        averageGPA: { $round: ['$averageGPA', 2] },
        resultsCount: 1,
        semester: 1
      }
    },
    { $sort: { averageGPA: -1 } },
    { $limit: 50 }
  ]);

  return performance;
};

const generateCoursePopularityReport = async (dateRange) => {
  const matchStage = {};

  if (dateRange?.start && dateRange?.end) {
    matchStage.enrolledAt = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end)
    };
  }

  const popularity = await Enrollment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$course',
        enrollmentCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'courseInfo'
      }
    },
    { $unwind: '$courseInfo' },
    {
      $project: {
        'courseInfo.courseName': 1,
        'courseInfo.courseCode': 1,
        'courseInfo.semester': 1,
        'courseInfo.credits': 1,
        enrollmentCount: 1
      }
    },
    { $sort: { enrollmentCount: -1 } }
  ]);

  return popularity;
};

const generateGradeAnalysisReport = async (filters, dateRange) => {
  const matchStage = {};

  if (dateRange?.start && dateRange?.end) {
    matchStage.publishedAt = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end)
    };
  }

  if (filters?.semester) {
    matchStage.semester = parseInt(filters.semester);
  }

  const analysis = await Result.aggregate([
    { $match: matchStage },
    { $unwind: '$results' },
    {
      $group: {
        _id: {
          grade: '$results.grade',
          course: '$results.course'
        },
        count: { $sum: 1 },
        averageMarks: { $avg: '$results.marks' }
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id.course',
        foreignField: '_id',
        as: 'courseInfo'
      }
    },
    { $unwind: '$courseInfo' },
    {
      $group: {
        _id: '$_id.grade',
        totalCount: { $sum: '$count' },
        averageMarks: { $avg: '$averageMarks' },
        courses: {
          $push: {
            name: '$courseInfo.courseName',
            count: '$count',
            averageMarks: { $round: ['$averageMarks', 2] }
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return analysis;
};

module.exports = {
  getDashboardStats,
  getUserStats,
  getCourseStats,
  getResultStats,
  getSystemOverview,
  createCustomReport,
  getAuditStats
};
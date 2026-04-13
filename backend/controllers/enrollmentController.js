const Enrollment = require('../models/Enrollment');
const Course = require('../models/course');
const User = require('../models/user');
const Notification = require('../models/notification');
const LecturerAssignment = require('../models/LecturerAssignment');
const emailService = require('../utils/emailService');

// Helper functions
const checkEnrollmentAccess = async (enrollment, user) => {
  if (!enrollment || !user) return false;

  if (user.role === 'admin') return true;

  if (user.role === 'student') {
    return enrollment.student?._id?.toString() === user.id;
  }

  if (user.role === 'lecturer') {
    return await isCourseLecturer(enrollment.course?._id, user.id);
  }

  if (user.role === 'hod') {
    const course = await Course.findById(enrollment.course?._id);
    return course?.department?.toString() === user.department?.toString();
  }

  if (user.role === 'dean') {
    const course = await Course.findById(enrollment.course?._id).populate('department');
    return course?.department?.faculty?.toString() === user.facultyManaged?.toString();
  }

  return false;
};

const isCourseLecturer = async (courseId, userId) => {
  if (!courseId || !userId) return false;

  const course = await Course.findById(courseId);
  if (course?.lecturer?.toString() === userId) {
    return true;
  }

  const assignment = await LecturerAssignment.findOne({
    lecturer: userId,
    subject: courseId
  });

  return Boolean(assignment);
};

const calculateAverageGrade = (enrollments) => {
  if (!Array.isArray(enrollments) || enrollments.length === 0) return '0.00';

  const gradedEnrollments = enrollments.filter(e => e.gradePoints);
  if (gradedEnrollments.length === 0) return '0.00';

  const sum = gradedEnrollments.reduce((acc, e) => acc + (e.gradePoints || 0), 0);
  return (sum / gradedEnrollments.length).toFixed(2);
};

const calculatePassRate = (enrollments) => {
  if (!Array.isArray(enrollments) || enrollments.length === 0) return '0.00';

  const completed = enrollments.filter(e => e.enrollmentStatus === 'completed').length;
  const failed = enrollments.filter(e => e.enrollmentStatus === 'failed').length;
  const totalGraded = completed + failed;

  if (totalGraded === 0) return '0.00';
  return ((completed / totalGraded) * 100).toFixed(2);
};

const calculateGradeDistribution = (enrollments) => {
  const distribution = {};
  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E', 'F'];

  grades.forEach(grade => {
    distribution[grade] = enrollments.filter(e => e.grade === grade).length;
  });

  return distribution;
};

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private (Admin, HOD, Dean, Lecturer)
exports.getEnrollments = async (req, res, next) => {
  try {
    const {
      student,
      course,
      academicYear,
      semester,
      enrollmentStatus,
      page = 1,
      limit: initialLimit = 20,
      sortBy = '-createdAt'
    } = req.query;

    let query = {};
    let limit = initialLimit;
    const userRole = req.user.role;
    const userId = req.user.id;

    console.log(`[getEnrollments] User: ${req.user.name}, Role: ${userRole}, Department: ${req.user.department}`);

    // Role-based access control
    if (userRole === 'student') {
      query.student = userId;
    } else if (userRole === 'lecturer') {
      // Lecturers can see enrollments for courses they teach
      const teachingCourses = await Course.find({
        lecturer: userId
      }).select('_id');
      const assignments = await LecturerAssignment.find({
        lecturer: userId,
        isActive: true
      }).select('subject');

      const courseIds = teachingCourses.map(c => c._id);
      const assignmentCourseIds = assignments.map(a => a.subject);
      const combinedCourseIds = [...new Set([...courseIds, ...assignmentCourseIds.map(id => id.toString())])];

      if (combinedCourseIds.length > 0) {
        query.course = { $in: combinedCourseIds };
      } else {
        console.log('[getEnrollments] Lecturer has no assigned courses - returning empty result');
        return res.json({
          success: true,
          count: 0,
          total: 0,
          page: parseInt(page),
          pages: 0,
          enrollments: [],
          message: 'You have no assigned courses'
        });
      }
    } else if (userRole === 'hod') {
      // HOD can see enrollments in their department
      const departmentCourses = await Course.find({
        department: req.user.department
      }).select('_id');
      console.log(`[getEnrollments] HOD found ${departmentCourses.length} courses in department: ${req.user.department}`);
      
      if (departmentCourses.length === 0) {
        console.log('[getEnrollments] No courses found for HOD department - returning empty result');
        // If no courses found, return empty result (don't query at all)
        return res.json({
          success: true,
          count: 0,
          total: 0,
          page: parseInt(page),
          pages: 0,
          enrollments: [],
          message: 'No courses found for your department'
        });
      }
      
      const courseIds = departmentCourses.map(c => c._id);
      query.course = { $in: courseIds };
      // Increase limit for HOD to see more enrollments for review
      limit = Math.max(parseInt(limit) || 20, 1000);
    } else if (userRole === 'dean') {
      // Dean can see enrollments in their faculty
      const facultyCourses = await Course.find({
        faculty: req.user.facultyManaged
      }).select('_id');
      console.log(`[getEnrollments] Dean found ${facultyCourses.length} courses in faculty: ${req.user.facultyManaged}`);
      
      if (facultyCourses.length === 0) {
        console.log('[getEnrollments] No courses found for Dean faculty - returning empty result');
        return res.json({
          success: true,
          count: 0,
          total: 0,
          page: parseInt(page),
          pages: 0,
          enrollments: [],
          message: 'No courses found for your faculty'
        });
      }
      
      const courseIds = facultyCourses.map(c => c._id);
      query.course = { $in: courseIds };
    }

    // Apply filters
    if (student) query.student = student;
    if (course) query.course = course;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester);
    if (enrollmentStatus) query.enrollmentStatus = enrollmentStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log(`[getEnrollments] Query:`, query);

    const enrollments = await Enrollment.find(query)
      .populate('student', 'name studentId registrationNumber email department')
      .populate('course', 'courseCode courseName credits level')
      .populate('gradedBy', 'name')
      .populate('attendance.markedBy', 'name')
      .populate('attendance.updatedByHOD', 'name')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Enrollment.countDocuments(query);
    
    console.log(`[getEnrollments] Found ${enrollments.length} enrollments, Total: ${total}`);

    res.json({
      success: true,
      count: enrollments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
exports.getEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('student', 'name studentId registrationNumber email phone department')
      .populate('course', 'courseCode courseName credits level semester assessmentStructure')
      .populate('gradedBy', 'name email')
      .populate('attendance.markedBy', 'name')
      .populate('attendance.updatedByHOD', 'name');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check access permissions
    const hasAccess = await checkEnrollmentAccess(enrollment, req.user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create enrollment
// @route   POST /api/enrollments
// @access  Private (Admin, Registrar, HOD)
exports.createEnrollment = async (req, res, next) => {
  try {
    const { student, course, academicYear, semester } = req.body;

    // Check if student exists and is a student
    const studentUser = await User.findOne({
      _id: student,
      role: 'student',
      isActive: true
    });

    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or inactive'
      });
    }

    // Check if course exists and is active
    const courseData = await Course.findOne({
      _id: course,
      isActive: true
    });

    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or inactive'
      });
    }

    // Check if enrollment already exists
    const existingEnrollment = await Enrollment.findOne({
      student,
      course,
      academicYear,
      semester: semester || studentUser.semester
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course for the specified semester'
      });
    }

    // Check course capacity
    const enrolledCount = await Enrollment.countDocuments({
      course,
      academicYear,
      semester: semester || studentUser.semester,
      enrollmentStatus: { $in: ['enrolled', 'completed'] }
    });

    if (enrolledCount >= (courseData.maxStudents || Infinity)) {
      return res.status(400).json({
        success: false,
        message: 'Course has reached maximum capacity'
      });
    }

    // Set student's year of study and semester if not provided
    const enrollmentData = {
      student,
      course,
      academicYear,
      semester: semester || studentUser.semester,
      yearOfStudy: req.body.yearOfStudy || (studentUser.yearOfStudy ? `${studentUser.yearOfStudy}${studentUser.yearOfStudy === 1 ? 'st' : studentUser.yearOfStudy === 2 ? 'nd' : studentUser.yearOfStudy === 3 ? 'rd' : 'th'} Year` : academicYear),
      createdBy: req.user.id,
      enrollmentDate: new Date()
    };

    const enrollment = await Enrollment.create(enrollmentData);

    // Update course current enrollment count
    await Course.findByIdAndUpdate(course, {
      $inc: { currentEnrollment: 1 }
    });

    // Populate data
    await enrollment.populate([
      { path: 'student', select: 'name studentId email' },
      { path: 'course', select: 'courseCode courseName' }
    ]);

    // Create notification for student
    await Notification.create({
      user: student,
      title: 'Course Enrollment Successful',
      message: `You have been successfully enrolled in ${enrollment.course?.courseCode || ''} - ${enrollment.course?.courseName || ''}`,
      type: 'ENROLLMENT',
      priority: 'MEDIUM',
      sender: req.user.id,
      metadata: {
        enrollmentId: enrollment._id,
        courseId: course,
        courseCode: enrollment.course?.courseCode
      }
    });

    // Send enrollment confirmation email
    emailService.sendEnrollmentConfirmation(studentUser, courseData).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update enrollment
// @route   PUT /api/enrollments/:id
// @access  Private (Admin, Registrar, Lecturer)
exports.updateEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check permissions
    const canUpdate =
      req.user.role === 'admin' ||
      req.user.role === 'registrar' ||
      (req.user.role === 'lecturer' && await isCourseLecturer(enrollment.course, req.user.id));

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot update this enrollment.'
      });
    }

    // Prevent updates to certain fields
    const allowedUpdates = [
      'continuousAssessment', 'finalExam', 'attendance',
      'assessments', 'remarks', 'enrollmentStatus'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    updates.updatedBy = req.user.id;

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('student', 'name studentId email')
      .populate('course', 'courseCode courseName');

    // If grade was updated, notify student
    if (updates.continuousAssessment !== undefined || updates.finalExam !== undefined) {
      await Notification.create({
        user: enrollment.student,
        title: 'Grade Updated',
        message: `Your grade for ${updatedEnrollment.course?.courseCode || ''} has been updated.`,
        type: 'grade',
        priority: 'high',
        sender: req.user.id,
        metadata: {
          enrollmentId: enrollment._id,
          courseId: enrollment.course,
          courseCode: updatedEnrollment.course?.courseCode
        }
      });

      // Email grade update
      emailService.sendGradeNotification(updatedEnrollment.student, updatedEnrollment).catch(console.error);
    }

    res.json({
      success: true,
      message: 'Enrollment updated successfully',
      enrollment: updatedEnrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private (Admin only)
exports.deleteEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Only admin can delete enrollments
    // Only admin or assigned lecturer can delete enrollments
    const canDelete = 
      req.user.role === 'admin' || 
      (req.user.role === 'lecturer' && await isCourseLecturer(enrollment.course, req.user.id));

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin or assigned lecturer can delete enrollments.'
      });
    }

    await enrollment.deleteOne();

    // Update course current enrollment count
    await Course.findByIdAndUpdate(enrollment.course, {
      $inc: { currentEnrollment: -1 }
    });

    res.json({
      success: true,
      message: 'Enrollment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk enroll students
// @route   POST /api/enrollments/bulk
// @access  Private (Admin, Registrar)
// @desc    Bulk enroll students by list
// @route   POST /api/enrollments/bulk
// @access  Private (Admin, Registrar, HOD, Lecturer)
exports.bulkEnrollStudents = async (req, res, next) => {
  try {
    const { course, academicYear, semester, students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }

    const courseData = await Course.findById(course);
    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    let successCount = 0;

    for (const studentId of students) {
      try {
        // Check if student exists
        const student = await User.findOne({
          _id: studentId,
          role: 'student',
          isActive: true
        });

        if (!student) {
          results.failed.push({
            studentId,
            reason: 'Student not found or inactive'
          });
          continue;
        }

        // Check if already enrolled
        const existing = await Enrollment.findOne({
          student: studentId,
          course,
          academicYear,
          semester: semester || student.semester
        });

        if (existing) {
          results.failed.push({
            studentId,
            reason: 'Already enrolled'
          });
          continue;
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
          student: studentId,
          course,
          academicYear,
          semester: semester || student.semester,
          yearOfStudy: req.body.yearOfStudy || (student.yearOfStudy ? `${student.yearOfStudy}${student.yearOfStudy === 1 ? 'st' : student.yearOfStudy === 2 ? 'nd' : student.yearOfStudy === 3 ? 'rd' : 'th'} Year` : academicYear),
          createdBy: req.user.id,
          enrollmentDate: new Date()
        });

        results.successful.push(enrollment);
        successCount++;
      } catch (error) {
        results.failed.push({
          studentId,
          reason: error.message
        });
      }
    }

    // Update course enrollment count
    if (successCount > 0) {
      await Course.findByIdAndUpdate(course, {
        $inc: { currentEnrollment: successCount }
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully enrolled ${results.successful.length} students`,
      results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll students by batch automatically
// @route   POST /api/enrollments/enroll-batch
// @access  Private (Admin, HOD, Lecturer)
exports.enrollBatchStudents = async (req, res, next) => {
  try {
    const { courseId, academicYear, semester } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Role-based access control
    const isLecturer = await isCourseLecturer(courseId, req.user.id);
    const isHOD = req.user.role === 'hod' && course.department === req.user.department;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'registrar';

    if (!isAdmin && !isHOD && !isLecturer) {
      return res.status(403).json({ success: false, message: 'Not authorized to enroll students for this course' });
    }

    // Find all active students in the same department and year level
    // We map the course's year string (e.g., "1st Year") to the user's yearOfStudy number
    const yearMap = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4 };
    const yearNum = yearMap[course.year];

    const batchStudents = await User.find({
      role: 'student',
      department: course.department,
      yearOfStudy: yearNum,
      isActive: true
    });

    if (batchStudents.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found matching this subject\'s batch criteria' });
    }

    const results = { successful: [], failed: [] };
    let successCount = 0;

    for (const student of batchStudents) {
      try {
        // Skip if already enrolled
        const existing = await Enrollment.findOne({
          student: student._id,
          course: courseId,
          academicYear,
          semester: semester || course.semester
        });

        if (existing) continue;

        const enrollment = await Enrollment.create({
          student: student._id,
          course: courseId,
          academicYear: academicYear || course.year,
          semester: semester || course.semester,
          yearOfStudy: `${student.yearOfStudy}${student.yearOfStudy === 1 ? 'st' : student.yearOfStudy === 2 ? 'nd' : student.yearOfStudy === 3 ? 'rd' : 'th'} Year`,
          createdBy: req.user.id,
          enrollmentDate: new Date()
        });

        results.successful.push(enrollment);
        successCount++;
        
        // Notify student (fire and forget)
        Notification.create({
          user: student._id,
          title: 'Auto-Enrolled in Course',
          message: `You have been automatically enrolled in ${course.code} - ${course.name} based on your batch.`,
          type: 'ENROLLMENT',
          priority: 'MEDIUM',
          sender: req.user.id,
          metadata: { enrollmentId: enrollment._id, courseId: course._id }
        }).catch(console.error);

      } catch (err) {
        results.failed.push({ student: student.name, reason: err.message });
      }
    }

    if (successCount > 0) {
      await Course.findByIdAndUpdate(courseId, { $inc: { currentEnrollment: successCount } });
    }

    res.status(201).json({
      success: true,
      message: `Enrolled ${successCount} students from ${course.department} ${course.year}`,
      count: successCount,
      results
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update grades
// @route   PUT /api/enrollments/:id/grades
// @access  Private (Lecturer, HOD, Admin)
exports.updateGrades = async (req, res, next) => {
  try {
    const { continuousAssessment, finalExam, assessments } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check permissions
    const canGrade =
      req.user.role === 'admin' ||
      req.user.role === 'hod' ||
      (req.user.role === 'lecturer' && await isCourseLecturer(enrollment.course, req.user.id));

    if (!canGrade) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot grade this enrollment.'
      });
    }

    if (continuousAssessment !== undefined) {
      enrollment.continuousAssessment = continuousAssessment;
    }

    if (finalExam !== undefined) {
      enrollment.finalExam = finalExam;
    }

    if (assessments && Array.isArray(assessments)) {
      for (const assessment of assessments) {
        const existingIndex = enrollment.assessments.findIndex(
          a => a._id && a._id.toString() === assessment._id
        );

        if (existingIndex >= 0) {
          // Update existing assessment
          assessment.gradedBy = req.user.id;
          assessment.gradedDate = new Date();
          assessment.graded = true;

          enrollment.assessments[existingIndex] = {
            ...enrollment.assessments[existingIndex].toObject(),
            ...assessment
          };
        } else if (assessment.name && assessment.score !== undefined) {
          // Add new assessment
          enrollment.assessments.push({
            name: assessment.name,
            score: assessment.score,
            maxScore: assessment.maxScore || 100,
            weight: assessment.weight || 0,
            gradedBy: req.user.id,
            gradedDate: new Date(),
            graded: true
          });
        }
      }
    }

    enrollment.gradedBy = req.user.id;
    enrollment.gradedDate = new Date();
    await enrollment.save();

    await enrollment.populate('student', 'name studentId email');
    await enrollment.populate('course', 'courseCode courseName');

    // Notify student about grade update
    await Notification.create({
      user: enrollment.student?._id,
      title: 'Grade Posted',
      message: `Your grade for ${enrollment.course?.courseCode || ''} has been posted. Grade: ${enrollment.grade || 'N/A'}`,
      type: 'grade',
      priority: 'high',
      sender: req.user.id,
      metadata: {
        enrollmentId: enrollment._id,
        courseId: enrollment.course?._id,
        courseCode: enrollment.course?.courseCode,
        grade: enrollment.grade
      }
    });

    // Send grade notification email
    emailService.sendGradeNotification(enrollment.student, enrollment).catch(console.error);

    res.json({
      success: true,
      message: 'Grades updated successfully',
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update attendance
// @route   PUT /api/enrollments/:id/attendance
// @access  Private (Lecturer, HOD, Admin)
exports.updateAttendance = async (req, res, next) => {
  try {
    const { attendance } = req.body;

    if (!Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide attendance records'
      });
    }

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check permissions
    const canUpdateAttendance =
      req.user.role === 'admin' ||
      req.user.role === 'hod' ||
      (req.user.role === 'lecturer' && await isCourseLecturer(enrollment.course, req.user.id));

    if (!canUpdateAttendance) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot update attendance for this enrollment.'
      });
    }

    // Initialize attendance array if it doesn't exist
    if (!enrollment.attendance) {
      enrollment.attendance = [];
    }

    for (const record of attendance) {
      const recordDate = new Date(record.date);
      const existingIndex = enrollment.attendance.findIndex(
        a => a.date && a.date.toISOString().split('T')[0] === recordDate.toISOString().split('T')[0]
      );

      if (existingIndex >= 0) {
        // Update existing attendance
        enrollment.attendance[existingIndex].status = record.status;
        enrollment.attendance[existingIndex].markedBy = req.user._id;
        enrollment.attendance[existingIndex].markedAt = new Date();
        if (record.remarks) {
          enrollment.attendance[existingIndex].remarks = record.remarks;
        }
      } else {
        // Add new attendance record
        enrollment.attendance.push({
          date: recordDate,
          status: record.status,
          remarks: record.remarks,
          markedBy: req.user._id,
          markedAt: new Date()
        });
      }
    }

    // Recalculate attendance percentage
    const total = enrollment.attendance.length;
    const present = enrollment.attendance.filter(
      a => a.status === 'present' || a.status === 'late'
    ).length;
    const attendancePercentage = total > 0 ? (present / total) * 100 : 0;

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          attendance: enrollment.attendance,
          attendancePercentage: attendancePercentage,
          updatedBy: req.user.id
        }
      },
      { new: true }
    );

    // Check attendance threshold for email warning
    if (updatedEnrollment.attendancePercentage < 75) {
      const student = await User.findById(updatedEnrollment.student);
      const populated = await Enrollment.findById(updatedEnrollment._id).populate('course');
      if (student && populated.course) {
        emailService.sendAttendanceWarning(student, populated).catch(console.error);
      }
    }

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      attendance: updatedEnrollment.attendance,
      attendancePercentage: updatedEnrollment.attendancePercentage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student enrollments
// @route   GET /api/enrollments/student/:studentId
// @access  Private
exports.getStudentEnrollments = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicYear, semester, status } = req.query;

    console.log('[getStudentEnrollments] Request for student:', { studentId, academicYear, semester, status });

    // Check access
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own enrollments.'
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    console.log('[getStudentEnrollments] Student found:', { name: student.name, yearOfStudy: student.yearOfStudy });

    let query = { student: studentId };

    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester);
    if (status) query.enrollmentStatus = status;

    console.log('[getStudentEnrollments] Query:', query);

    const enrollments = await Enrollment.find(query)
      .populate('course', 'courseCode courseName credits level')
      .populate('gradedBy', 'name')
      .populate('attendance.markedBy', 'name')
      .populate('attendance.updatedByHOD', 'name')
      .sort('-academicYear -semester');

    console.log('[getStudentEnrollments] Found enrollments:', {
      count: enrollments.length,
      enrollments: enrollments.map(e => ({
        id: e._id,
        course: e.course?.courseName,
        academicYear: e.academicYear,
        semester: e.semester,
        attendanceCount: e.attendance?.length || 0
      }))
    });

    // Calculate GPA
    let totalCredits = 0;
    let totalGradePoints = 0;
    const completedEnrollments = enrollments.filter(e => e.enrollmentStatus === 'completed');

    completedEnrollments.forEach(e => {
      if (e.gradePoints && e.course?.credits) {
        totalCredits += e.course.credits;
        totalGradePoints += e.gradePoints * e.course.credits;
      }
    });

    const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        department: student.department
      },
      stats: {
        totalEnrollments: enrollments.length,
        completed: enrollments.filter(e => e.enrollmentStatus === 'completed').length,
        enrolled: enrollments.filter(e => e.enrollmentStatus === 'enrolled').length,
        gpa,
        totalCredits
      },
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course enrollments
// @route   GET /api/enrollments/course/:courseId
// @access  Private (Admin, HOD, Dean, Lecturer)
exports.getCourseEnrollments = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { academicYear, semester, status } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check access
    const isLecturer = await isCourseLecturer(courseId, req.user.id);
    const hasAccess =
      req.user.role === 'admin' ||
      req.user.role === 'hod' ||
      req.user.role === 'dean' ||
      isLecturer;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view enrollments for this course.'
      });
    }

    let query = { course: courseId };

    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester);
    if (status) query.enrollmentStatus = status;

    const enrollments = await Enrollment.find(query)
      .populate('student', 'name studentId email batch')
      .populate('gradedBy', 'name')
      .populate('attendance.markedBy', 'name')
      .populate('attendance.updatedByHOD', 'name')
      .sort('student.name');

    // Calculate statistics
    const stats = {
      total: enrollments.length,
      enrolled: enrollments.filter(e => e.enrollmentStatus === 'enrolled').length,
      completed: enrollments.filter(e => e.enrollmentStatus === 'completed').length,
      dropped: enrollments.filter(e => e.enrollmentStatus === 'dropped').length,
      failed: enrollments.filter(e => e.enrollmentStatus === 'failed').length,
      averageGrade: calculateAverageGrade(enrollments),
      passRate: calculatePassRate(enrollments),
      gradeDistribution: calculateGradeDistribution(enrollments)
    };

    res.json({
      success: true,
      course: {
        id: course._id,
        code: course.courseCode,
        name: course.courseName
      },
      stats,
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate grade sheet
// @route   GET /api/enrollments/course/:courseId/grade-sheet
// @access  Private (Lecturer, HOD, Admin)
exports.generateGradeSheet = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { academicYear, semester } = req.query;

    if (!academicYear || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Please provide academicYear and semester'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check access
    const isLecturer = await isCourseLecturer(courseId, req.user.id);
    if (!['admin', 'hod', 'dean'].includes(req.user.role) && !isLecturer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only lecturers of this course can generate grade sheets.'
      });
    }

    const enrollments = await Enrollment.find({
      course: courseId,
      academicYear,
      semester: parseInt(semester)
    })
      .populate('student', 'name studentId registrationNumber')
      .sort('student.studentId');

    // Generate grade sheet data
    const gradeSheet = {
      course: {
        code: course.courseCode,
        name: course.courseName,
        credits: course.credits,
        academicYear,
        semester: parseInt(semester)
      },
      stats: {
        totalStudents: enrollments.length,
        passed: enrollments.filter(e => e.enrollmentStatus === 'completed').length,
        failed: enrollments.filter(e => e.enrollmentStatus === 'failed').length,
        averageGrade: calculateAverageGrade(enrollments),
        passRate: calculatePassRate(enrollments)
      },
      gradeDistribution: calculateGradeDistribution(enrollments),
      students: enrollments.map(e => ({
        studentId: e.student?.studentId || '',
        registrationNumber: e.student?.registrationNumber || '',
        name: e.student?.name || '',
        continuousAssessment: e.continuousAssessment,
        finalExam: e.finalExam,
        totalMarks: e.totalMarks,
        grade: e.grade,
        gradePoints: e.gradePoints,
        status: e.enrollmentStatus
      }))
    };

    res.json({
      success: true,
      gradeSheet
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw student from course
// @route   PUT /api/enrollments/:id/withdraw
// @access  Private (Student, Admin, Registrar)
exports.withdrawStudent = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check permissions
    const canWithdraw =
      req.user.role === 'admin' ||
      req.user.role === 'registrar' ||
      (req.user.role === 'student' && enrollment.student?.toString() === req.user.id);

    if (!canWithdraw) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot withdraw from this course.'
      });
    }

    // Students can only withdraw within a certain period (e.g., first 2 weeks)
    if (req.user.role === 'student') {
      const enrollmentDate = new Date(enrollment.enrollmentDate || enrollment.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now - enrollmentDate) / (1000 * 60 * 60 * 24));

      if (daysDiff > 14) {
        return res.status(400).json({
          success: false,
          message: 'Withdrawal period has expired. Please contact the registrar.'
        });
      }
    }

    enrollment.enrollmentStatus = 'dropped';
    enrollment.withdrawalDate = new Date();
    enrollment.withdrawalReason = reason;
    enrollment.updatedBy = req.user.id;
    await enrollment.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(enrollment.course, {
      $inc: { currentEnrollment: -1 }
    });

    res.json({
      success: true,
      message: 'Successfully withdrawn from course',
      enrollment
    });
  } catch (error) {
    next(error);
  }
};
exports.certifyResult = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('student', 'name email')
      .populate('course', 'courseName courseCode');

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    enrollment.enrollmentStatus = 'completed';
    await enrollment.save();

    emailService.sendResultCertificationEmail(enrollment.student, enrollment).catch(console.error);
    emailService.sendResultPDFEmail(enrollment.student, enrollment).catch(console.error);

    res.json({ success: true, message: 'Certified and notified.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Self-register for a course (Student)
// @route   POST /api/enrollments/register
// @access  Private (Student)
exports.registerCourse = async (req, res, next) => {
  try {
    const { course, academicYear, semester } = req.body;
    const student = req.user.id;

    const studentUser = await User.findOne({ _id: student, role: 'student', isActive: true });
    if (!studentUser) return res.status(404).json({ success: false, message: 'Student inactive or missing.' });

    const courseData = await Course.findOne({ _id: course, isActive: true });
    if (!courseData) return res.status(404).json({ success: false, message: 'Course not found.' });

    const existing = await Enrollment.findOne({ student, course, academicYear, semester });
    if (existing) return res.status(400).json({ success: false, message: 'Already enrolled.' });

    const enrollment = await Enrollment.create({
      student,
      course,
      academicYear,
      semester: semester || studentUser.semester,
      yearOfStudy: req.body.yearOfStudy || (studentUser.yearOfStudy ? `${studentUser.yearOfStudy}${['st', 'nd', 'rd', 'th'][Math.min(studentUser.yearOfStudy - 1, 3)]} Year` : '1st Year'),
      createdBy: student,
      enrollmentDate: new Date()
    });

    await Course.findByIdAndUpdate(course, { $inc: { currentEnrollment: 1 } });

    // Notify
    await Notification.create({
      user: student,
      title: 'Registration Successful',
      message: `Enrolled in ${courseData.courseCode} - ${courseData.courseName}`,
      type: 'enrollment',
      sender: student
    });

    emailService.sendEnrollmentConfirmation(studentUser, courseData).catch(console.error);

    res.status(201).json({ success: true, enrollment });
  } catch (err) {
    next(err);
  }
};

// @desc    Student confirms attendance
// @route   PUT /api/enrollments/:id/confirm-attendance
// @access  Private (Student only)
exports.confirmStudentAttendance = async (req, res, next) => {
  try {
    const { attendanceConfirmations } = req.body;

    if (!Array.isArray(attendanceConfirmations) || attendanceConfirmations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide attendance confirmations'
      });
    }

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user is the student
    if (req.user.id !== enrollment.student.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only confirm your own attendance.'
      });
    }

    // Process confirmations
    for (const confirmation of attendanceConfirmations) {
      const recordDate = new Date(confirmation.date);
      const existingIndex = enrollment.attendance.findIndex(
        a => a.date && a.date.toISOString().split('T')[0] === recordDate.toISOString().split('T')[0]
      );

      if (existingIndex >= 0) {
        const attendanceRecord = enrollment.attendance[existingIndex];

        // Only allow confirmation if lecturer has already marked attendance
        if (!attendanceRecord.markedBy) {
          return res.status(400).json({
            success: false,
            message: `Cannot confirm attendance for ${confirmation.date}. Lecturer must mark attendance first.`
          });
        }

        // Update student confirmation
        attendanceRecord.studentConfirmed = confirmation.confirmed;
        attendanceRecord.studentConfirmedAt = new Date();
        if (confirmation.studentRemarks) {
          attendanceRecord.studentRemarks = confirmation.studentRemarks;
        }

        // If student confirms they were present but lecturer marked absent, create notification for HOD review
        if (confirmation.confirmed && attendanceRecord.status === 'absent') {
          await Notification.create({
            user: enrollment.student,
            title: 'Attendance Discrepancy Reported',
            message: `You confirmed attendance for ${recordDate.toDateString()} in ${enrollment.course.courseName}, but were marked absent. This has been flagged for HOD review.`,
            type: 'ATTENDANCE_DISCREPANCY',
            priority: 'MEDIUM',
            metadata: {
              enrollmentId: enrollment._id,
              date: recordDate,
              lecturerStatus: attendanceRecord.status,
              studentConfirmation: confirmation.confirmed
            }
          });

          // Also notify HOD
          const hod = await User.findOne({ department: enrollment.student.department, role: 'hod' });
          if (hod) {
            await Notification.create({
              user: hod._id,
              title: 'Attendance Discrepancy Requires Review',
              message: `Student ${enrollment.student.name} reported attendance discrepancy for ${recordDate.toDateString()} in ${enrollment.course.courseName}`,
              type: 'ATTENDANCE_REVIEW',
              priority: 'HIGH',
              metadata: {
                enrollmentId: enrollment._id,
                studentId: enrollment.student._id,
                date: recordDate
              }
            });
            emailService.sendAttendanceDiscrepancyNotification(enrollment.student, enrollment, recordDate).catch(console.error);
            emailService.sendAttendanceReviewToHOD(hod, enrollment.student, enrollment, recordDate).catch(console.error);
          }
        }
      }
    }

    await enrollment.save();

    res.json({
      success: true,
      message: 'Attendance confirmation submitted successfully',
      confirmations: attendanceConfirmations.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    HOD reviews and updates attendance
// @route   PUT /api/enrollments/:id/review-attendance
// @access  Private (HOD, Admin)
exports.reviewAttendanceByHOD = async (req, res, next) => {
  try {
    const { attendanceUpdates } = req.body;

    if (!Array.isArray(attendanceUpdates) || attendanceUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide attendance updates'
      });
    }

    const enrollment = await Enrollment.findById(req.params.id)
      .populate('student', 'name studentId department')
      .populate('course', 'courseName courseCode');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check permissions - HOD can only review students in their department
    if (req.user.role === 'hod' && enrollment.student.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only review attendance for students in your department.'
      });
    }

    // Process HOD updates
    for (const update of attendanceUpdates) {
      const recordDate = new Date(update.date);
      const existingIndex = enrollment.attendance.findIndex(
        a => a.date && a.date.toISOString().split('T')[0] === recordDate.toISOString().split('T')[0]
      );

      if (existingIndex >= 0) {
        const attendanceRecord = enrollment.attendance[existingIndex];

        // Update with HOD decision
        attendanceRecord.status = update.status;
        attendanceRecord.updatedByHOD = req.user._id;
        attendanceRecord.hodUpdatedAt = new Date();
        if (update.hodRemarks) {
          attendanceRecord.hodRemarks = update.hodRemarks;
        }

        // Notify student of HOD decision
        await Notification.create({
          user: enrollment.student._id,
          title: 'Attendance Review Completed',
          message: `Your attendance for ${recordDate.toDateString()} in ${enrollment.course.courseName} has been reviewed by HOD. Status: ${update.status}`,
          type: 'ATTENDANCE_REVIEWED',
          priority: update.status === attendanceRecord.status ? 'LOW' : 'MEDIUM',
          metadata: {
            enrollmentId: enrollment._id,
            date: recordDate,
            oldStatus: attendanceRecord.status,
            newStatus: update.status,
            hodRemarks: update.hodRemarks
          }
        });

        // Send email notification
        emailService.sendAttendanceReviewResult(
          enrollment.student,
          enrollment,
          recordDate,
          attendanceRecord.status,
          update.status,
          update.hodRemarks
        ).catch(console.error);
      }
    }

    // Recalculate attendance percentage
    const total = enrollment.attendance.length;
    const present = enrollment.attendance.filter(
      a => a.status === 'present' || a.status === 'late'
    ).length;
    const attendancePercentage = total > 0 ? (present / total) * 100 : 0;

    await enrollment.save();

    res.json({
      success: true,
      message: 'Attendance review completed successfully',
      attendancePercentage: attendancePercentage,
      updates: attendanceUpdates.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance details for admin/dean view
// @route   GET /api/enrollments/:id/attendance-details
// @access  Private (Admin, Dean, HOD, Lecturer)
exports.getAttendanceDetails = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('student', 'name studentId department email')
      .populate('course', 'courseName courseCode')
      .populate('attendance.markedBy', 'name role')
      .populate('attendance.updatedByHOD', 'name role');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check permissions
    let hasAccess = false;
    if (req.user.role === 'admin' || req.user.role === 'dean') {
      hasAccess = true;
    } else if (req.user.role === 'hod' && enrollment.student.department === req.user.department) {
      hasAccess = true;
    } else if (req.user.role === 'lecturer') {
      // Check if lecturer teaches this course
      hasAccess = await isCourseLecturer(enrollment.course._id, req.user.id);
    } else if (req.user.role === 'student' && req.user.id === enrollment.student._id.toString()) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to attendance details.'
      });
    }

    // Calculate attendance statistics
    const attendanceStats = {
      totalSessions: enrollment.attendance.length,
      present: enrollment.attendance.filter(a => a.status === 'present').length,
      absent: enrollment.attendance.filter(a => a.status === 'absent').length,
      late: enrollment.attendance.filter(a => a.status === 'late').length,
      excused: enrollment.attendance.filter(a => a.status === 'excused').length,
      confirmedByStudent: enrollment.attendance.filter(a => a.studentConfirmed).length,
      reviewedByHOD: enrollment.attendance.filter(a => a.updatedByHOD).length,
      discrepancies: enrollment.attendance.filter(a => a.studentConfirmed && a.status === 'absent').length
    };

    attendanceStats.attendancePercentage = attendanceStats.totalSessions > 0
      ? ((attendanceStats.present + attendanceStats.late) / attendanceStats.totalSessions * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      enrollment: {
        id: enrollment._id,
        student: enrollment.student,
        course: enrollment.course,
        academicYear: enrollment.academicYear,
        semester: enrollment.semester
      },
      attendance: enrollment.attendance,
      statistics: attendanceStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Update attendance for multiple students
// @route   PUT /api/enrollments/course/:courseId/bulk-attendance
// @access  Private (Lecturer, HOD, Admin)
exports.bulkUpdateAttendance = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { records, date } = req.body;
    
    if (!Array.isArray(records) || records.length === 0 || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide attendance records array and a date'
      });
    }

    const canUpdateAttendance =
      req.user.role === 'admin' ||
      req.user.role === 'hod' ||
      (req.user.role === 'lecturer' && await isCourseLecturer(courseId, req.user.id));

    if (!canUpdateAttendance) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot update attendance for this course.'
      });
    }

    const bulkOps = [];
    const recordDate = new Date(date).toISOString().split('T')[0];

    // First fetch the enrollments to maintain full arrays correctly
    // MongoDB doesn't easily allow updating a specific array element by matching a date inside bulk ops using simple push, 
    // it's easier to fetch and update or use precise positional operators.
    const enrollments = await Enrollment.find({ _id: { $in: records.map(r => r.enrollmentId) } });

    for (const enrollment of enrollments) {
      const record = records.find(r => r.enrollmentId === enrollment._id.toString());
      if (!record) continue;

      let newAttendanceArray = enrollment.attendance || [];
      const existingIndex = newAttendanceArray.findIndex(
        a => a.date && a.date.toISOString().split('T')[0] === recordDate
      );

      if (existingIndex >= 0) {
        newAttendanceArray[existingIndex].status = record.status;
        newAttendanceArray[existingIndex].markedBy = req.user._id;
        newAttendanceArray[existingIndex].markedAt = new Date();
      } else {
        newAttendanceArray.push({
          date: new Date(date),
          status: record.status,
          markedBy: req.user._id,
          markedAt: new Date()
        });
      }

      // Recalc attendance
      const total = newAttendanceArray.length;
      const present = newAttendanceArray.filter(a => a.status === 'present' || a.status === 'late').length;
      const percentage = total > 0 ? (present / total) * 100 : 0;

      bulkOps.push({
        updateOne: {
          filter: { _id: enrollment._id },
          update: {
            $set: {
              attendance: newAttendanceArray,
              attendancePercentage: percentage,
              updatedBy: req.user.id
            }
          }
        }
      });
    }

    if (bulkOps.length > 0) {
      await Enrollment.bulkWrite(bulkOps);
    }

    res.json({
      success: true,
      message: `Bulk updated ${bulkOps.length} attendance records for the course.`,
      count: bulkOps.length
    });
  } catch (error) {
    console.error("Bulk attendance error:", error);
    next(error);
  }
};

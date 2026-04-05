/**
 * REPEAT SUBJECT REGISTRATION CONTROLLER
 * Enhanced Multi-Role Approval Workflow
 *
 * WORKFLOW STAGES:
 * 1. Student Identifies Subjects to Repeat (DRAFT)
 * 2. Student Submits Application (SUBMITTED)
 * 3. HOD Reviews & Approves (HOD_APPROVED/REJECTED)
 * 4. Registrar Approves (REGISTRAR_APPROVED/REJECTED)
 * 5. Exam Officer Reviews (EXAM_OFFICER_REVIEW)
 * 6. Admin Final Approval (ADMIN_APPROVED/REJECTED)
 * 7. Exam Officer Allocates Fees (FEE_ALLOCATED)
 * 8. Student Pays Fee & Uploads Receipt (PAYMENT_SUBMITTED)
 * 9. Exam Officer Verifies Payment (PAYMENT_VERIFIED/REJECTED)
 * 10. Exam Officer Schedules Exam (EXAM_SCHEDULED)
 * 11. Complete (COMPLETED)
 */

const RepeatSubjectRegistration = require('../models/RepeatSubjectRegistration');
const User = require('../models/user');
const Subject = require('../models/course');
const Result = require('../models/result');
const Finance = require('../models/finance');
const Notification = require('../models/notification');
const emailService = require('../utils/emailService');

// ================================
// 1. STUDENT WORKFLOW
// ================================

/**
 * @desc    Get eligible subjects for repeat (student can repeat)
 * @route   GET /api/repeat-registration/eligible-subjects
 * @access  Private/Student
 * @scenario A student logs in and views subjects they failed/got poor grades
 */
exports.getEligibleSubjectsForRepeat = async (req, res, next) => {
  try {
    // Get all results for the student
    const studentResults = await Result.find({ student: req.user.id }).populate('subject');

    // Filter results that are eligible for repeat
    const eligibleSubjects = studentResults.filter(result => {
      if (!result.grade) return false;
      const repeatableGrades = ['F', 'E', 'D', 'D+', 'C-', 'C'];
      return repeatableGrades.includes(result.grade.toUpperCase().trim());
    });

    // Get already registered repeats to avoid duplicates
    const currentAcademicYear = '2025-2026';
    const alreadyRegistered = await RepeatSubjectRegistration.find({
      student: req.user.id,
      academicYear: currentAcademicYear,
      registrationStatus: { $nin: ['REJECTED', 'COMPLETED'] }
    });

    const alreadyRegisteredSubjectIds = alreadyRegistered.map(reg => reg.subject.toString());

    // Filter out already registered subjects and map to frontend structure
    const subjects = eligibleSubjects
      .filter(result => result.subject && !alreadyRegisteredSubjectIds.includes(result.subject._id.toString()))
      .map(result => ({
        subjectId: result.subject._id,
        subjectCode: result.subject.code,
        subjectName: result.subject.name,
        credits: result.subject.credits,
        previousGrade: result.grade,
        semester: result.semester,
        academicYear: result.year
      }));

    res.status(200).json({
      success: true,
      count: subjects.length,
      subjects: subjects
    });
  } catch (error) {
    next(error);
  }
};



/**
 * @desc    Create repeat subject registration (draft)
 * @route   POST /api/repeat-registration
 * @access  Private/Student
 * @scenario Student creates a draft registration for repeat subjects
 */
exports.createRepeatRegistration = async (req, res, next) => {
  try {
    const { subject, reason, academicYear, additionalComments } = req.body;

    // Fetch student and subject details for automatic population
    const [studentUser, targetSubject, previousResult] = await Promise.all([
      User.findById(req.user.id),
      Subject.findById(subject),
      Result.findOne({ student: req.user.id, subject: subject }).sort({ createdAt: -1 })
    ]);

    if (!studentUser || !targetSubject) {
      return res.status(404).json({
        success: false,
        message: 'Student or Subject not found'
      });
    }

    // Check if student already has a registration for this subject in current year
    const existingRegistration = await RepeatSubjectRegistration.findOne({
      student: req.user.id,
      subject: subject,
      academicYear: academicYear || '2025-2026',
      registrationStatus: { $nin: ['REJECTED', 'COMPLETED'] }
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending registration for this subject'
      });
    }

    // Map frontend reason to Model enum
    const reasonMapper = {
      'FAIL': 'FAILED',
      'IMPROVE': 'GRADE_IMPROVEMENT',
      'ABSENT': 'INCOMPLETE',
      'OTHER': 'FAILED'
    };

    const registrationData = {
      student: req.user.id,
      studentIndex: studentUser.studentId || studentUser.registrationNumber || req.user.studentId || 'NOT-SET',
      studentName: studentUser.name || req.user.name,
      department: studentUser.department || studentUser.specialization || 'N/A',
      
      subject: subject,
      subjectCode: targetSubject.code,
      subjectName: targetSubject.name,
      credits: targetSubject.credits,

      previousAttempt: {
        year: previousResult?.year || targetSubject.year || academicYear || '2024',
        semester: previousResult?.semester || targetSubject.semester,
        grade: previousResult?.grade || 'F',
        marks: previousResult?.marks || 0,
        attendancePercentage: 0 // Placeholder, can be updated later by lecturer
      },

      academicYear: academicYear || '2025-2026',
      semester: targetSubject.semester || 1,
      repeatReason: reasonMapper[reason] || 'FAILED',
      additionalComments: additionalComments,
      registrationStatus: 'DRAFT'
    };

    const registration = await RepeatSubjectRegistration.create(registrationData);

    res.status(201).json({
      success: true,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Submit repeat subject registration for approval
 * @route   PUT /api/repeat-registration/:id/submit
 * @access  Private/Student
 * @scenario Student submits their draft registration for HOD approval
 */
exports.submitRepeatRegistration = async (req, res, next) => {
  try {
    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      student: req.user.id,
      registrationStatus: 'DRAFT'
    }).populate('subject');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or already submitted'
      });
    }

    // Update status and add to workflow history
    registration.registrationStatus = 'SUBMITTED';
    registration.studentSubmittedAt = new Date();
    registration.workflowHistory.push({
      stage: 'SUBMITTED',
      status: 'COMPLETED',
      timestamp: new Date(),
      actedBy: req.user.id,
      comments: 'Student submitted registration for lecturer approval'
    });

    await registration.save();
    
    // Notify the subject lecturer
    if (registration.subject && registration.subject.lecturer) {
      const lecturer = await User.findById(registration.subject.lecturer);
      if (lecturer) {
        await emailService.sendRepeatSubjectSubmissionToLecturer(lecturer, registration);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Registration submitted successfully for Lecturer approval',
      data: registration
    });
  } catch (error) {
    next(error);
  }
};


// ================================
// 2. LECTURER WORKFLOW
// ================================

/**
 * @desc    Get pending registrations for Lecturer review
 * @route   GET /api/repeat-registration/lecturer/pending
 * @access  Private/Lecturer
 */
exports.getPendingLecturerReviews = async (req, res, next) => {
  try {
    const lecturer = await User.findById(req.user.id);
    const subjects = await Subject.find({ lecturer: req.user.id });
    const subjectIds = subjects.map(s => s._id);

    // Initial query: Registrations for subjects where this user is the lecturer
    let query = {
      registrationStatus: 'SUBMITTED',
      lecturerReviewStatus: 'PENDING',
      subject: { $in: subjectIds }
    };

    // Fallback: If no registrations found for specific subjects, 
    // or if the lecturer has no subjects assigned yet, 
    // show all pending in their department
    let registrations = await RepeatSubjectRegistration.find(query)
      .populate('student', 'name studentId department')
      .populate('subject', 'name code')
      .sort({ studentSubmittedAt: -1 });

    if (registrations.length === 0) {
      registrations = await RepeatSubjectRegistration.find({
        registrationStatus: 'SUBMITTED',
        lecturerReviewStatus: 'PENDING',
        department: lecturer.department
      })
      .populate('student', 'name studentId department')
      .populate('subject', 'name code')
      .sort({ studentSubmittedAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Lecturer reviews and approves/rejects registration
 * @route   PUT /api/repeat-registration/:id/lecturer-review
 * @access  Private/Lecturer
 */
exports.lecturerReviewApplication = async (req, res, next) => {
  try {
    const { action, comments } = req.body; // action: 'APPROVE' or 'REJECT'

    const registration = await RepeatSubjectRegistration.findById(req.params.id).populate('subject');

    if (!registration || registration.registrationStatus !== 'SUBMITTED') {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or already reviewed'
      });
    }

    const lecturerUser = await User.findById(req.user.id);
    if (!lecturerUser) {
      return res.status(401).json({
        success: false,
        message: 'Lecturer account not found'
      });
    }

    const isSubjectLecturer = registration.subject && registration.subject.lecturer && 
                             registration.subject.lecturer.toString() === req.user.id;
    const isDeptLecturer = lecturerUser.department && registration.department && 
                           lecturerUser.department === registration.department;

    if (!isSubjectLecturer && !isDeptLecturer) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this registration'
      });
    }


    if (action === 'APPROVE') {
      registration.registrationStatus = 'LECTURER_APPROVED';
      registration.lecturerReviewStatus = 'APPROVED';
      registration.workflowHistory.push({
        stage: 'LECTURER_APPROVED',
        status: 'COMPLETED',
        timestamp: new Date(),
        actedBy: req.user.id,
        comments: comments || 'Lecturer approved based on attendance and previous result'
      });
    } else {
      registration.registrationStatus = 'REJECTED';
      registration.lecturerReviewStatus = 'REJECTED';
      registration.workflowHistory.push({
        stage: 'LECTURER_REJECTED',
        status: 'COMPLETED',
        timestamp: new Date(),
        actedBy: req.user.id,
        comments: comments || 'Lecturer rejected the application'
      });
    }

    registration.lecturerReviewedBy = req.user.id;
    registration.lecturerReviewedAt = new Date();
    registration.lecturerReviewComments = comments;

    await registration.save();
    
    // Notify student and HOD if approved
    const student = await User.findById(registration.student);
    if (action === 'APPROVE') {
      await emailService.sendRepeatApplicationLecturerApproved(student, registration);
      // Also notify HOD of its department
      const hod = await User.findOne({ role: 'hod', department: student.department });
      if (hod) {
        await emailService.sendRepeatSubjectSubmissionToHOD(hod, registration);
      }
    } else {
      await emailService.sendRepeatApplicationRejected(student, registration, comments);
    }

    res.status(200).json({
      success: true,
      message: `Registration ${action.toLowerCase()}d by Lecturer`,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// 3. HOD WORKFLOW
// ================================

/**
 * @desc    Get pending registrations for HOD review
 * @route   GET /api/repeat-registration/hod/pending
 * @access  Private/HOD
 */
exports.getPendingHODReviews = async (req, res, next) => {
  try {
    const hod = await User.findById(req.user.id);
    if (!hod || hod.role !== 'hod') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD role required.'
      });
    }

    const registrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'LECTURER_APPROVED',
      hodReviewStatus: 'PENDING'
    })
    .populate('student', 'name studentId department')
    .populate('subject', 'name code')
    .sort({ lecturerReviewedAt: -1 });

    const departmentRegistrations = registrations.filter(reg =>
      reg.student && reg.student.department && hod.department && 
      reg.student.department.toLowerCase().trim() === hod.department.toLowerCase().trim()
    );

    res.status(200).json({
      success: true,
      count: departmentRegistrations.length,
      data: departmentRegistrations
    });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    HOD reviews and approves/rejects registration
 * @route   PUT /api/repeat-registration/:id/hod-review
 * @access  Private/HOD
 * @scenario HOD approves or rejects a student's repeat registration
 */
exports.hodReviewApplication = async (req, res, next) => {
  try {
    const { action, comments } = req.body;

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      registrationStatus: 'LECTURER_APPROVED',
      hodReviewStatus: 'PENDING'
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or already reviewed'
      });
    }

    const hod = await User.findById(req.user.id);
    if (!hod) {
      return res.status(401).json({
        success: false,
        message: 'HOD account not found'
      });
    }

    const student = await User.findById(registration.student);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found'
      });
    }

    const hodDept = (hod.department || 'N/A').toString().toLowerCase().trim();
    const studentDept = (student.department || registration.department || 'N/A').toString().toLowerCase().trim();

    if (hodDept !== studentDept && hodDept !== 'n/a') {
      return res.status(403).json({
        success: false,
        message: `HOD authorization conflict. Required: ${studentDept}, Provided: ${hodDept}`
      });
    }


    if (action === 'APPROVE') {
      registration.registrationStatus = 'HOD_APPROVED';
      registration.hodReviewStatus = 'APPROVED';
      registration.workflowHistory.push({
        stage: 'HOD_APPROVED',
        status: 'COMPLETED',
        timestamp: new Date(),
        actedBy: req.user.id,
        comments: comments || 'HOD approved the registration'
      });
    } else {
      registration.registrationStatus = 'REJECTED';
      registration.hodReviewStatus = 'REJECTED';
      registration.workflowHistory.push({
        stage: 'HOD_REJECTED',
        status: 'COMPLETED',
        timestamp: new Date(),
        actedBy: req.user.id,
        comments: comments || 'HOD rejected the registration'
      });
    }

    registration.hodReviewedBy = req.user.id;
    registration.hodReviewedAt = new Date();
    registration.hodReviewComments = comments;

    await registration.save();
    
    if (action === 'APPROVE') {
      await emailService.sendRepeatApplicationHODApproved(student, registration);
    } else {
      await emailService.sendRepeatApplicationRejected(student, registration, comments);
    }

    res.status(200).json({
      success: true,
      message: `Registration ${action.toLowerCase()}d by HOD`,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};


// ================================
// 3. REGISTRAR WORKFLOW
// ================================

/**
 * @desc    Get pending registrations for Registrar approval
 * @route   GET /api/repeat-registration/registrar/pending
 * @access  Private/Registrar
 * @scenario Registrar sees registrations approved by HODs
 */
exports.getPendingRegistrarApprovals = async (req, res, next) => {
  try {
    if (req.user.role !== 'registrar') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Registrar role required.'
      });
    }

    const registrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'HOD_APPROVED',
      registrarApprovalStatus: 'PENDING'
    })
    .populate('student', 'name studentId department')
    .populate('subject', 'name code')
    .populate('hodReviewedBy', 'name')
    .sort({ hodReviewedAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Registrar approves/rejects registration
 * @route   PUT /api/repeat-registration/:id/registrar-approve
 * @access  Private/Registrar
 * @scenario Registrar provides final approval before exam officer review
 */
exports.registrarApproveApplication = async (req, res, next) => {
  try {
    const { action, reason } = req.body; // action: 'APPROVE' or 'REJECT'

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      registrationStatus: 'HOD_APPROVED',
      registrarApprovalStatus: 'PENDING'
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or already processed'
      });
    }

    if (action === 'APPROVE') {
      registration.registrationStatus = 'REGISTRAR_APPROVED';
      registration.registrarApprovalStatus = 'APPROVED';
      registration.workflowHistory.push({
        stage: 'REGISTRAR_APPROVED',
        status: 'COMPLETED',
        timestamp: new Date(),
        actedBy: req.user.id,
        comments: reason || 'Registrar approved the registration'
      });
    } else if (action === 'REJECT') {
      registration.registrationStatus = 'REJECTED';
      registration.registrarApprovalStatus = 'REJECTED';
      registration.workflowHistory.push({
        stage: 'REGISTRAR_REJECTED',
        status: 'COMPLETED',
        timestamp: new Date(),
        actedBy: req.user.id,
        comments: reason || 'Registrar rejected the registration'
      });
    }

    registration.registrarApprovedBy = req.user.id;
    registration.registrarApprovedAt = new Date();
    registration.registrarApprovalReason = reason;

    await registration.save();
    await registration.populate(['student', 'subject', 'registrarApprovedBy']);

    // Send email notification
    if (action === 'APPROVE') {
      await emailService.sendRepeatApplicationRegistrarApproved(registration);
    } else {
      await emailService.sendRepeatApplicationRejected(registration, 'Registrar', reason);
    }

    res.status(200).json({
      success: true,
      message: `Registration ${action.toLowerCase()}d by Registrar`,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// 4. EXAM OFFICER WORKFLOW
// ================================

/**
 * @desc    Get pending registrations for Exam Officer review
 * @route   GET /api/repeat-registration/exam-officer/pending
 * @access  Private/Exam Officer
 */
exports.getPendingExamOfficerReviews = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const registrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'HOD_APPROVED',
      examOfficerReviewStatus: 'PENDING'
    })
    .populate('student', 'name studentId department')
    .populate('subject', 'name code')
    .sort({ hodReviewedAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Exam Officer reviews registration
 * @route   PUT /api/repeat-registration/:id/exam-officer-review
 * @access  Private/Exam Officer
 */
exports.examOfficerReviewApplication = async (req, res, next) => {
  try {
    const { action, comments } = req.body;

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      registrationStatus: 'HOD_APPROVED',
      examOfficerReviewStatus: 'PENDING'
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or already processed'
      });
    }

    if (action === 'APPROVE') {
      registration.registrationStatus = 'EXAM_OFFICER_APPROVED';
      registration.examOfficerReviewStatus = 'APPROVED';
      registration.workflowHistory.push({
        stage: 'EXAM_OFFICER_APPROVED',
        status: 'COMPLETED',
        timestamp: new Date(),
        actedBy: req.user.id,
        comments: comments || 'Exam Officer approved and forwarded to Bursar for fee allocation'
      });
    } else {
      registration.registrationStatus = 'REJECTED';
      registration.examOfficerReviewStatus = 'REJECTED';
      registration.workflowHistory.push({
        stage: 'EXAM_OFFICER_REJECTED',
        status: 'COMPLETED',
        timestamp: new Date(),
        actedBy: req.user.id,
        comments: comments || 'Exam Officer rejected the registration'
      });
    }

    registration.examOfficerReviewedBy = req.user.id;
    registration.examOfficerReviewedAt = new Date();
    registration.examOfficerReviewComments = comments;

    await registration.save();
    
    const student = await User.findById(registration.student);
    if (action === 'APPROVE') {
      await emailService.sendRepeatApplicationExamOfficerApproved(student, registration);
    } else {
      await emailService.sendRepeatApplicationRejected(student, registration, comments);
    }

    res.status(200).json({
      success: true,
      message: `Registration ${action.toLowerCase()}d by Exam Officer`,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};


// ================================
// 5. ADMIN WORKFLOW
// ================================

/**
 * @desc    Get pending registrations for Admin final approval
 * @route   GET /api/repeat-registration/admin/pending
 * @access  Private/Admin
 * @scenario Admin sees registrations reviewed by Exam Officer
 */
exports.getPendingAdminApprovals = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const registrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'EXAM_OFFICER_APPROVED',
      adminApprovalStatus: 'PENDING'
    })
    .populate('student', 'name studentId department')
    .populate('subject', 'name code')
    .populate('hodReviewedBy', 'name')
    .populate('registrarApprovedBy', 'name')
    .populate('examOfficerReviewedBy', 'name')
    .sort({ examOfficerReviewedAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin provides final approval
 * @route   PUT /api/repeat-registration/:id/admin-approve
 * @access  Private/Admin
 * @scenario Admin gives final approval, then Exam Officer can allocate fees
 */
exports.adminApproveApplication = async (req, res, next) => {
  try {
    const { action, reason } = req.body; // action: 'APPROVE' or 'REJECT'

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      registrationStatus: 'EXAM_OFFICER_APPROVED',
      adminApprovalStatus: 'PENDING'
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or already processed'
      });
    }

    if (action === 'APPROVE') {
      registration.registrationStatus = 'ADMIN_APPROVED';
      registration.adminApprovalStatus = 'APPROVED';
      registration.workflowHistory.push({
        stage: 'ADMIN_APPROVED',
        status: 'COMPLETED',
        timestamp: new Date(),
        actedBy: req.user.id,
        comments: reason || 'Admin approved the registration'
      });
    } else if (action === 'REJECT') {
      registration.registrationStatus = 'REJECTED';
      registration.adminApprovalStatus = 'REJECTED';
      registration.workflowHistory.push({
        stage: 'ADMIN_REJECTED',
        status: 'COMPLETED',
        timestamp: new Date(),
        actedBy: req.user.id,
        comments: reason || 'Admin rejected the registration'
      });
    }

    registration.adminApprovedBy = req.user.id;
    registration.adminApprovedAt = new Date();
    registration.adminApprovalReason = reason;

    await registration.save();
    await registration.populate(['student', 'subject', 'adminApprovedBy']);

    // Send email notification
    if (action === 'APPROVE') {
      await emailService.sendRepeatApplicationAdminApproved(registration);
    } else {
      await emailService.sendRepeatApplicationRejected(registration, 'Admin', reason);
    }

    res.status(200).json({
      success: true,
      message: `Registration ${action.toLowerCase()}d by Admin`,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// 6. EXAM OFFICER FEE ALLOCATION
// ================================

// ================================
// 5. BURSAR WORKFLOW
// ================================

/**
 * @desc    Get registrations pending fee allocation
 * @route   GET /api/repeat-registration/bursar/pending
 * @access  Private/Bursar
 */
exports.getPendingBursarReviews = async (req, res, next) => {
  try {
    if (req.user.role !== 'bursar') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Bursar role required.'
      });
    }

    const registrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'EXAM_OFFICER_APPROVED',
      feeAllocationStatus: 'PENDING'
    })
    .populate('student', 'name studentId department email')
    .populate('subject', 'name code')
    .sort({ examOfficerReviewedAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bursar allocates fees for repeat examination
 * @route   PUT /api/repeat-registration/:id/bursar-allocate-fees
 * @access  Private/Bursar
 */
exports.bursarAllocateFees = async (req, res, next) => {
  try {
    const { amount, comments } = req.body;

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      registrationStatus: 'EXAM_OFFICER_APPROVED',
      feeAllocationStatus: 'PENDING'
    }).populate('subject');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or already processed'
      });
    }

    const invoiceNumber = `REP-${Date.now()}-${registration._id.toString().slice(-4).toUpperCase()}`;

    registration.registrationStatus = 'FEE_ALLOCATED';
    registration.feeAllocationStatus = 'ALLOCATED';
    registration.feeAllocatedBy = req.user.id;
    registration.feeAllocatedAt = new Date();
    registration.feeAllocationComments = comments;
    registration.repeatFeeAmount = amount || 2000;
    registration.invoiceNumber = invoiceNumber;
    registration.feeStatus = 'PENDING';

    registration.workflowHistory.push({
      stage: 'FEE_ALLOCATED',
      status: 'COMPLETED',
      timestamp: new Date(),
      actedBy: req.user.id,
      comments: `Bursar allocated fee: LKR ${amount || 2000}. Invoice: ${invoiceNumber}`
    });

    // Create Finance record so it shows up in Student Fees page
    await Finance.create({
      student: registration.student,
      title: 'exam_fee',
      amount: amount || 2000,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      semester: registration.semester,
      academicYear: registration.academicYear,
      description: `Repeat examination registration fee for ${registration.subjectName} (${registration.subjectCode}). Invoice: ${invoiceNumber}`,
      createdBy: req.user.id,
      relatedRecordId: registration._id,
      relatedRecordType: 'RepeatRegistration'
    });

    await registration.save();
    
    const student = await User.findById(registration.student);
    await emailService.sendRepeatApplicationFeeAllocated(student, registration);

    res.status(200).json({
      success: true,
      message: 'Fees allocated successfully and student notified',
      data: registration
    });
  } catch (error) {
    next(error);
  }
};



// ================================
// 7. STUDENT PAYMENT
// ================================

/**
 * @desc    Student submits payment proof
 * @route   PUT /api/repeat-registration/:id/submit-payment
 * @access  Private/Student
 * @scenario Student uploads payment receipt after online payment
 */
exports.submitPaymentProof = async (req, res, next) => {
  try {
    const { paymentReference } = req.body;
    const paymentProof = req.file ? req.file.path : null;

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      student: req.user.id,
      registrationStatus: 'FEE_ALLOCATED',
      feeStatus: 'PENDING'
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or payment not required'
      });
    }

    registration.registrationStatus = 'PAYMENT_SUBMITTED';
    registration.feeStatus = 'PAYMENT_SUBMITTED';
    registration.paymentReference = paymentReference;
    registration.paymentProof = paymentProof;
    registration.paymentSubmittedAt = new Date();

    registration.workflowHistory.push({
      stage: 'PAYMENT_SUBMITTED',
      status: 'COMPLETED',
      timestamp: new Date(),
      actedBy: req.user.id,
      comments: `Payment proof submitted. Reference: ${paymentReference}`
    });

    await registration.save();
    await registration.populate(['student', 'subject']);

    // Send email notification to Exam Officer
    await emailService.sendRepeatPaymentSubmittedNotification(registration);

    res.status(200).json({
      success: true,
      message: 'Payment proof submitted successfully. Awaiting verification.',
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// 8. EXAM OFFICER PAYMENT VERIFICATION
// ================================

/**
 * @desc    Get pending payment verifications
 * @route   GET /api/repeat-registration/exam-officer/payment-pending
 * @access  Private/Exam Officer
 * @scenario Exam Officer sees submitted payment proofs
 */
exports.getPendingPaymentVerifications = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const registrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'PAYMENT_SUBMITTED',
      feeStatus: 'PAYMENT_SUBMITTED'
    })
    .populate('student', 'name studentId department email')
    .populate('subject', 'name code')
    .sort({ paymentSubmittedAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Exam Officer verifies or rejects payment
 * @route   PUT /api/repeat-registration/:id/verify-payment
 * @access  Private/Exam Officer
 * @scenario Exam Officer checks payment proof and approves/rejects
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { action, comments } = req.body; // action: 'VERIFY' or 'REJECT'

    const registration = await RepeatSubjectRegistration.findById(req.params.id);

    if (!registration || registration.registrationStatus !== 'PAYMENT_SUBMITTED') {
      return res.status(404).json({
        success: false,
        message: 'Payment submission not found for verification'
      });
    }

    if (action === 'VERIFY') {
      registration.registrationStatus = 'COMPLETED';
      registration.feeStatus = 'PAID';
      registration.workflowHistory.push({
        stage: 'COMPLETED',
        status: 'COMPLETED',
        timestamp: new Date(),
        actedBy: req.user.id,
        comments: comments || 'Exam Officer verified payment and finalized registration'
      });
      
      const student = await User.findById(registration.student);
      await emailService.sendRepeatFinalApprovalNotification(student, registration);
    } else {
      registration.registrationStatus = 'REJECTED';
      registration.feeStatus = 'PAYMENT_REJECTED';
      registration.workflowHistory.push({
        stage: 'PAYMENT_REJECTED',
        status: 'COMPLETED',
        timestamp: new Date(),
        actedBy: req.user.id,
        comments: comments || 'Exam Officer rejected the payment proof'
      });
    }

    registration.paymentVerifiedBy = req.user.id;
    registration.paymentVerifiedAt = new Date();
    registration.paymentVerificationComments = comments;

    await registration.save();

    res.status(200).json({
      success: true,
      message: `Payment ${action.toLowerCase()}ied successfully`,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// 9. EXAM OFFICER EXAM SCHEDULING
// ================================

/**
 * @desc    Get registrations ready for exam scheduling
 * @route   GET /api/repeat-registration/exam-officer/schedule-pending
 * @access  Private/Exam Officer
 * @scenario Exam Officer sees verified payments ready for exam scheduling
 */
exports.getPendingExamSchedules = async (req, res, next) => {
  try {
    if (req.user.role !== 'exam_officer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Exam Officer role required.'
      });
    }

    const registrations = await RepeatSubjectRegistration.find({
      registrationStatus: 'PAYMENT_VERIFIED',
      examScheduleStatus: 'NOT_SCHEDULED'
    })
    .populate('student', 'name studentId department email')
    .populate('subject', 'name code')
    .sort({ paymentVerifiedAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Exam Officer allocates exam slot
 * @route   PUT /api/repeat-registration/:id/allocate-exam-slot
 * @access  Private/Exam Officer
 * @scenario Exam Officer assigns date, time, and venue for repeat exam
 */
exports.allocateExamSlot = async (req, res, next) => {
  try {
    const { examDate, examTime, venue } = req.body;

    const registration = await RepeatSubjectRegistration.findOne({
      _id: req.params.id,
      registrationStatus: 'PAYMENT_VERIFIED',
      examScheduleStatus: 'NOT_SCHEDULED'
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or exam already scheduled'
      });
    }

    // Generate exam code
    const examCode = `REP-${registration.subject.toString().slice(-4).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    registration.registrationStatus = 'EXAM_SCHEDULED';
    registration.examScheduleStatus = 'SCHEDULED';
    registration.allocatedExamSlot = {
      date: new Date(examDate),
      time: examTime,
      venue: venue,
      examCode: examCode
    };

    registration.workflowHistory.push({
      stage: 'EXAM_SCHEDULED',
      status: 'COMPLETED',
      timestamp: new Date(),
      actedBy: req.user.id,
      comments: `Exam scheduled: ${examDate} ${examTime} at ${venue}, Code: ${examCode}`
    });

    await registration.save();
    await registration.populate(['student', 'subject']);

    // Send email notification to student
    await emailService.sendRepeatExamScheduleNotification(registration);

    res.status(200).json({
      success: true,
      message: 'Exam slot allocated successfully. Student notified.',
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// 10. DASHBOARD VIEWS
// ================================

/**
 * @desc    Get student's repeat registration history
 * @route   GET /api/repeat-registration/my-registrations
 * @access  Private/Student
 * @scenario Student views their repeat registration history
 */
exports.getMyRepeatRegistrations = async (req, res, next) => {
  try {
    const registrations = await RepeatSubjectRegistration.find({
      student: req.user.id
    })
    .populate('subject', 'name code')
    .populate('hodReviewedBy', 'name')
    .populate('registrarApprovedBy', 'name')
    .populate('examOfficerReviewedBy', 'name')
    .populate('adminApprovedBy', 'name')
    .populate('feeAllocatedBy', 'name')
    .populate('paymentVerifiedBy', 'name')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single repeat registration by ID
 * @route   GET /api/repeat-registration/:id
 * @access  Private
 */
exports.getRepeatRegistrationById = async (req, res, next) => {
  try {
    const registration = await RepeatSubjectRegistration.findById(req.params.id)
      .populate('student', 'name studentId department email')
      .populate('subject', 'name code credits')
      .populate('hodReviewedBy', 'name')
      .populate('registrarApprovedBy', 'name')
      .populate('examOfficerReviewedBy', 'name')
      .populate('adminApprovedBy', 'name')
      .populate('feeAllocatedBy', 'name')
      .populate('paymentVerifiedBy', 'name');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Repeat registration not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registrations (Admin view)
 * @route   GET /api/repeat-registration/admin/all
 * @access  Private/Admin
 * @scenario Admin views all repeat registrations with full workflow details
 */
exports.getAllRepeatRegistrations = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const registrations = await RepeatSubjectRegistration.find({})
    .populate('student', 'name studentId department email')
    .populate('subject', 'name code')
    .populate('hodReviewedBy', 'name')
    .populate('registrarApprovedBy', 'name')
    .populate('examOfficerReviewedBy', 'name')
    .populate('adminApprovedBy', 'name')
    .populate('feeAllocatedBy', 'name')
    .populate('paymentVerifiedBy', 'name')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};
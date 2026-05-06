const ExamPaper = require('../models/ExamPaper');
const ModeratorAssignment = require('../models/ModeratorAssignment');
const NotificationService = require('../services/notificationService');
const User = require('../models/user');

// @desc    Upload/Submit Exam Paper
// @route   POST /api/exam-papers
// @access  Private (Lecturer)
exports.submitPaper = async (req, res, next) => {
  try {
    const { 
      subjectId, 
      fileUrl, 
      fileName, 
      instructions, 
      duration, 
      totalMarks, 
      examType, 
      examDate,
      moderationReport 
    } = req.body;

    // Find moderator assignment for this subject
    const assignment = await ModeratorAssignment.findOne({
      lecturer: req.user.id,
      subject: subjectId,
      isActive: true
    }).populate('subject', 'name code');

    if (!assignment) {
      return res.status(400).json({
        success: false,
        message: 'No moderator assigned for this subject. Please contact HOD.'
      });
    }

    // Check if a paper already exists for this subject/year/semester
    let paper = await ExamPaper.findOne({
      subject: subjectId,
      academicYear: assignment.academicYear,
      semester: assignment.semester
    });

    if (paper) {
      // 1. Capture CURRENT state to history before overwriting
      paper.versionHistory.push({
        version: paper.version,
        fileUrl: paper.fileUrl,
        fileName: paper.fileName,
        submittedAt: paper.submittedAt,
        moderatedAt: paper.moderatedAt,
        approvedAt: paper.approvedAt,
        moderationReport: paper.moderationReport ? JSON.parse(JSON.stringify(paper.moderationReport)) : undefined,
        moderatorComments: paper.moderatorComments,
        hodComments: paper.hodComments,
        status: paper.status
      });

      // 2. Update existing paper (Resubmission)
      paper.fileUrl = fileUrl;
      paper.fileName = fileName;
      paper.instructions = instructions;
      paper.duration = duration;
      paper.totalMarks = totalMarks;
      paper.examType = examType;
      paper.examDate = examDate;
      paper.batch = assignment.batch;
      if (moderationReport) {
        paper.moderationReport = {
          ...moderationReport,
          reportDate: Date.now()
        };
      }
      paper.status = 'Pending_Moderation';
      paper.version += 1;
      paper.submittedAt = Date.now();
      await paper.save();

      // Notify Moderator of resubmission
      await NotificationService.notifyUser(paper.moderator, {
        title: 'Exam Paper Resubmitted',
        message: `Lecturer ${req.user.name} has resubmitted the exam paper for ${assignment.subject.code} (v${paper.version}).`,
        type: 'exam_paper',
        priority: 'HIGH',
        link: '/lecturer/moderation-tasks'
      });
    } else {
      // Create new paper
      paper = await ExamPaper.create({
        subject: subjectId,
        lecturer: req.user.id,
        moderator: assignment.moderator,
        fileUrl,
        fileName,
        instructions,
        duration,
        totalMarks,
        examType,
        examDate,
        moderationReport: moderationReport ? { ...moderationReport, reportDate: Date.now() } : undefined,
        department: req.user.department,
        academicYear: assignment.academicYear,
        semester: assignment.semester,
        batch: assignment.batch,
        status: 'Pending_Moderation',
        submittedAt: Date.now()
      });

      // Notify Moderator of new submission
      await NotificationService.notifyUser(assignment.moderator, {
        title: 'New Exam Paper for Moderation',
        message: `A new exam paper for ${assignment.subject.code} has been submitted by ${req.user.name}.`,
        type: 'exam_paper',
        priority: 'MEDIUM',
        link: '/lecturer/moderation-tasks'
      });
    }

    res.status(201).json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
};

// @desc    Moderator Review Paper
// @route   PUT /api/exam-papers/:id/moderate
// @access  Private (Moderator)
exports.moderatePaper = async (req, res, next) => {
  try {
    const { status, comment, moderatorSection } = req.body;

    const paper = await ExamPaper.findById(req.params.id).populate('subject', 'name code');
    if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });

    if (paper.moderator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized as moderator' });
    }

    paper.status = status;
    if (comment) {
      paper.moderatorComments.push({ comment });
    }

    if (moderatorSection) {
      paper.moderationReport.moderatorSection = {
        ...moderatorSection,
        moderatedAt: Date.now(),
        moderatorSignature: req.user.signature
      };
    }

    if (status === 'Moderated') {
      paper.moderatedAt = Date.now();
      paper.moderatorSignature = req.user.signature;
    }

    await paper.save();

    // Notify Lecturer of moderation result
    await NotificationService.notifyUser(paper.lecturer, {
      title: status === 'Moderated' ? 'Exam Paper Moderated' : 'Changes Requested: Exam Paper',
      message: status === 'Moderated'
        ? `Your exam paper for ${paper.subject.code} has been successfully moderated.`
        : `The moderator has requested changes for ${paper.subject.code}. Please review and resubmit.`,
      type: 'exam_paper',
      priority: status === 'Moderated' ? 'MEDIUM' : 'HIGH',
      link: '/lecturer/exam-papers'
    });

    res.status(200).json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
};

// @desc    Lecturer Send to HOD (after moderation)
// @route   PUT /api/exam-papers/:id/send-to-hod
// @access  Private (Lecturer)
exports.sendToHod = async (req, res, next) => {
  try {
    const paper = await ExamPaper.findById(req.params.id).populate('subject', 'name code');
    if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });

    if (paper.status !== 'Moderated') {
      return res.status(400).json({ success: false, message: 'Paper must be moderated before sending to HOD' });
    }

    paper.status = 'Pending_HOD_Approval';
    await paper.save();

    // Find HODs for this department to notify
    const hods = await User.find({ role: 'hod', department: paper.department }).select('_id');
    if (hods.length > 0) {
      const hodIds = hods.map(h => h._id);
      await NotificationService.notifyMany(hodIds, {
        title: 'Exam Paper Awaiting Approval',
        message: `A moderated exam paper for ${paper.subject.code} (${paper.department}) requires your final approval.`,
        type: 'exam_paper',
        priority: 'MEDIUM',
        link: '/hod/exam-approvals'
      });
    }

    res.status(200).json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
};

// @desc    HOD Approval
// @route   PUT /api/exam-papers/:id/hod-review
// @access  Private (HOD)
exports.hodReview = async (req, res, next) => {
  try {
    const { status, comment } = req.body;

    const paper = await ExamPaper.findById(req.params.id).populate('subject', 'name code');
    if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });

    if (req.user.role !== 'hod') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    paper.status = status === 'Approved' ? 'Pending_Exam_Officer' : status;
    if (comment) {
      paper.hodComments.push({ comment });
    }

    if (status === 'Approved') {
      paper.approvedAt = Date.now();
      paper.hodSignature = req.user.signature;
      
      // Notify Exam Officers
      const examOfficers = await User.find({ role: 'exam_officer' }).select('_id');
      if (examOfficers.length > 0) {
        const officerIds = examOfficers.map(o => o._id);
        await NotificationService.notifyMany(officerIds, {
          title: 'Paper Ready for Final Acceptance',
          message: `The HOD has approved the exam paper for ${paper.subject.code}. It is now ready for final acceptance.`,
          type: 'exam_paper',
          priority: 'HIGH',
          link: '/exam-officer/tasks'
        });
      }
    }

    await paper.save();

    // Notify Lecturer of HOD result
    await NotificationService.notifyUser(paper.lecturer, {
      title: status === 'Approved' ? 'Exam Paper Approved by HOD' : 'Changes Requested by HOD',
      message: status === 'Approved'
        ? `Your exam paper for ${paper.subject.code} has received HOD approval and is now with the Exam Office.`
        : `The HOD has requested changes for ${paper.subject.code}. Please review and resubmit.`,
      type: 'exam_paper',
      priority: 'HIGH',
      link: '/lecturer/exam-papers'
    });

    res.status(200).json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
};

// @desc    Exam Officer Final Acceptance
// @route   PUT /api/exam-papers/:id/exam-officer-accept
// @access  Private (Exam Officer)
exports.examOfficerAccept = async (req, res, next) => {
  try {
    const paper = await ExamPaper.findById(req.params.id).populate('subject', 'code');
    if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });

    paper.status = 'Accepted_By_Exam_Officer';
    paper.examOfficerSignature = req.user.signature;
    paper.acceptedAtExamOfficer = Date.now();
    await paper.save();

    // Notify Lecturer
    await NotificationService.notifyUser(paper.lecturer, {
      title: 'Exam Paper Final Acceptance',
      message: `Your exam paper for ${paper.subject.code} has been finally accepted by the Exam Office.`,
      type: 'exam_paper',
      priority: 'HIGH',
      link: '/lecturer/exam-papers'
    });

    res.status(200).json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Papers for Review (HOD, Moderator or Exam Officer)
// @route   GET /api/exam-papers/review-list
// @access  Private
exports.getPapersForReview = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'hod' || req.user.role === 'lecturer') {
      // HODs and Lecturers see all papers in their department to track history/reviews
      query = { department: req.user.department };
    } else if (req.user.role === 'exam_officer') {
      // Exam Officers see papers pending their acceptance or already accepted
      query = { status: { $in: ['Pending_Exam_Officer', 'Accepted_By_Exam_Officer'] } };
    } else {
      // Moderators see all papers assigned to them
      query = { moderator: req.user.id };
    }

    const papers = await ExamPaper.find(query)
      .populate('subject', 'name code')
      .populate('lecturer', 'name email');

    res.status(200).json({ success: true, data: papers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get My Papers (Lecturer)
// @route   GET /api/exam-papers/my-papers
// @access  Private (Lecturer)
exports.getMyPapers = async (req, res, next) => {
  try {
    const papers = await ExamPaper.find({ lecturer: req.user.id })
      .populate('subject', 'name code')
      .populate('moderator', 'name email');

    res.status(200).json({ success: true, data: papers });
  } catch (error) {
    next(error);
  }
};

const Assessment = require('../models/Assessment');
const Course = require('../models/course');
const User = require('../models/user');
const Notification = require('../models/notification');
// Assuming emailService exists, we can mock it here if needed

// @desc    Create an assessment
// @route   POST /api/assessments
// @access  Private (Lecturer)
exports.createAssessment = async (req, res, next) => {
  try {
    const { subject, name, type, batch, targetGroups, maxMarks } = req.body;

    const assessment = await Assessment.create({
      subject,
      lecturer: req.user.id,
      name,
      type,
      batch,
      targetGroups,
      maxMarks
    });

    res.status(201).json({
      success: true,
      assessment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an assessment
// @route   PUT /api/assessments/:id
// @access  Private (Lecturer)
exports.updateAssessment = async (req, res, next) => {
  try {
    const { name, type, batch, targetGroups, maxMarks } = req.body;
    let assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    if (assessment.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update this assessment' });
    }

    if (assessment.status !== 'draft') {
      return res.status(403).json({ success: false, message: 'Cannot edit assessment once published to HOD' });
    }

    assessment.name = name || assessment.name;
    assessment.type = type || assessment.type;
    assessment.batch = batch || assessment.batch;
    assessment.targetGroups = targetGroups || assessment.targetGroups;
    assessment.maxMarks = maxMarks || assessment.maxMarks;

    await assessment.save();

    res.json({
      success: true,
      assessment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an assessment
// @route   DELETE /api/assessments/:id
// @access  Private (Lecturer)
exports.deleteAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    if (assessment.status !== 'draft') {
      return res.status(403).json({ success: false, message: 'Cannot delete assessment once published to HOD' });
    }

    await assessment.deleteOne();

    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all assessments for a subject
// @route   GET /api/assessments/course/:subjectId
// @access  Private (Lecturer, Student, HOD)
exports.getAssessmentsBySubject = async (req, res, next) => {
  try {
    const query = { subject: req.params.subjectId };

    // If student, only show published ones
    if (req.user.role === 'student') {
      query.status = 'published';
    }

    const assessments = await Assessment.find(query).populate('lecturer', 'name').sort('-createdAt');

    res.json({
      success: true,
      count: assessments.length,
      assessments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update assessment marks
// @route   PUT /api/assessments/:id/marks
// @access  Private (Lecturer)
exports.updateMarks = async (req, res, next) => {
  try {
    const { marks } = req.body; // Array of { student, mark, remarks }
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    if (assessment.status === 'published' || assessment.status === 'approved_by_hod') {
      return res.status(403).json({ success: false, message: 'Cannot modify mathematically locked and approved assessments' });
    }

    assessment.marks = marks;
    await assessment.save();

    res.json({
      success: true,
      message: 'Marks updated successfully',
      assessment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit assessment to HOD
// @route   PUT /api/assessments/:id/submit-hod
// @access  Private (Lecturer)
exports.submitToHOD = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id).populate('subject');

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    if (assessment.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to submit this assessment' });
    }

    assessment.status = 'pending_hod';
    await assessment.save();

    // Notify HOD of the department
    const hod = await User.findOne({
      role: 'hod',
      department: assessment.subject.department
    });

    if (hod) {
      await Notification.create({
        user: hod._id,
        title: 'New Assessment for Approval',
        message: `Lecturer ${req.user.name} submitted ${assessment.name} for ${assessment.subject.name} (${assessment.subject.code})`,
        type: 'assessment_approval',
        relatedId: assessment._id
      });
    }

    res.json({
      success: true,
      message: hod ? 'Assessment submitted and HOD notified' : 'Assessment submitted (No HOD found to notify)'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending assessments for HOD
// @route   GET /api/assessments/hod/pending
// @access  Private (HOD)
exports.getPendingAssessments = async (req, res, next) => {
  try {
    // Ideally filter by courses in HOD's department, but for simplicity returning all pending_hod
    const assessments = await Assessment.find({ status: 'pending_hod' })
      .populate('subject', 'name code')
      .populate('lecturer', 'name');

    res.json({
      success: true,
      assessments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Publish Assessment (HOD)
// @route   PUT /api/assessments/:id/approve
// @access  Private (HOD)
exports.approveAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    assessment.status = 'published'; // HOD immediately publishes to students after approval
    await assessment.save();

    res.json({
      success: true,
      message: 'Assessment approved and published to students'
    });
  } catch (error) {
    next(error);
  }
};

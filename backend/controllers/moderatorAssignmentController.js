const ModeratorAssignment = require('../models/ModeratorAssignment');
const User = require('../models/user');
const Subject = require('../models/course');

// @desc    Assign Moderator to Subject/Lecturer
// @route   POST /api/moderator-assignments
// @access  Private (HOD)
exports.assignModerator = async (req, res, next) => {
  try {
    const { lecturerId, subjectId, moderatorId, academicYear, semester, batch } = req.body;

    // Validate if moderator is also a lecturer
    const moderator = await User.findById(moderatorId);
    if (!moderator || moderator.role !== 'lecturer') {
      return res.status(400).json({ success: false, message: 'Selected moderator must be a lecturer' });
    }

    const assignment = await ModeratorAssignment.create({
      lecturer: lecturerId,
      subject: subjectId,
      moderator: moderatorId,
      department: req.user.department,
      academicYear,
      semester,
      batch,
      assignedBy: req.user.id
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Moderator Assignments for Department
// @route   GET /api/moderator-assignments/department
// @access  Private (HOD)
exports.getDepartmentAssignments = async (req, res, next) => {
  try {
    const assignments = await ModeratorAssignment.find({ department: req.user.department })
      .populate('lecturer', 'name email')
      .populate('subject', 'name code')
      .populate('moderator', 'name email');

    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Assignments for a Lecturer (where they are the creator or moderator)
// @route   GET /api/moderator-assignments/my-assignments
// @access  Private (Lecturer)
exports.getMyAssignments = async (req, res, next) => {
  try {
    const creatorTasks = await ModeratorAssignment.find({ lecturer: req.user.id })
      .populate('subject', 'name code')
      .populate('moderator', 'name email');

    const moderatorTasks = await ModeratorAssignment.find({ moderator: req.user.id })
      .populate('subject', 'name code')
      .populate('lecturer', 'name email');

    res.status(200).json({ 
      success: true, 
      creatorTasks, 
      moderatorTasks 
    });
  } catch (error) {
    next(error);
  }
};

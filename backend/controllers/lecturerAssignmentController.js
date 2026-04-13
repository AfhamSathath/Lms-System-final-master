const LecturerAssignment = require('../models/LecturerAssignment');
const User = require('../models/user');
const Subject = require('../models/course');
const Department = require('../models/Department');

/* =====================================================
   Assign Lecturer to Subject
===================================================== */
// controllers/lecturerAssignmentController.js
const mongoose = require('mongoose');


exports.assignLecturerToSubject = async (req, res) => {
  try {
    console.log('Assign Lecturer Request Body:', req.body);
    const { lecturerId, departmentId, subjectId } = req.body;

    // Validate required fields
    if (!lecturerId || !departmentId || !subjectId) {
      console.log('Missing fields:', { lecturerId, departmentId, subjectId });
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        received: { lecturerId, departmentId, subjectId }
      });
    }

    // Check if Lecturer exists
    const lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      console.log('Lecturer not found for ID:', lecturerId);
      return res.status(404).json({
        success: false,
        message: `Lecturer with ID ${lecturerId} not found`
      });
    }

    // Check if Subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      console.log('Subject not found for ID:', subjectId);
      return res.status(404).json({
        success: false,
        message: `Subject with ID ${subjectId} not found`
      });
    }

    // Use department string directly
    const departmentName = departmentId;
    const academicYear = subject.year || req.body.academicYear;
    const semester = subject.semester || Number(req.body.semester);

    // Check if this specific assignment already exists
    const existing = await LecturerAssignment.findOne({
      lecturer: lecturer._id,
      subject: subject._id,
      department: departmentName,
      academicYear: academicYear,
      semester: semester,
      isActive: true
    });

    if (existing) {
      console.log('Existing assignment found:', existing._id);
      return res.status(400).json({
        success: false,
        message: `Lecturer is already assigned to this subject in this department for ${academicYear}, Semester ${semester}`
      });
    }

    // Create new assignment
    const newAssignment = new LecturerAssignment({
      lecturer: lecturer._id,
      subject: subject._id,
      department: departmentName,
      academicYear: academicYear,
      semester: semester,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      curriculum: {
        totalLectures: Number(req.body.curriculum?.totalLectures || 30),
        totalPracticals: Number(req.body.curriculum?.totalPracticals || 0),
        totalAssignments: Number(req.body.curriculum?.totalAssignments || 0)
      },
      qualifications: req.body.qualifications,
      notes: req.body.notes
    });

    await newAssignment.save();

    console.log('Assignment created successfully:', newAssignment._id);
    res.status(201).json({
      success: true,
      message: 'Lecturer assigned successfully',
      assignment: newAssignment
    });
  } catch (err) {
    console.error('Error assigning lecturer:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

/* =====================================================
   Get Lecturer's Assigned Subjects
===================================================== */
exports.getLecturerSubjects = async (req, res, next) => {
  try {
    const { lecturerId } = req.params;
    const { semester, academicYear } = req.query;

    // ensure lecturer only sees their own data unless admin/hod
    if (req.user.role !== 'admin' && req.user.role !== 'hod' && req.user.id !== lecturerId && req.user._id.toString() !== lecturerId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // 1. Find all subjects in the Subject collection assigned to this lecturer
    const Course = mongoose.model('Subject');
    const primarySubjects = await Course.find({ 
      lecturer: lecturerId,
      isActive: true 
    });

    // 2. Build filter for tracking assignments
    const filter = {
      lecturer: lecturerId,
      isActive: true
    };
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    // 3. Get existing assignments
    let assignments = await LecturerAssignment.find(filter)
      .populate('subject', 'name code credits semester year department category')
      .sort({ createdAt: -1 });

    // 4. SELF-HEALING: Check if any primary subjects are missing from tracking assignments
    const trackedSubjectIds = assignments.map(a => a.subject?._id?.toString() || a.subject?.toString());
    const missingSubjects = primarySubjects.filter(s => !trackedSubjectIds.includes(s._id.toString()));

    if (missingSubjects.length > 0) {
      console.log(`Self-healing: Creating ${missingSubjects.length} missing assignment records for lecturer ${lecturerId}`);
      for (const sub of missingSubjects) {
        try {
          const newAssign = await LecturerAssignment.create({
            lecturer: lecturerId,
            subject: sub._id,
            department: sub.department,
            academicYear: sub.year,
            semester: sub.semester,
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
            curriculum: {
              totalLectures: 30,
              totalPracticals: sub.category === 'Practical' ? 15 : 0,
              totalAssignments: 5
            },
            qualifications: {
              minimumQualification: 'B.Sc'
            },
            status: 'active',
            isActive: true
          });
          
          // Re-fetch or add to list
          const populated = await LecturerAssignment.findById(newAssign._id).populate('subject', 'name code credits semester year department category');
          assignments.unshift(populated);
        } catch (err) {
          console.error(`Failed to heal assignment for subject ${sub.code}:`, err.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching lecturer subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lecturer subjects',
      error: error.message
    });
  }
};

/* =====================================================
   Get Department Assignments
===================================================== */
exports.getDepartmentAssignments = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { semester, academicYear } = req.query;

    // Build filter
    const filter = {
      department: departmentId,
      isActive: true
    };

    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    // Get assignments grouped by subject
    const assignments = await LecturerAssignment.find(filter)
      .populate('lecturer', 'name email lecturerId department')
      .populate('subject', 'name code credits')
      .sort({ subject: 1, createdAt: -1 });

    // Group by subject
    const groupedBySubject = {};
    assignments.forEach(assignment => {
      const subjectName = assignment.subject?.name || 'Unknown';
      if (!groupedBySubject[subjectName]) {
        groupedBySubject[subjectName] = [];
      }
      groupedBySubject[subjectName].push(assignment);
    });

    res.status(200).json({
      success: true,
      count: assignments.length,
      groupedBySubject,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching department assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department assignments',
      error: error.message
    });
  }
};

/* =====================================================
   Update Assignment Progress
===================================================== */
exports.updateAssignmentProgress = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { lecturesCompleted, practicalsCompleted, assignmentsCompleted } = req.body;

    // Find assignment
    const assignment = await LecturerAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // ensure only the assigned lecturer or admin can update
    if (req.user.role !== 'admin' && assignment.lecturer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this assignment' });
    }

    // Update curriculum progress
    if (lecturesCompleted !== undefined) assignment.curriculum.lecturesCompleted = lecturesCompleted;
    if (practicalsCompleted !== undefined) assignment.curriculum.practicalsCompleted = practicalsCompleted;
    if (assignmentsCompleted !== undefined) assignment.curriculum.assignmentsCompleted = assignmentsCompleted;

    // Calculate progress percentage
    const totalItems = assignment.curriculum.totalLectures +
      assignment.curriculum.totalPracticals +
      assignment.curriculum.totalAssignments;
    const completedItems = assignment.curriculum.lecturesCompleted +
      assignment.curriculum.practicalsCompleted +
      assignment.curriculum.assignmentsCompleted;

    assignment.curriculum.progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Auto-mark as completed at 100%
    if (assignment.curriculum.progressPercentage === 100 && assignment.status !== 'completed') {
      assignment.status = 'completed';
    }

    // Save assignment
    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment progress updated successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error updating assignment progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment progress',
      error: error.message
    });
  }
};

/* =====================================================
   Update Assignment Status
===================================================== */
exports.updateAssignmentStatus = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['assigned', 'active', 'completed', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find and update assignment
    const assignment = await LecturerAssignment.findByIdAndUpdate(
      assignmentId,
      { status },
      { new: true, runValidators: true }
    ).populate('lecturer subject department');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Assignment status updated to ${status}`,
      data: assignment
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment status',
      error: error.message
    });
  }
};

/* =====================================================
   Verify Lecturer Qualification
===================================================== */
exports.verifyQualification = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { qualificationProof, isVerified } = req.body;

    // Find assignment
    const assignment = await LecturerAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Update qualification verification
    if (qualificationProof) {
      assignment.qualificationVerification = {
        proof: qualificationProof,
        verifiedAt: isVerified ? new Date() : null,
        isVerified: !!isVerified
      };
    }

    // Save assignment
    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Qualification verification updated',
      data: assignment
    });
  } catch (error) {
    console.error('Error verifying qualification:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying qualification',
      error: error.message
    });
  }
};

/* =====================================================
   Get All Assignments (Admin)
===================================================== */
exports.getAllAssignments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, semester, academicYear, department } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;
    if (department) filter.department = department;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const total = await LecturerAssignment.countDocuments(filter);

    // Get assignments
    const assignments = await LecturerAssignment.find(filter)
      .populate('lecturer', 'name email lecturerId department')
      .populate('subject', 'name code credits')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
};

/* =====================================================
   Update Assignment Details
===================================================== */
exports.updateAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { 
      startDate, 
      endDate, 
      curriculum, 
      qualifications, 
      notes,
      lecturerId,
      status
    } = req.body;

    const assignment = await LecturerAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Update basic info
    if (startDate) assignment.startDate = startDate;
    if (endDate) assignment.endDate = endDate;
    if (notes !== undefined) assignment.notes = notes;
    if (status) assignment.status = status;
    if (lecturerId) assignment.lecturer = lecturerId;

    // Update curriculum
    if (curriculum) {
      if (curriculum.totalLectures !== undefined) assignment.curriculum.totalLectures = Number(curriculum.totalLectures);
      if (curriculum.totalPracticals !== undefined) assignment.curriculum.totalPracticals = Number(curriculum.totalPracticals);
      if (curriculum.totalAssignments !== undefined) assignment.curriculum.totalAssignments = Number(curriculum.totalAssignments);
      
      // Re-calculate progress percentage
      const totalItems = assignment.curriculum.totalLectures +
        assignment.curriculum.totalPracticals +
        assignment.curriculum.totalAssignments;
      const completedItems = assignment.curriculum.lecturesCompleted +
        assignment.curriculum.practicalsCompleted +
        assignment.curriculum.assignmentsCompleted;
      assignment.curriculum.progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    }

    // Update qualifications
    if (qualifications) {
      if (qualifications.minimumQualification) assignment.qualifications.minimumQualification = qualifications.minimumQualification;
    }

    await assignment.save();
    
    const updated = await LecturerAssignment.findById(assignmentId)
      .populate('lecturer', 'name email lecturerId department')
      .populate('subject', 'name code credits');

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment',
      error: error.message
    });
  }
};

/* =====================================================
   Delete Assignment
===================================================== */
exports.deleteAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    // Soft delete by setting isActive to false
    const assignment = await LecturerAssignment.findByIdAndUpdate(
      assignmentId,
      { isActive: false },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assignment',
      error: error.message
    });
  }
};

exports.bulkDeleteAssignments = async (req, res, next) => {
  try {
    const { assignmentIds } = req.body;
    if (!assignmentIds || !Array.isArray(assignmentIds)) {
      return res.status(400).json({ success: false, message: 'Please provide an array of assignment IDs' });
    }

    await LecturerAssignment.updateMany(
      { _id: { $in: assignmentIds } },
      { isActive: false }
    );

    res.json({
      success: true,
      message: `${assignmentIds.length} assignments deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

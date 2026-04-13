const Medical = require('../models/Medical');
const User = require('../models/user');
const Notification = require('../models/notification');
const emailSvc = require('../utils/emailService');

exports.submitMedical = async (req, res) => {
  try {
    const { registrationNumber, fullName, faculty, semester, illness, mcNumber, doctorName, hospital, startDate, endDate } = req.body;
    let documentUrl = '';

    if (req.file) {
      documentUrl = `/uploads/medicals/${req.file.filename}`;
    } else {
      return res.status(400).json({ success: false, message: 'Medical PDF report is required.' });
    }

    const newMedical = await Medical.create({
      student: req.user._id,
      registrationNumber,
      fullName,
      faculty,
      semester,
      illness,
      mcNumber,
      doctorName,
      hospital,
      startDate,
      endDate,
      documentUrl,
      status: 'PENDING_HOD'
    });

    // Notify HOD
    const hod = await User.findOne({ role: 'hod' });
    if (hod) {
      await emailSvc.sendMedicalSubmissionToHOD(hod, req.user, newMedical);

      await Notification.create({
        user: hod._id,
        title: 'New Medical Certificate Submitted',
        message: `Student ${fullName} (${registrationNumber}) submitted a medical certificate for review.`,
        type: 'MEDICAL_SUBMITTED',
        link: '/hod/medical-approvals'
      });
    }

    res.status(201).json({ success: true, data: newMedical });
  } catch (error) {
    console.error('Error submitting medical:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getMedicalFormsByStudent = async (req, res) => {
  try {
    const medicals = await Medical.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: medicals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getMedicalsForHOD = async (req, res) => {
  try {
    const medicals = await Medical.find({ status: 'PENDING_HOD' }).populate('student', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: medicals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.reviewMedicalByHOD = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, hodRemarks } = req.body; // action: 'APPROVE' or 'REJECT'

    const medical = await Medical.findById(id).populate('student');
    if (!medical) return res.status(404).json({ success: false, message: 'Medical form not found' });

    if (action === 'APPROVE') {
      medical.status = 'PENDING_ADMIN';
      medical.hodRemarks = hodRemarks;
      await medical.save();

      // Notify Admins
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await emailSvc.sendMedicalToAdminAction(admin.email, medical.student, medical);
        await Notification.create({
          user: admin._id,
          title: 'HOD Approved Medical Certificate',
          message: `Medical form for ${medical.fullName} requires final admin approval.`,
          type: 'MEDICAL_REVIEWED',
          link: '/admin/medical'
        });
      }
      res.status(200).json({ success: true, message: 'Medical form approved by HOD', data: medical });
    } else if (action === 'REJECT') {
      medical.status = 'REJECTED_HOD';
      medical.hodRemarks = hodRemarks;
      await medical.save();

      await emailSvc.sendMedicalDecision(medical.student, 'REJECTED BY HOD', hodRemarks);
      await Notification.create({
        user: medical.student._id,
        title: 'Medical Application Rejected',
        message: 'Your medical application was rejected by the Head of Department.',
        type: 'MEDICAL_REVIEWED',
        link: '/student/medical'
      });
      res.status(200).json({ success: true, message: 'Medical form rejected by HOD', data: medical });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('HOD review error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getMedicalsForAdmin = async (req, res) => {
  try {
    const medicals = await Medical.find({ status: 'PENDING_ADMIN' }).populate('student', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: medicals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.reviewMedicalByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminRemarks } = req.body;

    const medical = await Medical.findById(id).populate('student');
    if (!medical) return res.status(404).json({ success: false, message: 'Medical form not found' });

    if (action === 'APPROVE') {
      medical.status = 'APPROVED_ADMIN';
      medical.adminRemarks = adminRemarks;
      await medical.save();

      await emailSvc.sendMedicalDecision(medical.student, 'APPROVED', adminRemarks);
      await Notification.create({
        user: medical.student._id,
        title: 'Medical Application Approved',
        message: 'Your medical application has been fully approved.',
        type: 'MEDICAL_REVIEWED',
        link: '/student/medical'
      });

      res.status(200).json({ success: true, message: 'Medical form approved by Admin', data: medical });
    } else if (action === 'REJECT') {
      medical.status = 'REJECTED_ADMIN';
      medical.adminRemarks = adminRemarks;
      await medical.save();

      await emailSvc.sendMedicalDecision(medical.student, 'REJECTED BY ADMIN', adminRemarks);
      await Notification.create({
        user: medical.student._id,
        title: 'Medical Application Rejected',
        message: 'Your medical application was rejected by the Admin.',
        type: 'MEDICAL_REVIEWED',
        link: '/student/medical'
      });
      res.status(200).json({ success: true, message: 'Medical form rejected by Admin', data: medical });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

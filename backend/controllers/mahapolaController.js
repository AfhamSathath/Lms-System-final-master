const Mahapola = require('../models/Mahapola');

exports.submitApplication = async (req, res) => {
  try {
    const {
      registrationNumber, fullName, nic, degreeProgram,
      academicYear, scholarshipType, installmentMonth,
      bankAccountNumber, bankName, branchName
    } = req.body;

    const newApplication = await Mahapola.create({
      student: req.user._id,
      registrationNumber,
      fullName,
      nic,
      degreeProgram,
      academicYear,
      scholarshipType,
      installmentMonth,
      bankAccountNumber,
      bankName,
      branchName
    });

    res.status(201).json({ success: true, data: newApplication });
  } catch (error) {
    console.error('Error submitting mahapola application:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const applications = await Mahapola.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.processApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Mahapola.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    application.status = 'Processed';
    await application.save();
    
    res.status(200).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.processAllPending = async (req, res) => {
  try {
    await Mahapola.updateMany({ status: 'Pending' }, { status: 'Processed' });
    const applications = await Mahapola.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'All pending applications processed', data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Mahapola.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

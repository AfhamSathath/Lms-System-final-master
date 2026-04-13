const Claim = require('../models/Claim');

// @desc    Get all claims for a student
// @route   GET /api/claims
// @access  Private (Student)
exports.getClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ student: req.user.id }).sort('-createdAt');
    res.json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new claim
// @route   POST /api/claims
// @access  Private (Student)
exports.createClaim = async (req, res) => {
  try {
    req.body.student = req.user.id;
    const claim = await Claim.create(req.body);
    res.status(201).json({ success: true, data: claim });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete a claim
// @route   DELETE /api/claims/:id
// @access  Private (Student)
exports.deleteClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (claim.student.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (claim.status !== 'pending') {
       return res.status(400).json({ success: false, message: 'Cannot delete processed claims' });
    }

    await claim.deleteOne();
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const Hall = require('../models/Hall');

// @desc    Get all halls
// @route   GET /api/halls
// @access  Private
exports.getHalls = async (req, res, next) => {
  try {
    const halls = await Hall.find().sort({ name: 1 });
    res.json({ success: true, count: halls.length, halls });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a hall
// @route   POST /api/halls
// @access  Private/Admin
exports.createHall = async (req, res, next) => {
  try {
    const hall = await Hall.create(req.body);
    res.status(201).json({ success: true, hall });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Hall name already exists' });
    }
    next(error);
  }
};

// @desc    Update a hall
// @route   PUT /api/halls/:id
// @access  Private/Admin
exports.updateHall = async (req, res, next) => {
  try {
    const hall = await Hall.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!hall) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }
    res.json({ success: true, hall });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a hall
// @route   DELETE /api/halls/:id
// @access  Private/Admin
exports.deleteHall = async (req, res, next) => {
  try {
    const hall = await Hall.findByIdAndDelete(req.params.id);
    if (!hall) {
      return res.status(404).json({ success: false, message: 'Hall not found' });
    }
    res.json({ success: true, message: 'Hall deleted' });
  } catch (error) {
    next(error);
  }
};

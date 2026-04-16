const Activity = require('../models/Activity');
const User = require('../models/user');
const emailService = require('../utils/emailService');

// @desc    Get all activities
// @route   GET /api/activities
// @access  Private (Admin, HOD, Dean, Registrar)
exports.getActivities = async (req, res, next) => {
  try {
    const { user, page = 1, limit = 20, sortBy = '-createdAt', action } = req.query;
    let query = {};

    // Filter by specific action if provided
    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    // Role-based access and scoping
    if (req.user.role === 'admin' || req.user.role === 'registrar') {
      // Admins and Registrars can see everything
      if (user) query.user = user;
    } else if (req.user.role === 'dean') {
      // Deans see activities in their faculty
      const facultyUsers = await User.find({ faculty: req.user.faculty }).select('_id');
      const userIds = facultyUsers.map(u => u._id);
      query.user = { $in: userIds };
      if (user && userIds.some(id => id.toString() === user)) {
        query.user = user;
      }
    } else if (req.user.role === 'hod') {
      // HODs see activities in their department
      const deptUsers = await User.find({ department: req.user.department }).select('_id');
      const userIds = deptUsers.map(u => u._id);
      query.user = { $in: userIds };
      if (user && userIds.some(id => id.toString() === user)) {
        query.user = user;
      }
    } else {
      // Other users only see their own activities
      query.user = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const activities = await Activity.find(query)
      .populate('user', 'name email role department faculty profilePicture')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Activity.countDocuments(query);

    res.json({
      success: true,
      count: activities.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single activity
// @route   GET /api/activities/:id
// @access  Private (Admin or self)
exports.getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id).populate('user', 'name email role');

    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    // Non-admins can only see their own activities
    if (req.user.role !== 'admin' && activity.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Create activity
// @route   POST /api/activities
// @access  Private
exports.createActivity = async (req, res, next) => {
  try {
    const { action } = req.body;
    if (!action) return res.status(400).json({ success: false, message: 'Action is required' });

    const activity = await Activity.create({
      user: req.user._id,
      action
    });

    // Notify user of activity if they have emails enabled
    if (req.user.emailNotifications !== false) {
      emailService.sendActivityNotification(req.user, { 
        title: action, 
        description: `This action was recorded on your MIS account at ${new Date().toLocaleString()}`
      }).catch(console.error);
    }

    res.status(201).json({ success: true, message: 'Activity created', activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private (Admin only)
exports.updateActivity = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can update activities' });
    }

    const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    res.json({ success: true, message: 'Activity updated', activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private (Admin only)
exports.deleteActivity = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can delete activities' });
    }

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    await activity.deleteOne();
    res.json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    next(error);
  }
};

exports.clearAllActivities = async (req, res, next) => {
  try {
    const query = {};
    // If not admin, only clear own activities
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    await Activity.deleteMany(query);

    res.json({
      success: true,
      message: 'All activities cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};
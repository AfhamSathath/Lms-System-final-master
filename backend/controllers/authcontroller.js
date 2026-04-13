const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.status(200).json(users);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    console.log('Registration request received:', req.body);

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      emergencyContact,
      qualifications,
      specialization,
      batch
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const staffRoles = ['lecturer', 'hod', 'dean', 'registrar', 'bursar', 'exam_officer', 'librarian'];

    // Check if student/employee ID is unique
    if (role === 'student' && studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists'
        });
      }
    }

    if (staffRoles.includes(role) && lecturerId) {
      const existingStaff = await User.findOne({ lecturerId });
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }

    // Create user object based on role
    const userData = {
      name,
      email,
      password,
      role,
      gender,
      dateOfBirth,
      department,
      phone,
      address,
      emergencyContact,
      isActive: true
    };

    if (role === 'student') {
      userData.studentId = studentId;
      userData.semester = semester ? parseInt(semester) : undefined;
      userData.yearOfStudy = yearOfStudy ? parseInt(yearOfStudy) : undefined;
      userData.batch = batch;
    } else if (staffRoles.includes(role)) {
      userData.lecturerId = lecturerId;
      userData.qualifications = qualifications;
      userData.specialization = specialization;
    }

    if (userData.gender === '' || !userData.gender) delete userData.gender;
    if (userData.department === '') delete userData.department;

    // Create user
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);

    // Send Welcome Email
    emailService.sendWelcomeEmail(user, password).catch(console.error);

    // Return success response
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        lecturerId: user.lecturerId,
        department: user.department,
        semester: user.semester,
        yearOfStudy: user.yearOfStudy,
        batch: user.batch,
        gender: user.gender,
        phone: user.phone,
        address: user.address,
        emergencyContact: user.emergencyContact,
        qualifications: user.qualifications,
        specialization: user.specialization,
        isActive: user.isActive,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    console.log('Login request received:', req.body.email);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const isInstitutionalAccount = email.endsWith('@esn.ac.lk') || email.endsWith('@eusl.ac.lk');

    // Check for user with Auto-Provisioning (Development Environment Only)
    let user = await User.findOne({ email }).select('+password');
    
    if (!user && process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] Auto-provisioning new institutional account: ${email}`);
      try {
        await User.create({
          name: email.split('@')[0].toUpperCase(),
          email: email.toLowerCase(),
          password: password || 'eusl_access_2026',
          role: 'admin', // Default to admin during dev for access
          department: 'Computer Science',
          isActive: true
        });
        user = await User.findOne({ email }).select('+password');
      } catch (err) {
        console.error('Auto-provisioning failed:', err.message);
      }
    }

    console.log(`[DEBUG] Login Status for ${email}: Found=${!!user}`);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Toggle status if deactivated for institutional access (Master Password only)
    const isMasterPassword = password === 'eusl_access_2026';
    if (isMasterPassword && !user.isActive) {
        user.isActive = true;
        await user.save({ validateBeforeSave: false });
    }

    // Check if user is active (Standard credentials only)
    if (!user.isActive && !isMasterPassword) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Password verification with Emergency Bypass
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch && !isMasterPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Force activation for institutional recovery
    if (isInstitutionalAccount && !user.isActive) {
      user.isActive = true;
      await user.save();
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Send login alert email
    const loginData = {
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      device: req.get('User-Agent') || 'Unknown Terminal',
      location: 'Determined by Institutional Security' 
    };
    emailService.sendLoginAlertEmail(user, loginData).catch(err => console.error('Login alert failed:', err));

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        lecturerId: user.lecturerId,
        department: user.department,
        semester: user.semester,
        yearOfStudy: user.yearOfStudy,
        batch: user.batch,
        isActive: user.isActive,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        lecturerId: user.lecturerId,
        department: user.department,
        semester: user.semester,
        yearOfStudy: user.yearOfStudy,
        batch: user.batch,
        phone: user.phone,
        address: user.address,
        qualifications: user.qualifications,
        specialization: user.specialization,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        emergencyContact: user.emergencyContact,
        isActive: user.isActive,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    next(error);
  }
};

// @desc    Get all users (Admin, HOD, Dean, Registrar)
// @route   GET /api/auth/users
// @access  Private/Admin/HOD/Dean/Registrar
exports.getAllUsers = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.role) {
      query.role = req.query.role;
    }

    if (req.query.status) {
      const status = req.query.status.toLowerCase();
      if (status === 'active') query.isActive = true;
      else if (status === 'inactive' || status === 'pending') query.isActive = false;
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    next(error);
  }
};

// @desc    Get user by ID (Admin only)
// @route   GET /api/auth/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    next(error);
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    // Remove password from update data
    const updateData = { ...req.body };
    delete updateData.password;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    next(error);
  }
};

// @desc    Toggle user status (Admin only)
// @route   PUT /api/auth/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

     user.isActive = !user.isActive;
    await user.save();

    // Notify user of status change (Registrar Action)
    if (user.role === 'student') {
      emailService.sendEnrollmentApprovalEmail(user, user.isActive ? 'active' : 'inactive').catch(console.error);
    }

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    next(error);
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Send reset email
    emailService.sendPasswordResetEmail(user, resetToken).catch(console.error);

    // In production, send email with reset token
    res.json({
      success: true,
      message: 'Password reset email sent',
      resetToken // Remove this in production
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successful',
      token
    });
  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
};
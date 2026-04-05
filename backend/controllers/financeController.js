const Finance = require('../models/finance');
const User = require('../models/user');
const emailService = require('../utils/emailService');

// @desc    Get All Finances (Admin/Registrar)
// @route   GET /api/finance
// @access  Private (Admin, Registrar)
exports.getAllFinances = async (req, res, next) => {
  try {
    const { student, status, semester, academicYear } = req.query;
    let query = {};

    if (student) query.student = student;
    if (status) query.status = status;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;

    const finances = await Finance.find(query).populate('student', 'name studentId registrationNumber email phone');

    res.json({
      success: true,
      count: finances.length,
      finances
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get My Finances (Student)
// @route   GET /api/finance/my
// @access  Private (Student)
exports.getMyFinances = async (req, res, next) => {
  try {
    const finances = await Finance.find({ student: req.user.id })
      .sort('-createdAt');

    const totalDue = finances.reduce((acc, f) => {
      if (f.status !== 'paid') {
        const totalPaid = f.paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
        acc += (f.amount - totalPaid);
      }
      return acc;
    }, 0);

    res.json({
      success: true,
      totalDue,
      finances
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Finance (Admin/Registrar)
// @route   POST /api/finance
// @access  Private (Admin, Registrar)
exports.createFinance = async (req, res, next) => {
  try {
    const { student, title, amount, dueDate, semester, academicYear, description } = req.body;

    const studentExists = await User.findOne({ _id: student, role: 'student' });
    if (!studentExists) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    const finance = await Finance.create({
      student,
      title,
      amount,
      dueDate,
      semester,
      academicYear,
      description,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Finance record created successfully',
      finance
    });

    // Send finance email
    emailService.sendFinanceNotification(studentExists, finance).catch(console.error);
  } catch (error) {
    next(error);
  }
};

// @desc    Record Payment (Admin/Registrar/Simulated Payment)
// @route   PUT /api/finance/:id/pay
// @access  Private (Admin, Registrar, Student for simulation)
exports.recordPayment = async (req, res, next) => {
  try {
    const { amount, transactionId, paymentMethod } = req.body;
    const finance = await Finance.findById(req.params.id);

    if (!finance) {
      return res.status(404).json({
        success: false,
        message: 'Finance record not found.'
      });
    }

    // Role check: Only admin, registrar, or the student themselves can record payment
    if (req.user.role !== 'admin' && req.user.role !== 'registrar' && req.user.id !== finance.student.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    finance.paymentHistory.push({
      amount: parseFloat(amount),
      transactionId: transactionId || 'TRX-' + Math.floor(Date.now() / 1000),
      paymentMethod: paymentMethod || 'Online',
      paymentDate: new Date()
    });

    // Update status to paid if full amount is reached (logic inside model or here)
    const totalPaid = finance.paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (totalPaid >= finance.amount) {
      finance.status = 'paid';
    }

    await finance.save();

    // Notify student of reconciliation (Bursar Action)
    const student = await User.findById(finance.student);
    if (student && finance.status === 'paid') {
      emailService.sendPaymentReconciliationEmail(student, finance).catch(console.error);
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      finance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Create Finance for semester
// @route   POST /api/finance/bulk-create
// @access  Private (Admin, Registrar)
exports.bulkCreateFinance = async (req, res, next) => {
  try {
    const { students, title, amount, dueDate, semester, academicYear, description } = req.body;

    if (!Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: 'Students list must be an array.'
      });
    }

    const records = students.map(studentId => ({
      student: studentId,
      title,
      amount,
      dueDate,
      semester,
      academicYear,
      description,
      createdBy: req.user.id
    }));

    const result = await Finance.insertMany(records);

    res.status(201).json({
      success: true,
      count: result.length,
      message: 'Finance records created in bulk.'
    });

    // Send bulk emails
    for (const record of result) {
      const s = await User.findById(record.student);
      if (s) emailService.sendFinanceNotification(s, record).catch(console.error);
    }
  } catch (error) {
    next(error);
  }
};

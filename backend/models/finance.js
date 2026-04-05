const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    enum: ['tuition_fee', 'library_fee', 'hostel_fee', 'exam_fee', 'registration_fee', 'penalty'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'partially_paid', 'cancelled'],
    default: 'pending'
  },
  paymentHistory: [{
    amount: Number,
    paymentDate: { type: Date, default: Date.now },
    transactionId: String,
    paymentMethod: String,
    receiptNo: {
      type: String,
      default: () => 'REC-' + Math.random().toString(36).substring(2, 9).toUpperCase()
    }
  }],
  semester: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate total paid across history
financeSchema.virtual('totalPaid').get(function() {
  if (!this.paymentHistory) return 0;
  return this.paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
});

// Status is overdue if not fully paid after due date
financeSchema.pre('save', function(next) {
  const totalPaid = this.paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
  if (totalPaid >= this.amount) {
    this.status = 'paid';
  } else if (totalPaid > 0) {
    this.status = 'partially_paid';
  } else if (new Date() > this.dueDate) {
    this.status = 'overdue';
  } else {
    this.status = 'pending';
  }
  next();
});

module.exports = mongoose.model('Finance', financeSchema);

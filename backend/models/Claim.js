const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claimType: {
    type: String,
    enum: ['medical', 'travel', 'registration', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  attachments: [{
    type: String // URLs to files
  }],
  bankDetails: {
    bankName: String,
    accountNumber: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: String,
  processedDate: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Claim', claimSchema);

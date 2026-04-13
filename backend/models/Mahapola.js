const mongoose = require('mongoose');

const mahapolaSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registrationNumber: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  nic: {
    type: String,
    required: true
  },
  degreeProgram: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  scholarshipType: {
    type: String,
    required: true,
    enum: ['Merit', 'Ordinary', 'Bursary']
  },
  installmentMonth: {
    type: String,
    required: true
  },
  bankAccountNumber: {
    type: String,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  branchName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processed'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Mahapola', mahapolaSchema);

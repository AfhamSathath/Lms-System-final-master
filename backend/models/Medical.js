const mongoose = require('mongoose');

const medicalSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registrationNumber: { type: String, required: true },
  fullName: { type: String, required: true },
  faculty: { type: String, required: true },
  semester: { type: String, required: true },
  illness: { type: String, required: true },
  mcNumber: { type: String, required: true },
  doctorName: { type: String, required: true },
  hospital: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  documentUrl: { type: String, required: true }, // Path to uploaded PDF
  
  status: {
    type: String,
    enum: ['PENDING_HOD', 'REJECTED_HOD', 'PENDING_ADMIN', 'REJECTED_ADMIN', 'APPROVED_ADMIN'],
    default: 'PENDING_HOD'
  },
  
  hodRemarks: { type: String },
  adminRemarks: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Medical', medicalSchema);

const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['theory', 'practical'],
    required: true
  },
  batch: {
    type: String,
    required: true
  },
  targetGroups: {
    type: [String],
    default: []
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 100
  },
  status: {
    type: String,
    enum: ['draft', 'pending_hod', 'approved_by_hod', 'published'],
    default: 'draft'
  },
  marks: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mark: {
      type: Number,
      required: true
    },
    remarks: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
assessmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Assessment', assessmentSchema);

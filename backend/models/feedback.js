const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'subject',
    required: true
  },
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratings: {
    teachingQuality: { type: Number, min: 1, max: 5, required: true },
    courseContent: { type: Number, min: 1, max: 5, required: true },
    resourcesAvailability: { type: Number, min: 1, max: 5, required: true },
    overallExperience: { type: Number, min: 1, max: 5, required: true }
  },
  comments: {
    type: String,
    trim: true,
    maxlength: 500
  },
  semester: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure a student can only give feedback once per course per semester
feedbackSchema.index({ student: 1, course: 1, semester: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);

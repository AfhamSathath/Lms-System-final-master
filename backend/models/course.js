const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [0, 'Credits must be at least 0'],
    max: [8, 'Credits cannot exceed 8'],
  },
  lectureHours: {
    type: Number,
    default: function() {
      return (this.credits || 0) * 15;
    }
  },
  year: {
    type: String,
    required: [true, 'Academic year is required'],
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 2,
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: [
      'Languages and Communication Studies',
      'Business and Management Studies',
      'Computer Science',
      'Physical Science',
      'Unit of Siddha Medicine'
    ],
  },
  category: {
    type: String,
    enum: ['Lecture', 'Practical', 'General', 'Management', 'Project', 'Clinical'],
    default: 'Lecture',
  },
  hasPractical: {
    type: Boolean,
    default: false,
  },
  practicalCode: {
    type: String,
    uppercase: true,
    trim: true,
  },
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function (v) {
        if (!v) return true;
        const user = await mongoose.model('User').findById(v);
        return user && (user.role === 'lecturer' || user.role === 'hod');
      },
      message: 'Invalid lecturer',
    },
  },
  description: {
    type: String,
    default: '',
  },
  syllabus: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Extract credits from code (3rd digit) and set lecture hours
subjectSchema.pre('save', function (next) {
  if (this.code) {
    const digits = this.code.match(/\d/g);
    if (digits && digits.length >= 3) {
      // 3rd digit is credit
      const derivedCredits = parseInt(digits[2]);
      if (!isNaN(derivedCredits)) {
        this.credits = derivedCredits;
        this.lectureHours = derivedCredits * 15;
      }
    } else if (this.credits) {
      // Fallback if not enough digits but credits are provided
      this.lectureHours = this.credits * 15;
    }
  }
  next();
});

// Helper function to get semester number (1-8)
subjectSchema.virtual('semesterNumber').get(function () {
  const yearMap = {
    '1st Year': 1,
    '2nd Year': 2,
    '3rd Year': 3,
    '4th Year': 4
  };
  const yearNum = yearMap[this.year] || 0;
  return (yearNum - 1) * 2 + this.semester;
});

// Compound index for unique subject per year-semester-department
subjectSchema.index({ code: 1, year: 1, semester: 1, department: 1 }, { unique: true });

// Index for efficient queries
subjectSchema.index({ year: 1, semester: 1 });
subjectSchema.index({ department: 1, year: 1, semester: 1 });
subjectSchema.index({ category: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
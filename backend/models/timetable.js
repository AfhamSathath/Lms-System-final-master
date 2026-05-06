const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']
  },
  semester: {
    type: Number,
    enum: [1, 2]
  },
  examType: {
    type: String,
    enum: ['final'],
    default: 'final'
  },
  department: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  venue: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'pending_dean', 'pending_hod', 'published', 'finished', 'problem'],
    default: 'draft'
  },
  problemReportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  problemComments: String,
  isVenueRestored: {
    type: Boolean,
    default: false
  },
  supervisors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deanSignature: String,
  hodSignature: String,
  examOfficerSignature: String,
  approvedAtDean: Date,
  approvedAtHOD: Date,
  publishedAt: Date,
  batch: String
}, { timestamps: true });

// Autofill year & semester from subject
timetableSchema.pre('save', async function(next) {
  if ((!this.year || !this.semester) && this.subject) {
    const Subject = mongoose.model('Subject');
    const subject = await Subject.findById(this.subject).select('year semester');
    if (subject) {
      this.year = this.year || subject.year;
      this.semester = this.semester || subject.semester;
    }
  }

  // Autofill batch from student records if not provided
  if (!this.batch && this.year && this.department) {
    try {
      const User = mongoose.model('User');
      const yearMap = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4, '5th Year': 5 };
      const studyYear = yearMap[this.year];
      
      // Find a student in this department and year to get their batch
      const student = await User.findOne({ 
        role: 'student', 
        department: this.department,
        yearOfStudy: studyYear
      }).select('batch');
      
      if (student && student.batch) {
        this.batch = student.batch;
      }
    } catch (err) {
      console.error('Batch autofill error:', err);
    }
  }
  next();
});

module.exports = mongoose.model('Timetable', timetableSchema);
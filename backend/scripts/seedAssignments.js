const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Subject = require('../models/course');
const User = require('../models/user');
const LecturerAssignment = require('../models/LecturerAssignment');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAssignments = async () => {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database...');

    // Clear existing assignments
    await LecturerAssignment.deleteMany();
    console.log('Cleared existing assignments.');

    // Get all subjects
    const subjects = await Subject.find();
    
    // Get some lecturers
    const lecturers = await User.find({ role: { $in: ['lecturer', 'hod'] } });
    
    if (lecturers.length === 0) {
      console.log('No lecturers found. Please seed lecturers first.');
      process.exit(1);
    }

    console.log(`Assigning ${subjects.length} subjects to ${lecturers.length} available staff...`);

    const assignments = [];
    
    subjects.forEach((sub, i) => {
       // Pick a pseudo-random lecturer
       const lecturer = lecturers[i % lecturers.length];
       
       // Calculate random progress for the audit demo
       const progress = Math.floor(Math.random() * 85) + 15;
       
       assignments.push({
         lecturer: lecturer._id,
         subject: sub._id,
         department: sub.department,
         academicYear: sub.year,
         semester: sub.semester,
         curriculum: {
           totalLectures: 30,
           lecturesCompleted: Math.floor(30 * (progress / 100)),
           progressPercentage: progress
         },
         qualifications: {
           minimumQualification: 'M.Sc',
           hasQualification: true
         },
         startDate: new Date(2023, 0, 1),
         endDate: new Date(2023, 5, 30),
         status: 'active'
       });
    });

    await LecturerAssignment.insertMany(assignments);
    console.log(`${assignments.length} assignments seeded successfully!`);

    process.exit();
  } catch (err) {
    console.error('Error seeding assignments:', err);
    process.exit(1);
  }
};

seedAssignments();

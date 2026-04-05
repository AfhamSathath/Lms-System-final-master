const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Subject = require('../models/course');
const { getAllSubjectsForSeeding } = require('../utils/subjectData');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedSubjects = async () => {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to database...');

    // Clear existing subjects
    await Subject.deleteMany();
    console.log('Cleared existing subjects.');

    // Get subjects for seeding
    const subjects = getAllSubjectsForSeeding();
    console.log(`Prepared ${subjects.length} subjects for seeding.`);

    // Insert subjects
    await Subject.insertMany(subjects);
    console.log('Subjects seeded successfully!');

    process.exit();
  } catch (err) {
    console.error('Error seeding subjects:', err);
    process.exit(1);
  }
};

seedSubjects();

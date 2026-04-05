/**
 * Script to update all grades in the database with the new grading scale
 * New Scale: 75+=A+, 70+=A, 65+=A-, 60+=B+, 55+=B, 50+=B-, 45+=C+, 40+=C, 35+=C-, 30+=D+, 25+=D, <25=F
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import Result model
const Result = require('../models/result');

// Grading scale
const calculateGrade = (marks) => {
  let grade, gradePoint, status;

  if (marks >= 75) {
    grade = 'A+';
    gradePoint = 4.0;
    status = 'pass';
  } else if (marks >= 70) {
    grade = 'A';
    gradePoint = 4.0;
    status = 'pass';
  } else if (marks >= 65) {
    grade = 'A-';
    gradePoint = 3.7;
    status = 'pass';
  } else if (marks >= 60) {
    grade = 'B+';
    gradePoint = 3.3;
    status = 'pass';
  } else if (marks >= 55) {
    grade = 'B';
    gradePoint = 3.0;
    status = 'pass';
  } else if (marks >= 50) {
    grade = 'B-';
    gradePoint = 2.7;
    status = 'pass';
  } else if (marks >= 45) {
    grade = 'C+';
    gradePoint = 2.3;
    status = 'pass';
  } else if (marks >= 40) {
    grade = 'C';
    gradePoint = 2.0;
    status = 'pass';
  } else if (marks >= 35) {
    grade = 'C-';
    gradePoint = 1.7;
    status = 'pass';
  } else if (marks >= 30) {
    grade = 'D+';
    gradePoint = 1.3;
    status = 'pass';
  } else if (marks >= 25) {
    grade = 'D';
    gradePoint = 1.0;
    status = 'pass';
  } else {
    grade = 'F';
    gradePoint = 0.0;
    status = 'fail';
  }

  return { grade, gradePoint, status };
};

const updateGrades = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Fetch all results
    const results = await Result.find({});
    console.log(`Found ${results.length} results to process`);

    let updated = 0;
    let errors = 0;

    // Update each result
    for (const result of results) {
      try {
        if (result.marks !== undefined && result.marks !== null) {
          const marks = parseFloat(result.marks);
          const gradeInfo = calculateGrade(marks);
          
          result.grade = gradeInfo.grade;
          result.gradePoint = gradeInfo.gradePoint;
          result.status = gradeInfo.status;

          await result.save();
          updated++;
          console.log(`Updated: ${result.student?.name || 'Unknown'} - ${result.subject?.name || 'Unknown'} - ${marks} marks -> ${gradeInfo.grade}`);
        }
      } catch (error) {
        errors++;
        console.error(`Error updating result ${result._id}:`, error.message);
      }
    }

    console.log(`\nGrade update completed!`);
    console.log(`Successfully updated: ${updated} results`);
    console.log(`Errors encountered: ${errors}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error updating grades:', error);
    process.exit(1);
  }
};

// Run the update
updateGrades();

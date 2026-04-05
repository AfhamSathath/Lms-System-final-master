// Test script to verify PDF email functionality
const emailService = require('./utils/emailService');
const User = require('./models/user');
const Result = require('./models/result');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function testEmailService() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms-system');

    console.log('Connected to MongoDB');

    // Find a test student
    const student = await User.findOne({ role: 'student' }).limit(1);
    if (!student) {
      console.log('No students found in database');
      return;
    }

    console.log('Found student:', student.email);

    // Find results for this student
    const results = await Result.find({ student: student._id }).populate('subject', 'name code credits');
    if (results.length === 0) {
      console.log('No results found for this student');
      return;
    }

    console.log(`Found ${results.length} results for student`);

    // Test the PDF email sending
    console.log('Testing PDF email generation and sending...');
    await emailService.sendBulkResultsNotificationWithPDF(student, results);

    console.log('✅ PDF email sent successfully!');

  } catch (error) {
    console.error('❌ Error testing email service:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testEmailService();
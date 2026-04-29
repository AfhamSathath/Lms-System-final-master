require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('./models/course'); // The model is defined in course.js
const User = require('./models/user');

async function updateCredits() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms');
    console.log('Connected to database');

    const subjects = await Subject.find({});
    let updatedCount = 0;
    let skippedCount = 0;

    for (const subject of subjects) {
      if (!subject.code) {
        skippedCount++;
        continue;
      }

      // Extract all digits from the subject code
      const match = subject.code.match(/\d+/g);
      if (match) {
        const numbersStr = match.join('');
        if (numbersStr.length >= 3) {
          const creditsDigit = parseInt(numbersStr.charAt(2), 10);
          
          if (!isNaN(creditsDigit) && creditsDigit > 0) {
            // Update the subject
            subject.credits = creditsDigit;
            await subject.save();
            updatedCount++;
            console.log(`Updated subject ${subject.code} (${subject.name}) with credits: ${creditsDigit}`);
            continue;
          }
        }
      }
      
      console.log(`Skipped subject ${subject.code} (Could not parse 3rd digit)`);
      skippedCount++;
    }

    console.log(`\nOperation complete.`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('Error updating credits:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

updateCredits();

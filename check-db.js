const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const config = require('./backend/config/database');
const File = require('./backend/models/file');
const Subject = require('./backend/models/course');

async function check() {
  try {
    await config();
    console.log('Connected to DB');
    
    const fileCount = await File.countDocuments();
    console.log('Total files:', fileCount);
    
    const subjectCount = await Subject.countDocuments();
    console.log('Total subjects:', subjectCount);
    
    if (fileCount > 0) {
      const files = await File.find().limit(5);
      console.log('Sample files:', files);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

check();

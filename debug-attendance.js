const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const config = require('./backend/config/database');
const Enrollment = require('./backend/models/Enrollment');

async function check() {
  try {
    await config();
    console.log('Connected to DB');
    
    const id = '69cfe6b3207e4569672b6d72';
    const enrollment = await Enrollment.findById(id);
    
    if (!enrollment) {
      console.log('Enrollment not found');
      return;
    }
    
    console.log('Enrollment found:', enrollment);
    
    // Attempt to update attendance like the controller does
    const attendance = [{ date: new Date(), status: 'present' }];
    
    // Simulate current updateAttendance logic
    if (!enrollment.attendance) {
      enrollment.attendance = [];
    }
    
    for (const record of attendance) {
      const recordDate = new Date(record.date);
      const existingIndex = enrollment.attendance.findIndex(
        a => a.date && a.date.toISOString().split('T')[0] === recordDate.toISOString().split('T')[0]
      );

      if (existingIndex >= 0) {
        enrollment.attendance[existingIndex].status = record.status;
      } else {
        enrollment.attendance.push({
          date: recordDate,
          status: record.status
        });
      }
    }
    
    try {
      await enrollment.save();
      console.log('Successfully saved attendance');
    } catch (saveErr) {
      console.error('Validation Error Details:');
      if (saveErr.errors) {
        Object.keys(saveErr.errors).forEach(key => {
          console.error(`- Field: ${key}, Message: ${saveErr.errors[key].message}, Value: ${saveErr.errors[key].value}`);
        });
      } else {
        console.error(saveErr);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

check();

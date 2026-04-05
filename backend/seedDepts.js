const mongoose = require('mongoose');
const Department = require('./models/Department');
const Faculty = require('./models/Faculty');
require('./config/database')();

const seedDepartments = async () => {
  try {
    const engineeringFaculty = await Faculty.findOneAndUpdate(
      { code: 'ENG' },
      { name: 'Engineering', code: 'ENG' },
      { upsert: true, new: true }
    );

    const departments = [
      { name: 'Computer Science', code: 'CS', faculty: engineeringFaculty._id, isActive: true },
      { name: 'Electrical Engineering', code: 'EE', faculty: engineeringFaculty._id, isActive: true },
      { name: 'Mechanical Engineering', code: 'ME', faculty: engineeringFaculty._id, isActive: true },
      { name: 'Aero Space', code: 'AS', faculty: engineeringFaculty._id, isActive: true }
    ];

    for (const d of departments) {
      await Department.findOneAndUpdate({ code: d.code }, d, { upsert: true, new: true });
    }

    console.log('Departments seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDepartments();

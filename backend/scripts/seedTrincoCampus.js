const mongoose = require('mongoose');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Subject = require('../models/course'); // Note: Subject model is exported as 'Subject' from course.js
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms');
    console.log('Connected to MongoDB');

    // 1. Faculties
    const faculties = [
      { name: 'Faculty of Communication and Business Studies', code: 'FCBS', description: 'Communication and Business management studies' },
      { name: 'Faculty of Applied Science', code: 'FAS', description: 'Computing and Physical science studies' },
      { name: 'Faculty of Siddha Medicine', code: 'FSM', description: 'Traditional Siddha Medicine studies' }
    ];

    const createdFaculties = [];
    for (const f of faculties) {
      let faculty = await Faculty.findOne({ code: f.code });
      if (!faculty) {
        faculty = await Faculty.create(f);
        console.log(`Created Faculty: ${f.name}`);
      }
      createdFaculties.push(faculty);
    }

    // 2. Departments
    const departments = [
      { name: 'Languages and Communication Studies', code: 'LCS', faculty: 'FCBS' },
      { name: 'Business and Management Studies', code: 'BMS', faculty: 'FCBS' },
      { name: 'Computer Science', code: 'DCS', faculty: 'FAS' },
      { name: 'Physical Science', code: 'DPS', faculty: 'FAS' },
      { name: 'Unit of Siddha Medicine', code: 'USM', faculty: 'FSM' }
    ];

    for (const d of departments) {
      const faculty = createdFaculties.find(f => f.code === d.faculty);
      let department = await Department.findOne({ code: d.code });
      if (!department) {
        await Department.create({ ...d, faculty: faculty._id });
        console.log(`Created Department: ${d.name}`);
      }
    }

    // 3. Subjects (Comprehensive List for Trincomalee Campus)
    const subjects = [
      // --- COMPUTER SCIENCE (Official Prospectus Data) ---
      // Year I: Semester I
      { name: 'Basic Mathematics for Computing', code: 'CO1121', credits: 2, year: '1st Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Basic Computer Programming', code: 'CO1122', credits: 2, year: '1st Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CO1122', code: 'CO1112', credits: 1, year: '1st Year', semester: 1, department: 'Computer Science', category: 'Practical' },
      { name: 'Formal Methods for Problem Solving', code: 'CO1123', credits: 2, year: '1st Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Computer Systems & PC Applications', code: 'CO1124', credits: 2, year: '1st Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CO1124', code: 'CO1114', credits: 1, year: '1st Year', semester: 1, department: 'Computer Science', category: 'Practical' },
      { name: 'Statistics for Science and Technology', code: 'CO1125', credits: 2, year: '1st Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CO1125', code: 'CO1115', credits: 1, year: '1st Year', semester: 1, department: 'Computer Science', category: 'Practical' },
      { name: 'Management Information System', code: 'CO1126', credits: 2, year: '1st Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'General English Proficiency - I', code: 'GEP1', credits: 0, year: '1st Year', semester: 1, department: 'Computer Science', category: 'General' },

      // Year I: Semester II
      { name: 'Systems Analysis & Design', code: 'CO1221', credits: 2, year: '1st Year', semester: 2, department: 'Computer Science', category: 'Lecture' },
      { name: 'Data Structures & Algorithms', code: 'CO1222', credits: 2, year: '1st Year', semester: 2, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CO1222', code: 'CO1212', credits: 1, year: '1st Year', semester: 2, department: 'Computer Science', category: 'Practical' },
      { name: 'Data Base Management Systems', code: 'CO1223', credits: 2, year: '1st Year', semester: 2, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CO1223', code: 'CO1213', credits: 1, year: '1st Year', semester: 2, department: 'Computer Science', category: 'Practical' },
      { name: 'MultiMedia & HyperMedia Development', code: 'CO1224', credits: 2, year: '1st Year', semester: 2, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CO1224', code: 'CO1214', credits: 1, year: '1st Year', semester: 2, department: 'Computer Science', category: 'Practical' },
      { name: 'Computer Architecture', code: 'CO1225', credits: 2, year: '1st Year', semester: 2, department: 'Computer Science', category: 'Lecture' },
      { name: 'Social Harmony', code: 'CO1226', credits: 2, year: '1st Year', semester: 2, department: 'Computer Science', category: 'General' },

      // Year II: Semester I
      { name: 'Advanced Mathematics for Computing', code: 'CO2121', credits: 2, year: '2nd Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Operating Systems', code: 'CO2122', credits: 2, year: '2nd Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CO2122', code: 'CO2112', credits: 1, year: '2nd Year', semester: 1, department: 'Computer Science', category: 'Practical' },
      { name: 'Software Engineering', code: 'CO2123', credits: 2, year: '2nd Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Internet and Web Design', code: 'CO2124', credits: 2, year: '2nd Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CO2124', code: 'CO2114', credits: 1, year: '2nd Year', semester: 1, department: 'Computer Science', category: 'Practical' },
      { name: 'Object Oriented Programming', code: 'CO2125', credits: 2, year: '2nd Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CO2125', code: 'CO2115', credits: 1, year: '2nd Year', semester: 1, department: 'Computer Science', category: 'Practical' },
      { name: 'Sri Lankan Studies', code: 'CO2126', credits: 2, year: '2nd Year', semester: 1, department: 'Computer Science', category: 'General' },
      { name: 'General English Proficiency - III', code: 'GEP3', credits: 0, year: '2nd Year', semester: 1, department: 'Computer Science', category: 'General' },

      // Year II: Semester II
      { name: 'Data Communication Systems', code: 'CO2221', credits: 2, year: '2nd Year', semester: 2, department: 'Computer Science', category: 'Lecture' },
      { name: 'Visual System Development Tools', code: 'CO2222', credits: 2, year: '2nd Year', semester: 2, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CO2222', code: 'CO2212', credits: 1, year: '2nd Year', semester: 2, department: 'Computer Science', category: 'Practical' },
      { name: 'Computer Graphics', code: 'CO2223', credits: 2, year: '2nd Year', semester: 2, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CO2223', code: 'CO2213', credits: 1, year: '2nd Year', semester: 2, department: 'Computer Science', category: 'Practical' },
      { name: 'Human Computer Interaction', code: 'CO2224', credits: 2, year: '2nd Year', semester: 2, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CO2224', code: 'CO2214', credits: 1, year: '2nd Year', semester: 2, department: 'Computer Science', category: 'Practical' },
      { name: 'Software Management Techniques', code: 'CO2225', credits: 2, year: '2nd Year', semester: 2, department: 'Computer Science', category: 'Lecture' },
      { name: 'Automata Theory', code: 'CO2226', credits: 2, year: '2nd Year', semester: 2, department: 'Computer Science', category: 'Lecture' },

      // Year III: Semester I
      { name: 'Logic Programming & Expert Systems', code: 'CS3121', credits: 2, year: '3rd Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CS3121', code: 'CS3111', credits: 1, year: '3rd Year', semester: 1, department: 'Computer Science', category: 'Practical' },
      { name: 'Advanced Database Management Systems', code: 'CS3122', credits: 2, year: '3rd Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CS3122', code: 'CS3112', credits: 1, year: '3rd Year', semester: 1, department: 'Computer Science', category: 'Practical' },
      { name: 'Systems & Network Administration', code: 'CS3123', credits: 2, year: '3rd Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CS3123', code: 'CS3113', credits: 1, year: '3rd Year', semester: 1, department: 'Computer Science', category: 'Practical' },
      { name: 'Data Security', code: 'CS3124', credits: 2, year: '3rd Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Practical work on CS3124', code: 'CS3114', credits: 1, year: '3rd Year', semester: 1, department: 'Computer Science', category: 'Practical' },
      { name: 'Theory of Computing', code: 'CS3135', credits: 3, year: '3rd Year', semester: 1, department: 'Computer Science', category: 'Lecture' },
      { name: 'Foundations of Management', code: 'EC3101', credits: 0, year: '3rd Year', semester: 1, department: 'Computer Science', category: 'Management' },

      // --- BUSINESS & MANAGEMENT STUDIES (B.Sc in Management Prospectus) ---
      // First Year: Semester 1/1
      { name: 'Principles of Management', code: 'BMT1013', credits: 3, year: '1st Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Introduction to Information Technology', code: 'BMT1023', credits: 3, year: '1st Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Business Mathematics', code: 'BMT1033', credits: 3, year: '1st Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Business English I', code: 'BMT1043', credits: 3, year: '1st Year', semester: 1, department: 'Business and Management Studies', category: 'General' },
      { name: 'Microeconomics', code: 'BMT1053', credits: 3, year: '1st Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Basic Tamil I', code: 'NCC1010', credits: 0, year: '1st Year', semester: 1, department: 'Business and Management Studies', category: 'General' },
      { name: 'Basic Sinhala I', code: 'NCC1020', credits: 0, year: '1st Year', semester: 1, department: 'Business and Management Studies', category: 'General' },

      // First Year: Semester 1/2
      { name: 'Human Resource Management', code: 'HRM1013', credits: 3, year: '1st Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Financial Accounting', code: 'AFM1013', credits: 3, year: '1st Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Business Statistics', code: 'BMT1063', credits: 3, year: '1st Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Business English II', code: 'BMT1073', credits: 3, year: '1st Year', semester: 2, department: 'Business and Management Studies', category: 'General' },
      { name: 'Marketing Management', code: 'MKT1013', credits: 3, year: '1st Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Basic Tamil II', code: 'NCC1030', credits: 0, year: '1st Year', semester: 2, department: 'Business and Management Studies', category: 'General' },
      { name: 'Basic Sinhala II', code: 'NCC1040', credits: 0, year: '1st Year', semester: 2, department: 'Business and Management Studies', category: 'General' },

      // Second Year: Semester 2/1
      { name: 'Macroeconomics', code: 'BMT2013', credits: 3, year: '2nd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Cost and Management Accounting', code: 'AFM2013', credits: 3, year: '2nd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Management Information System', code: 'BMT2023', credits: 3, year: '2nd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Business Skills I', code: 'BMT2033', credits: 3, year: '2nd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Business Law', code: 'BMT2043', credits: 3, year: '2nd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Career Guidance', code: 'NCC2010', credits: 0, year: '2nd Year', semester: 1, department: 'Business and Management Studies', category: 'General' },

      // Second Year: Semester 2/2
      { name: 'Operations Management', code: 'BMT2053', credits: 3, year: '2nd Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Financial Management', code: 'AFM2023', credits: 3, year: '2nd Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Business Skills II', code: 'BMT2063', credits: 3, year: '2nd Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Entrepreneurship and Innovation', code: 'BMT2073', credits: 3, year: '2nd Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Fundamental Sociology and Psychology', code: 'BMT2082', credits: 2, year: '2nd Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Peace and Social Harmony', code: 'BMT2091', credits: 1, year: '2nd Year', semester: 2, department: 'Business and Management Studies', category: 'General' },
      { name: 'Basic Science', code: 'NCC2020', credits: 0, year: '2nd Year', semester: 2, department: 'Business and Management Studies', category: 'General' },

      // Third Year: Semester 3/1
      { name: 'Organizational Behavior', code: 'BMT3013', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Operational Research', code: 'BMT3023', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Total Quality Management', code: 'BMT3033', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Organizational Development', code: 'BMT3043', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Labor Law and Relations', code: 'BMT3123', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Micro Finance', code: 'BMT3053', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },

      // --- BUSINESS & MANAGEMENT STUDIES (Honors Eligibility Logics) ---
      // 1. Marketing Management Major: Minimum 'C' grade in MKT 1013
      // 2. HRM Major: Minimum 'C' grade in HRM 1013
      // 3. Accounting & Finance Major: Minimum 'C' grade in AFM 1013
      // 4. Management Honors: Overall GPA 3.3 or higher at the end of Year 3
      // 5. Graduation Requirement: Must complete 0-credit NCC courses (NCC1010-NCC1040)

      // Honors in Management - 4th Year
      { name: 'Computer Based Data Analysis', code: 'BMT4013', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Development Economics', code: 'BMT4023', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Service Management', code: 'BMT4033', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'International Business', code: 'BMT4043', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'E-Commerce', code: 'BMT4053', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Independent Research in Business Management', code: 'BMT4076', credits: 6, year: '4th Year', semester: 2, department: 'Business and Management Studies', category: 'Project' },
      { name: 'Internship in Business Management', code: 'BMT4083', credits: 3, year: '4th Year', semester: 2, department: 'Business and Management Studies', category: 'Practical' },

      // Honors in Human Resource Management - 3rd & 4th Year
      { name: 'Performance Appraisal', code: 'HRM3043', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Human Resource Planning', code: 'HRM3053', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Human Resource Development', code: 'HRM3113', credits: 3, year: '3rd Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Strategic Human Resource Management', code: 'HRM4033', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'International Human Resource Management', code: 'HRM4043', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Human Resource Information Systems', code: 'HRM4053', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Human Resource Accounting', code: 'HRM4063', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Independent Research in Human Resources Management', code: 'HRM4076', credits: 6, year: '4th Year', semester: 2, department: 'Business and Management Studies', category: 'Project' },
      { name: 'Internship in Human Resources Management', code: 'HRM4083', credits: 3, year: '4th Year', semester: 2, department: 'Business and Management Studies', category: 'Practical' },

      // Honors in Accounting and Finance - 3rd & 4th Year
      { name: 'Micro Finance (Accounting)', code: 'AFM3033', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Investment and Portfolio Management', code: 'AFM3043', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Advanced Financial Accounting', code: 'AFM3053', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Auditing', code: 'AFM3103', credits: 3, year: '3rd Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Computer Based Accounting', code: 'AFM3113', credits: 3, year: '3rd Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Taxation', code: 'AFM4033', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Advanced Accounting Theory', code: 'AFM4043', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Public Sector Accounting', code: 'AFM4053', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Financial Reporting', code: 'AFM4063', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Independent Research in Accounting and Finance', code: 'AFM4076', credits: 6, year: '4th Year', semester: 2, department: 'Business and Management Studies', category: 'Project' },
      { name: 'Internship in Accounting and Finance', code: 'AFM4083', credits: 3, year: '4th Year', semester: 2, department: 'Business and Management Studies', category: 'Practical' },
      { name: 'Service Marketing', code: 'MMT3033', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Sales Management and Retail Marketing', code: 'MMT3043', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Marketing Research', code: 'MMT3053', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Consumer Behavior', code: 'MMT3103', credits: 3, year: '3rd Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Integrated Marketing Communication', code: 'MMT3113', credits: 3, year: '3rd Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Computer Based Data Analysis (Marketing)', code: 'MMT4013', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Development Economics (Marketing)', code: 'MMT4023', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'E- Marketing', code: 'MMT4033', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Strategic Marketing', code: 'MMT4043', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'International Marketing', code: 'MMT4053', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Brand Management', code: 'MMT4063', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Independent Research in Marketing', code: 'MMT4076', credits: 6, year: '4th Year', semester: 2, department: 'Business and Management Studies', category: 'Project' },
      { name: 'Internship in Marketing', code: 'MMT4083', credits: 3, year: '4th Year', semester: 2, department: 'Business and Management Studies', category: 'Practical' },

      // --- LANGUAGES & COMMUNICATION STUDIES (B.A. Prospectus) ---
      // Year I: Semester I (Common Courses)
      { name: 'Basic Tamil', code: 'LANG1013', credits: 3, year: '1st Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Basic Sinhala', code: 'LANG1023', credits: 3, year: '1st Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Basic Reading & Grammar (General English I)', code: 'LANG1033', credits: 3, year: '1st Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Sri Lankan Studies', code: 'GENR1013', credits: 3, year: '1st Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Introduction to Communication Studies', code: 'COMM1013', credits: 3, year: '1st Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Computer Literacy & Application', code: 'ITEC1013', credits: 3, year: '1st Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },

      // Year I: Semester II (Common Courses)
      { name: 'Basic Writing & Speech (General English II)', code: 'LANG1043', credits: 3, year: '1st Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Introduction to Literature', code: 'LANG1053', credits: 3, year: '1st Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Communication & Persuasion', code: 'COMM1023', credits: 3, year: '1st Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Introduction to Language & Linguistics', code: 'LANG1063', credits: 3, year: '1st Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Basic Mathematics', code: 'GENR1023', credits: 3, year: '1st Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },

      // --- LANGUAGES & COMMUNICATION STUDIES (B.A. Prospectus Continued) ---
      // Year II: Semester I
      { name: 'Introduction to Interpersonal Communication', code: 'COMM2053', credits: 3, year: '2nd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Introduction to Organizational Communication', code: 'COMM2063', credits: 3, year: '2nd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'General English III', code: 'LANG2063', credits: 3, year: '2nd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Mass Communication and Society', code: 'COMM2033', credits: 3, year: '2nd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Communication Theories and Media Literacy', code: 'COMM2043', credits: 3, year: '2nd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Introductory Phonetics', code: 'LANG2073', credits: 3, year: '2nd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Advanced Reading and Grammar', code: 'LANG2083', credits: 3, year: '2nd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Advanced Writing and Speech', code: 'LANG2093', credits: 3, year: '2nd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Introduction to Poetry', code: 'LANG2103', credits: 3, year: '2nd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },

      // Year II: Semester II
      { name: 'Instructional Media', code: 'COMM2083', credits: 3, year: '2nd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Development Communication', code: 'COMM2093', credits: 3, year: '2nd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Communication, Gender and Society', code: 'COMM2103', credits: 3, year: '2nd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'General English IV', code: 'LANG2113', credits: 3, year: '2nd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Writing for Media', code: 'COMM2073', credits: 3, year: '2nd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Sri Lankan Literature', code: 'LANG2123', credits: 3, year: '2nd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Introduction to Fiction', code: 'LANG2133', credits: 3, year: '2nd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Introduction to Western Culture', code: 'LANG2143', credits: 3, year: '2nd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Creative Writing', code: 'LANG2153', credits: 3, year: '2nd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Computer Programming (LCS)', code: 'ITEC2023', credits: 3, year: '2nd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },

      // Year III: Semester I
      { name: 'Culture and Communication', code: 'COMM3113', credits: 3, year: '3rd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Communication and Conflict Management', code: 'COMM3123', credits: 3, year: '3rd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Commonwealth Literature', code: 'LANG3163', credits: 3, year: '3rd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Modern Drama', code: 'LANG3173', credits: 3, year: '3rd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Practical Criticism', code: 'LANG3183', credits: 3, year: '3rd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Linguistics Principles of Translation', code: 'LING3113', credits: 3, year: '3rd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Film and Television', code: 'COMM3133', credits: 3, year: '3rd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Introduction to Folk Media', code: 'COMM3143', credits: 3, year: '3rd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Desktop Publishing (Theory)', code: 'ITEC3033T', credits: 2, year: '3rd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Desktop Publishing (Practical)', code: 'ITEC3033P', credits: 1, year: '3rd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'General Psychology (LCS)', code: 'GENR3033', credits: 3, year: '3rd Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      // Year III: Semester II
      { name: 'Media Law and Ethics', code: 'COMM3213', credits: 3, year: '3rd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Research Methods in Communication', code: 'COMM3223', credits: 3, year: '3rd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Shakespeare', code: 'LANG3223', credits: 3, year: '3rd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'American Literature', code: 'LANG3233', credits: 3, year: '3rd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Translation Methods', code: 'LANG3243', credits: 3, year: '3rd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Photojournalism', code: 'COMM3233', credits: 3, year: '3rd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Public Relation and Advertising', code: 'COMM3243', credits: 3, year: '3rd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Statistical Packages for Social Sciences', code: 'ITEC3043', credits: 3, year: '3rd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Human Rights and Social Justice', code: 'GENR3043', credits: 3, year: '3rd Year', semester: 2, department: 'Languages and Communication Studies', category: 'General' },

      // Year IV: Semester I (Honors Specializations)
      { name: 'Communication for Development', code: 'COMM4013', credits: 3, year: '4th Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Specialized Journalism', code: 'COMM4023', credits: 3, year: '4th Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'New Media and Society', code: 'COMM4033', credits: 3, year: '4th Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Corporate Communication', code: 'COMM4043', credits: 3, year: '4th Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Documentary Production', code: 'COMM4053', credits: 3, year: '4th Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Post-colonial Literature', code: 'LANG4013', credits: 3, year: '4th Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Literary Theory and Criticism', code: 'LANG4023', credits: 3, year: '4th Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Language Teaching Methodology', code: 'LANG4033', credits: 3, year: '4th Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Discourse Analysis', code: 'LANG4043', credits: 3, year: '4th Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },
      { name: 'Women\'s Writing', code: 'LANG4053', credits: 3, year: '4th Year', semester: 1, department: 'Languages and Communication Studies', category: 'General' },

      // Year IV: Semester II (Honors - Final Dissertation)
      { name: 'Dissertation in Communication Studies', code: 'COMM4066', credits: 6, year: '4th Year', semester: 2, department: 'Languages and Communication Studies', category: 'Project' },
      { name: 'Internship in Communication Studies', code: 'COMM4073', credits: 3, year: '4th Year', semester: 2, department: 'Languages and Communication Studies', category: 'Practical' },
      { name: 'Dissertation in Languages', code: 'LANG4066', credits: 6, year: '4th Year', semester: 2, department: 'Languages and Communication Studies', category: 'Project' },
      { name: 'Internship in Languages', code: 'LANG4073', credits: 3, year: '4th Year', semester: 2, department: 'Languages and Communication Studies', category: 'Practical' },

      // Honors/Majoring Requirements (Logics):

      // --- PHYSICAL SCIENCE ---
      { name: 'Calculus I', code: 'DPS1113', credits: 3, year: '1st Year', semester: 1, department: 'Physical Science', category: 'Lecture' },
      { name: 'General Physics', code: 'DPS1123', credits: 3, year: '1st Year', semester: 1, department: 'Physical Science', category: 'Lecture' },
      { name: 'Inorganic Chemistry', code: 'DPS1133', credits: 3, year: '1st Year', semester: 1, department: 'Physical Science', category: 'Lecture' },
      { name: 'Linear Algebra', code: 'DPS1213', credits: 3, year: '1st Year', semester: 2, department: 'Physical Science', category: 'Lecture' },
      { name: 'Organic Chemistry', code: 'DPS1223', credits: 3, year: '1st Year', semester: 2, department: 'Physical Science', category: 'Lecture' },
      { name: 'Mechanics', code: 'DPS2113', credits: 3, year: '2nd Year', semester: 1, department: 'Physical Science', category: 'Lecture' },
      { name: 'Electronics', code: 'DPS2213', credits: 3, year: '2nd Year', semester: 2, department: 'Physical Science', category: 'Lecture' },

      // --- SIDDHA MEDICINE (Official Prospectus Data) ---
      // 1st Professional - Semester I (1st Year)
      { name: 'Basic Principles of Siddha Medicine and History -I', code: 'SAT1013', credits: 3, year: '1st Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Siddha Pharmacology – I Herbs', code: 'GNA1013', credits: 3, year: '1st Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Anatomy - I', code: 'UDK1012', credits: 2, year: '1st Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Physiology & Biochemistry I', code: 'UDT1012', credits: 2, year: '1st Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Yoga - I', code: 'ADY1012', credits: 2, year: '1st Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'English for Communication - I', code: 'ENG1012', credits: 2, year: '1st Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'General' },
      { name: 'Basic Tamil - I / Basic Sinhala – I', code: 'TAM1011', credits: 1, year: '1st Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'General' },

      // 1st Professional - Semester II (1st Year)
      { name: 'Basic Principles of Siddha Medicine and History -II', code: 'SAT1023', credits: 3, year: '1st Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Siddha Pharmacology – II Herbs', code: 'GNA1023', credits: 3, year: '1st Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Anatomy -II', code: 'UDK1022', credits: 2, year: '1st Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Physiology & Biochemistry II', code: 'UDT1022', credits: 2, year: '1st Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Yoga - II', code: 'ADY1022', credits: 2, year: '1st Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'English for communication - II', code: 'ENG1022', credits: 2, year: '1st Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'General' },
      { name: 'Tamil - II / Sinhala – II', code: 'TAM1021', credits: 1, year: '1st Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'General' },

      // 2nd Professional - Semester III (2nd Year)
      { name: 'Siddha Literature - I', code: 'SEK2031', credits: 1, year: '2nd Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Siddha Pharmacology - III Metal, Minerals, and Animal kingdom', code: 'GNA2033', credits: 3, year: '2nd Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Anatomy -III', code: 'UDK2032', credits: 2, year: '2nd Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Physiology & Biochemistry III', code: 'UDT2033', credits: 3, year: '2nd Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Information Technology - I', code: 'INT2032', credits: 2, year: '2nd Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'General' },
      { name: 'Medical Ethics and Professionalism - I', code: 'MEP2032', credits: 2, year: '2nd Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Research Methodology', code: 'RMS2032', credits: 2, year: '2nd Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },

      // 2nd Professional - Semester IV (2nd Year)
      { name: 'Siddha Literature - II', code: 'SEK2041', credits: 1, year: '2nd Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Siddha Pharmacology- IV - Metal, Minerals, and Animal kingdom', code: 'GNA2044', credits: 4, year: '2nd Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Anatomy - IV', code: 'UDK2043', credits: 3, year: '2nd Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Physiology & Biochemistry – IV', code: 'UDT2043', credits: 3, year: '2nd Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Information Technology - II', code: 'INT2042', credits: 2, year: '2nd Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'General' },
      { name: 'Medical ethics and professionalism - II', code: 'MEP2042', credits: 2, year: '2nd Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },

      // 3rd Professional - Semester V (3rd Year)
      { name: 'Pathology - I', code: 'NNL3054', credits: 4, year: '3rd Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Fundamentals of Therapeutics in Siddha - I', code: 'CHA3051', credits: 1, year: '3rd Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Siddha Pharmacology – V Pharmaceutical Sciences', code: 'GNA3054', credits: 4, year: '3rd Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Community Medicine - I', code: 'SNM3053', credits: 3, year: '3rd Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Forensic Medicine & Toxicology - I', code: 'NSM3053', credits: 3, year: '3rd Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Lecture' },

      // 3rd Professional - Semester VI (3rd Year)
      { name: 'Pathology-II', code: 'NNL3064', credits: 4, year: '3rd Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Fundamentals of Therapeutics in Siddha –II', code: 'CHA3061', credits: 1, year: '3rd Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Siddha Pharmacology – VI Pharmaceutical sciences', code: 'GNA3064', credits: 4, year: '3rd Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Community Medicine – II', code: 'SNM3063', credits: 3, year: '3rd Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },
      { name: 'Forensic medicine & Toxicology – II', code: 'NSM3063', credits: 3, year: '3rd Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Lecture' },

      // Final Professional - Semester VII (4th Year)
      { name: 'Medicine – General - I', code: 'SMP4073', credits: 3, year: '4th Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Medicine – Special - I (Kayakarpam, Yoga & Psychiatric)', code: 'SMS4073', credits: 3, year: '4th Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Paediatrics - I', code: 'KUM4073', credits: 3, year: '4th Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'ENT- I', code: 'SRM4073', credits: 3, year: '4th Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Traditional Medicine - I', code: 'PPM4071', credits: 1, year: '4th Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Research Project I', code: 'RPT4072', credits: 2, year: '4th Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Project' },

      // Final Professional - Semester VIII (4th Year)
      { name: 'Medicine -General - II', code: 'SMP4083', credits: 3, year: '4th Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Medicine-Special - II (External therapy & Varmam)', code: 'SMS4083', credits: 3, year: '4th Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Paediatrics - II', code: 'KUM4083', credits: 3, year: '4th Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'ENT - II', code: 'SRM4083', credits: 3, year: '4th Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Traditional Medicine - II', code: 'PPM4081', credits: 1, year: '4th Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Research Project II', code: 'RPT4082', credits: 2, year: '4th Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Project' },

      // Final Professional - Semester IX (5th Year)
      { name: 'Medicine - General - III', code: 'SMP4094', credits: 4, year: '5th Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Medicine - Special - III (Skin)', code: 'SMS4093', credits: 3, year: '5th Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Surgery - I', code: 'ARM4093', credits: 3, year: '5th Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Gynaecology & Obstetrics - I', code: 'MMS4093', credits: 3, year: '5th Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Research Project III', code: 'RPT4092', credits: 2, year: '5th Year', semester: 1, department: 'Unit of Siddha Medicine', category: 'Project' },

      // Final Professional - Semester X (5th Year)
      { name: 'Medicine-General - IV', code: 'SMP4104', credits: 4, year: '5th Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Medicine – Special - IV', code: 'SMS4103', credits: 3, year: '5th Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Surgery - II', code: 'ARM4104', credits: 4, year: '5th Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Clinical' },
      { name: 'Gynaecology & Obstetrics II', code: 'MMS4104', credits: 4, year: '5th Year', semester: 2, department: 'Unit of Siddha Medicine', category: 'Clinical' },

      // --- BUSINESS & MANAGEMENT STUDIES (Honors in Information Systems) ---
      // 3rd Year
      { name: 'Programming Concepts', code: 'IMT3033', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Systems Analysis and Design', code: 'IMT3043', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Data Communication and Computer Networks', code: 'IMT3053', credits: 3, year: '3rd Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Professional Ethics and Responsibility', code: 'IMT3103', credits: 3, year: '3rd Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Software Engineering', code: 'IMT3113', credits: 3, year: '3rd Year', semester: 2, department: 'Business and Management Studies', category: 'Management' },
      // 4th Year
      { name: 'Computer Based Data Analysis (IS)', code: 'IMT4013', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Object Oriented Programming', code: 'IMT4023', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Web Development', code: 'IMT4033', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Enterprise Resource Planning Systems', code: 'IMT4043', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Software Quality Assurance', code: 'IMT4053', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Database Management Systems', code: 'IMT4063', credits: 3, year: '4th Year', semester: 1, department: 'Business and Management Studies', category: 'Management' },
      { name: 'Independent Research in Information Systems', code: 'IMT4076', credits: 6, year: '4th Year', semester: 2, department: 'Business and Management Studies', category: 'Project' },
      { name: 'Internship in Information Systems', code: 'IMT4083', credits: 3, year: '4th Year', semester: 2, department: 'Business and Management Studies', category: 'Practical' }
    ];

    for (const s of subjects) {
      let subject = await Subject.findOne({ code: s.code });
      if (!subject) {
        await Subject.create(s);
        console.log(`Created Subject: ${s.name}`);
      }
    }

    console.log('Seeding completed successfully');
    process.exit();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();

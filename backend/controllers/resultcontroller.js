// controllers/resultsController.js
const Result = require('../models/result');
const Subject = require('../models/course');
const User = require('../models/user');
const Notification = require('../models/notification');
const LecturerAssignment = require('../models/LecturerAssignment');
const emailService = require('../utils/emailService');
const { isPoorGrade } = require('../utils/gradecalculator');

/**
 * @desc    Get all results (Admin/Lecturer) or student results
 * @route   GET /api/results
 * @access  Private
 */
exports.getResults = async (req, res, next) => {
  try {
    const query = req.user.role === 'student' ? { student: req.user.id } : {};
    const requestedSubjectId = req.query.subjectId;

    if (requestedSubjectId) {
      query.subject = requestedSubjectId;
    }

    if (req.user.role === 'hod') {
      const students = await User.find({ department: req.user.department, role: 'student' }).select('_id');
      const studentIds = students.map((student) => student._id);

      if (studentIds.length === 0) {
        return res.json({ success: true, count: 0, results: [] });
      }

      query.student = { $in: studentIds };
    }

    if (req.user.role === 'lecturer') {
      const directSubjectRecords = await Subject.find({ lecturer: req.user.id }).select('_id');
      const directSubjectIds = directSubjectRecords.map((sub) => sub._id.toString());

      const assignments = await LecturerAssignment.find({ lecturer: req.user.id, isActive: true }).select('subject');
      const assignedSubjectIds = assignments.map((assignment) => assignment.subject.toString());

      const lecturerSubjectIds = [...new Set([...directSubjectIds, ...assignedSubjectIds])];

      if (requestedSubjectId) {
        if (!lecturerSubjectIds.includes(requestedSubjectId)) {
          return res.status(403).json({ success: false, message: 'Access denied to requested subject results.' });
        }
      }

      if (lecturerSubjectIds.length === 0) {
        return res.json({ success: true, count: 0, results: [] });
      }

      query.subject = query.subject || { $in: lecturerSubjectIds };
    }

    const results = await Result.find(query)
      .populate('student', 'name studentId department')
      .populate('subject', 'name code credits')
      .populate('publishedBy', 'name')
      .sort('-publishedAt');

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single result by ID
 * @route   GET /api/results/:id
 * @access  Private
 */
exports.getResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('student', 'name studentId department')
      .populate('subject', 'name code credits')
      .populate('publishedBy', 'name');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get results of a specific student grouped by year/semester
 * @route   GET /api/results/student/:studentId
 * @access  Private
 */
exports.getStudentResults = async (req, res, next) => {
  try {
    // route defines /student/:id so use req.params.id
    const studentId = req.params.studentId || req.params.id;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }
    const results = await Result.find({ student: studentId })
      .populate('subject', 'name code credits')
      .sort({ year: 1, semester: 1 });

    const yearSemesterResults = {};
    results.forEach(result => {
      const key = `${result.year}-S${result.semester}`;
      if (!yearSemesterResults[key]) {
        yearSemesterResults[key] = { year: result.year, semester: result.semester, subjects: [], totalCredits: 0, totalGradePoints: 0 };
      }
      const sem = yearSemesterResults[key];
      sem.subjects.push(result);
      sem.totalCredits += result.subject.credits;
      sem.totalGradePoints += result.subject.credits * result.gradePoint;
    });

    Object.values(yearSemesterResults).forEach(sem => {
      sem.gpa = sem.totalGradePoints / sem.totalCredits;
      sem.displayName = `${sem.year} - Semester ${sem.semester}`;
    });

    res.json({ success: true, results: yearSemesterResults });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get results by year and semester
 * @route   GET /api/results/year/:year/semester/:semester
 * @access  Private/Admin/Lecturer
 */
exports.getResultsByYearAndSemester = async (req, res, next) => {
  try {
    const { year, semester } = req.params;
    const query = { year, semester: parseInt(semester) };

    if (req.user.role === 'hod') {
      const students = await User.find({ department: req.user.department, role: 'student' }).select('_id');
      const studentIds = students.map((student) => student._id);
      if (studentIds.length === 0) {
        return res.json({ success: true, count: 0, results: [] });
      }
      query.student = { $in: studentIds };
    }

    const results = await Result.find(query)
      .populate('student', 'name studentId department')
      .populate('subject', 'name code credits');

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get results by year
 * @route   GET /api/results/year/:year
 * @access  Private/Admin/Lecturer
 */
exports.getResultsByYear = async (req, res, next) => {
  try {
    const query = { year: req.params.year };

    if (req.user.role === 'hod') {
      const students = await User.find({ department: req.user.department, role: 'student' }).select('_id');
      const studentIds = students.map((student) => student._id);
      if (studentIds.length === 0) {
        return res.json({ success: true, count: 0, results: [] });
      }
      query.student = { $in: studentIds };
    }

    const results = await Result.find(query)
      .populate('student', 'name studentId department')
      .populate('subject', 'name code credits');

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a single result and notification
 * @route   POST /api/results
 * @access  Private/Admin
 */
exports.createResult = async (req, res, next) => {
  try {
    const { student, subject, year, semester, examType, marks } = req.body;
    
    // Validate required fields
    if (!student) return res.status(400).json({ message: 'Student is required' });
    if (!subject) return res.status(400).json({ message: 'Subject is required' });
    if (!year) return res.status(400).json({ message: 'Year is required' });
    if (semester === undefined || semester === null || semester === '') return res.status(400).json({ message: 'Semester is required' });
    if (marks === undefined || marks === null || marks === '') return res.status(400).json({ message: 'Marks are required' });
    if (!examType) return res.status(400).json({ message: 'Exam type is required' });
    
    // Validate marks is a number
    const marksNum = Number(marks);
    if (isNaN(marksNum)) return res.status(400).json({ message: 'Marks must be a valid number' });
    if (marksNum < 0 || marksNum > 100) return res.status(400).json({ message: 'Marks must be between 0 and 100' });
    
    const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    if (!validYears.includes(year)) return res.status(400).json({ message: 'Invalid year' });
    
    const semesterNum = parseInt(semester);
    if (![1, 2].includes(semesterNum)) return res.status(400).json({ message: 'Semester must be 1 or 2' });

    // we no longer block duplicate records since students might repeat exams
    // previous versions prevented duplicates; keep check commented for reference
    // const existingResult = await Result.findOne({ student, subject, examType, year, semester: semesterNum });
    // if (existingResult) return res.status(400).json({ message: 'Result already exists' });

    const result = await Result.create({ ...req.body, publishedBy: req.user.id });
    await result.populate([{ path: 'student', select: 'name studentId email department' }, { path: 'subject', select: 'name code credits' }]);

    await Notification.create({
      user: student,
      title: 'Result Published',
      message: `Your ${year} Semester ${semesterNum} ${examType} result for ${result.subject.name} has been published. Grade: ${result.grade}`,
      type: 'RESULT_PUBLISHED',
      priority: isPoorGrade(result.grade) ? 'HIGH' : 'MEDIUM',
      metadata: { resultId: result._id, subjectId: subject, grade: result.grade, year, semester: semesterNum },
      link: `/results/${result._id}`,
    });

    emailService.sendResultPublicationEmail(result.student, result, 'published').catch(console.error);

    res.status(201).json({ success: true, result });
  } catch (error) {
    // Check if it's a Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map(err => err.message)
        .join(', ');
      return res.status(400).json({ message: messages || 'Validation error' });
    }
    next(error);
  }
};

/**
 * @desc    Update a result and create notification
 * @route   PUT /api/results/:id
 * @access  Private/Admin
 */
exports.updateResult = async (req, res, next) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('student subject');
    if (!result) return res.status(404).json({ message: 'Result not found' });

    await Notification.create({
      user: result.student._id,
      title: 'Result Updated',
      message: `Your ${result.year} Semester ${result.semester} ${result.examType} result for ${result.subject.name} has been updated. New Grade: ${result.grade}`,
      type: 'RESULT_PUBLISHED',
      priority: isPoorGrade(result.grade) ? 'HIGH' : 'MEDIUM',
      metadata: { resultId: result._id, subjectId: result.subject._id, grade: result.grade, year: result.year, semester: result.semester },
      link: `/results/${result._id}`,
    });

    emailService.sendResultPublicationEmail(result.student, result, 'updated').catch(console.error);

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a result
 * @route   DELETE /api/results/:id
 * @access  Private/Admin
 */
exports.deleteResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    await result.deleteOne();
    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.bulkDeleteResults = async (req, res, next) => {
  try {
    const { resultIds } = req.body;
    if (!resultIds || !Array.isArray(resultIds)) {
      return res.status(400).json({ success: false, message: 'Please provide an array of result IDs' });
    }

    await Result.deleteMany({ _id: { $in: resultIds } });

    res.json({
      success: true,
      message: `${resultIds.length} results deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download result PDF file
 * @route   GET /api/results/download/:fileName
 * @access  Private - Authenticated students
 */
exports.downloadResultPDF = async (req, res, next) => {
  try {
    const { fileName } = req.params;
    const path = require('path');
    const fs = require('fs');

    // Validate filename to prevent path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({ message: 'Invalid file name' });
    }

    const filePath = path.join(__dirname, '../uploads/results', fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    // Set proper headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Stream the file to client
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    // Handle stream errors
    stream.on('error', (error) => {
      console.error('Error streaming PDF file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error('Download PDF error:', error);
    next(error);
  }
};

/**
 * @desc    Bulk upload results
 * @route   POST /api/results/bulk-upload
 * @access  Private/Admin
 */
exports.bulkUploadResults = async (req, res, next) => {
  try {
    const { results } = req.body;
    if (!Array.isArray(results) || results.length === 0) return res.status(400).json({ message: 'Provide an array of results' });

    const createdResults = [];
    const errors = [];
    const studentResultsMap = {}; // Group results by student for bulk notification

    for (const data of results) {
      try {
        const student = await User.findOne({ studentId: data.StudentID, role: 'student' });
        if (!student) { errors.push(`Student ${data.StudentID} not found`); continue; }

        const subject = await Subject.findOne({ code: data.SubjectCode });
        if (!subject) { errors.push(`Subject ${data.SubjectCode} not found`); continue; }

        const semester = parseInt(data.Semester);
        const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        if (!validYears.includes(data.Year)) { errors.push(`Invalid year ${data.Year}`); continue; }
        if (![1, 2].includes(semester)) { errors.push(`Invalid semester ${data.Semester}`); continue; }

        // allow duplicates; keep commented check in case we revert
        // const existing = await Result.findOne({ student: student._id, subject: subject._id, examType: data.ExamType.toUpperCase(), year: data.Year, semester });
        // if (existing) { errors.push(`Result exists for student ${data.StudentID}`); continue; }

        const result = await Result.create({
          student: student._id,
          subject: subject._id,
          year: data.Year,
          semester,
          examType: data.ExamType.toUpperCase(),
          marks: parseFloat(data.Marks),
          publishedBy: req.user.id
        });

        // Populate subject before storing in map
        await result.populate('subject', 'name code credits');

        // Ensure grade is calculated
        if (!result.grade) {
          const { calculateGrade } = require('../utils/gradecalculator');
          const gradeInfo = calculateGrade(result.marks);
          result.grade = gradeInfo.grade;
          result.gradePoint = gradeInfo.gradePoint;
          result.status = gradeInfo.status;
          await result.save();
        }

        // Group results by student for bulk notification
        if (!studentResultsMap[student._id]) {
          studentResultsMap[student._id] = {
            student: student,
            results: []
          };
        }
        studentResultsMap[student._id].results.push(result);

        // Still create individual notification for real-time updates
        await Notification.create({
          user: student._id,
          title: 'Result Published',
          message: `Your ${data.Year} Semester ${semester} ${data.ExamType} result for ${subject.name} has been published.`,
          type: 'RESULT_PUBLISHED',
          priority: isPoorGrade(result.grade) ? 'HIGH' : 'MEDIUM',
          metadata: { resultId: result._id, subjectId: subject._id, grade: result.grade, year: data.Year, semester },
          link: `/results/${result._id}`
        });

        createdResults.push(result);
      } catch (err) {
        errors.push(err.message);
      }
    }

    // Send bulk result notification email with PDF to each student
    for (const [studentId, data] of Object.entries(studentResultsMap)) {
      try {
        await emailService.sendBulkResultsNotificationWithPDF(data.student, data.results);
      } catch (emailError) {
        console.error(`Failed to send bulk results email to ${data.student.email}:`, emailError);
        // Don't stop the entire process if one email fails
      }
    }

    res.status(201).json({ success: true, results: createdResults, errors: errors.length ? errors : undefined, message: `${createdResults.length} results uploaded successfully with bulk notifications sent.` });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk create results for a student (JSON)
 * @route   POST /api/results/bulk
 * @access  Private/Admin
 */
exports.bulkCreateResults = async (req, res, next) => {
  try {
    const { student, results } = req.body;
    if (!student) return res.status(400).json({ message: 'Student ID is required' });
    if (!Array.isArray(results) || results.length === 0) return res.status(400).json({ message: 'Provide an array of subjects and marks' });

    const studentObj = await User.findById(student);
    if (!studentObj) return res.status(404).json({ message: 'Student not found' });

    const createdResults = [];
    const errors = [];

    const { calculateGrade } = require('../utils/gradecalculator');

    for (const data of results) {
      try {
        const subject = await Subject.findById(data.subject);
        if (!subject) {
          errors.push(`Subject ${data.subject} not found`);
          continue;
        }

        const gradeInfo = calculateGrade(data.marks);

        const result = await Result.create({
          student: student,
          subject: data.subject,
          year: data.year,
          semester: data.semester,
          examType: data.examType || 'FINAL',
          marks: parseFloat(data.marks),
          grade: gradeInfo.grade,
          gradePoint: gradeInfo.gradePoint,
          status: gradeInfo.status,
          publishedBy: req.user.id
        });

        await result.populate('subject', 'name code credits');

        // Individual notification
        await Notification.create({
          user: student,
          title: 'Result Published',
          message: `Your ${data.year} Semester ${data.semester} result for ${subject.name} has been published. Grade: ${result.grade}`,
          type: 'RESULT_PUBLISHED',
          priority: isPoorGrade(result.grade) ? 'HIGH' : 'MEDIUM',
          metadata: { resultId: result._id, subjectId: data.subject, grade: result.grade, year: data.year, semester: data.semester },
          link: `/results/${result._id}`
        });

        createdResults.push(result);
      } catch (err) {
        errors.push(err.message);
      }
    }

    // Send single consolidated email
    if (createdResults.length > 0) {
      try {
        await emailService.sendBulkResultsNotificationWithPDF(studentObj, createdResults);
      } catch (emailError) {
        console.error('Failed to send consolidated result email:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      results: createdResults,
      errors: errors.length ? errors : undefined,
      message: `Successfully processed ${createdResults.length} results.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student transcript
 * @route   GET /api/results/transcript/:studentId
 * @access  Private
 */
exports.getTranscript = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.params.studentId }).populate('subject', 'name code credits').sort({ year: 1, semester: 1 });
    if (!results.length) return res.status(404).json({ message: 'No results found for this student' });

    const student = await User.findById(req.params.studentId).select('name studentId department');
    const transcript = { student, years: {}, cgpa: 0, totalCredits: 0, totalGradePoints: 0 };
    let overallCredits = 0, overallGradePoints = 0;

    results.forEach(result => {
      if (!transcript.years[result.year]) transcript.years[result.year] = { semesters: {}, yearGpa: 0, totalCredits: 0, totalGradePoints: 0 };
      const yearData = transcript.years[result.year];

      if (!yearData.semesters[result.semester]) yearData.semesters[result.semester] = { subjects: [], gpa: 0, credits: 0, gradePoints: 0 };
      const semData = yearData.semesters[result.semester];

      semData.subjects.push(result);
      semData.credits += result.subject.credits;
      semData.gradePoints += result.subject.credits * result.gradePoint;

      yearData.totalCredits += result.subject.credits;
      yearData.totalGradePoints += result.subject.credits * result.gradePoint;

      overallCredits += result.subject.credits;
      overallGradePoints += result.subject.credits * result.gradePoint;
    });

    Object.values(transcript.years).forEach(yearData => {
      Object.values(yearData.semesters).forEach(sem => { sem.gpa = sem.gradePoints / sem.credits; });
      yearData.yearGpa = yearData.totalGradePoints / yearData.totalCredits;
    });

    transcript.cgpa = overallGradePoints / overallCredits;

    res.json({ success: true, transcript });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department statistics
 * @route   GET /api/results/department/stats
 * @access  Private/Admin
 */
exports.getDepartmentStats = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('_id department');
    const departments = [...new Set(students.map(s => s.department).filter(Boolean))];
    const stats = {};

    for (const dept of departments) {
      const deptStudentIds = students.filter(s => s.department === dept).map(s => s._id);
      const deptResults = await Result.find({ student: { $in: deptStudentIds } }).populate('subject');

      if (!deptResults.length) continue;

      const totalResults = deptResults.length;
      const passedResults = deptResults.filter(r => r.status === 'pass').length;
      const passRate = (passedResults / totalResults) * 100;

      const gradeDistribution = {};
      deptResults.forEach(r => { gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1; });

      const yearPerformance = {};
      ['1st Year', '2nd Year', '3rd Year', '4th Year'].forEach(year => {
        const yearResults = deptResults.filter(r => r.year === year);
        if (yearResults.length) yearPerformance[year] = (yearResults.reduce((sum, r) => sum + r.marks, 0) / yearResults.length).toFixed(2);
      });

      const studentGPAs = {};
      deptResults.forEach(r => {
        if (!studentGPAs[r.student]) studentGPAs[r.student] = { totalPoints: 0, count: 0 };
        studentGPAs[r.student].totalPoints += r.gradePoint;
        studentGPAs[r.student].count += 1;
      });

      const topPerformers = await Promise.all(
        Object.entries(studentGPAs).map(async ([studentId, data]) => {
          const student = await User.findById(studentId).select('name studentId');
          return { name: student?.name, studentId: student?.studentId, cgpa: data.totalPoints / data.count };
        }).filter(s => s.cgpa > 0).sort((a, b) => b.cgpa - a.cgpa).slice(0, 5)
      );

      stats[dept] = {
        studentCount: deptStudentIds.length,
        resultCount: totalResults,
        avgCGPA: (deptResults.reduce((sum, r) => sum + r.gradePoint, 0) / totalResults).toFixed(2),
        passRate: passRate.toFixed(2),
        gradeDistribution,
        yearPerformance,
        topPerformers
      };
    }

    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get yearly statistics
 * @route   GET /api/results/yearly/stats
 * @access  Private/Admin
 */
exports.getYearlyStats = async (req, res, next) => {
  try {
    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const stats = {};

    for (const year of years) {
      const yearResults = await Result.find({ year }).populate('student subject');
      if (!yearResults.length) continue;

      const semesterStats = {};
      for (let sem = 1; sem <= 2; sem++) {
        const semResults = yearResults.filter(r => r.semester === sem);
        if (!semResults.length) continue;

        const avgMarks = semResults.reduce((sum, r) => sum + r.marks, 0) / semResults.length;
        const passedCount = semResults.filter(r => r.status === 'pass').length;

        semesterStats[sem] = {
          resultCount: semResults.length,
          avgMarks: avgMarks.toFixed(2),
          passRate: ((passedCount / semResults.length) * 100).toFixed(2)
        };
      }

      const departments = [...new Set(yearResults.map(r => r.student?.department).filter(Boolean))];
      const deptPerformance = {};
      departments.forEach(dept => {
        const deptResults = yearResults.filter(r => r.student?.department === dept);
        if (deptResults.length) deptPerformance[dept] = (deptResults.reduce((sum, r) => sum + r.marks, 0) / deptResults.length).toFixed(2);
      });

      stats[year] = {
        totalResults: yearResults.length,
        totalStudents: [...new Set(yearResults.map(r => r.student?._id.toString()))].length,
        semesterStats,
        deptPerformance,
        overallAvgMarks: (yearResults.reduce((sum, r) => sum + r.marks, 0) / yearResults.length).toFixed(2),
        passRate: ((yearResults.filter(r => r.status === 'pass').length / yearResults.length) * 100).toFixed(2)
      };
    }

    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};
const Timetable = require('../models/timetable');
const Subject = require('../models/course');
const User = require('../models/user');
const emailService = require('../utils/emailService');
const ModeratorAssignment = require('../models/ModeratorAssignment');

const getDepartmentsForFaculty = (facultyOrDept) => {
  if (!facultyOrDept) return [];
  const query = facultyOrDept.toUpperCase();
  
  const CS_DEPTS = ['Computer Science', 'Physical Science', 'Applied Data Science'];
  const BIZ_DEPTS = ['Languages', 'Business Management', 'Business and Management Studies', 'Languages and Communication Studies'];
  const SIDDHA_DEPTS = ['Unit of Siddha Medicine', 'Siddha Medicine'];

  if (query.includes('APPLIED SCIENCE') || CS_DEPTS.some(d => d.toUpperCase() === query)) return CS_DEPTS;
  if (query.includes('COMMUNICATION') || query.includes('BUSINESS') || BIZ_DEPTS.some(d => d.toUpperCase() === query)) return BIZ_DEPTS;
  if (query.includes('SIDDHA') || SIDDHA_DEPTS.some(d => d.toUpperCase() === query)) return SIDDHA_DEPTS;
  
  return [facultyOrDept]; // Fallback to exact match
};


// @desc    Get upcoming timetables (date >= today)
// @route   GET /api/timetables/upcoming
// @access  Private
exports.getUpcomingTimetables = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    let query = { date: { $gte: today } };

    // Role-based filtering
    const role = req.user.role;
    if (role === 'student') {
      query.status = 'published';
      if (req.user.department) query.department = req.user.department;
    } else if (role === 'dean') {
      query.status = { $in: ['draft', 'pending_dean', 'pending_hod', 'published'] };
      if (req.user.faculty || req.user.department) {
        query.department = { $in: getDepartmentsForFaculty(req.user.faculty || req.user.department) };
      }
    } else if (role === 'hod') {
      query.status = { $in: ['draft', 'pending_hod', 'published'] };
      if (req.user.department) query.department = req.user.department;
    } else if (role === 'lecturer') {
      // Get subjects taught by this lecturer
      const taughtSubjects = await Subject.find({ lecturer: req.user._id }).select('_id');
      const taughtSubjectIds = taughtSubjects.map(s => s._id);
      
      query.$or = [
        { status: 'published', department: req.user.department },
        { supervisors: req.user._id },
        { subject: { $in: taughtSubjectIds } }
      ];
    } else if (['admin', 'registrar', 'exam_officer'].includes(role)) {
      // Management roles see all
      query = { date: { $gte: today } };
    }

    const timetablesRaw = await Timetable.find(query)
      .populate({
        path: 'subject',
        select: 'name code year semester department lecturer category',
        populate: { path: 'lecturer', select: 'name' }
      })
      .populate('supervisors', 'name email department')
      .sort({ date: 1, startTime: 1 })
      .lean();

    // Attach moderator names
    const subjectIds = timetablesRaw.map(t => t.subject?._id).filter(Boolean);
    const moderators = await ModeratorAssignment.find({ subject: { $in: subjectIds } })
      .populate('moderator', 'name')
      .lean();

    const timetables = timetablesRaw.map(t => {
      const modAssign = moderators.find(m => m.subject.toString() === t.subject?._id.toString());
      return {
        ...t,
        moderatorName: modAssign?.moderator?.name || 'Not Assigned'
      };
    });


    res.json({
      success: true,
      count: timetables.length,
      timetables
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all timetables
// @route   GET /api/timetables
// @access  Private
exports.getAllTimetables = async (req, res, next) => {
  try {
    let query = {};

    // Role-based filtering for "All" view
    const role = req.user.role;
    if (role === 'student') {
      query.status = 'published';
      if (req.user.department) query.department = req.user.department;
    } else if (role === 'dean') {
      query.status = { $in: ['draft', 'pending_dean', 'pending_hod', 'published'] };
    } else if (role === 'hod') {
      query.status = { $in: ['draft', 'pending_hod', 'published'] };
      if (req.user.department) query.department = req.user.department;
    } else if (role === 'lecturer') {
       // Get subjects taught by this lecturer
       const taughtSubjects = await Subject.find({ lecturer: req.user._id }).select('_id');
       const taughtSubjectIds = taughtSubjects.map(s => s._id);

      query.$or = [
        { status: 'published', department: req.user.department },
        { supervisors: req.user._id },
        { subject: { $in: taughtSubjectIds } }
      ];
    } else if (['admin', 'registrar', 'exam_officer'].includes(role)) {
      // Management roles see all
      query = {};
    }

    const timetablesRaw = await Timetable.find(query)
      .populate({
        path: 'subject',
        select: 'name code year semester department lecturer category',
        populate: { path: 'lecturer', select: 'name' }
      })
      .populate('supervisors', 'name email department')
      .sort({ date: 1, startTime: 1 })
      .lean();

    // Attach moderator names
    const subjectIds = timetablesRaw.map(t => t.subject?._id).filter(Boolean);
    const moderators = await ModeratorAssignment.find({ subject: { $in: subjectIds } })
      .populate('moderator', 'name')
      .lean();

    const timetables = timetablesRaw.map(t => {
      const modAssign = moderators.find(m => m.subject.toString() === t.subject?._id.toString());
      return {
        ...t,
        moderatorName: modAssign?.moderator?.name || 'Not Assigned'
      };
    });


    res.json({
      success: true,
      count: timetables.length,
      timetables
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single timetable
// @route   GET /api/timetables/:id
// @access  Private
exports.getTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('subject', 'name code year semester')
      .populate('supervisors', 'name email');

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    res.json({ success: true, timetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a timetable entry
// @route   POST /api/timetables
// @access  Private
exports.createTimetable = async (req, res, next) => {
  try {
    const { subject, examType, department, year, semester, date, startTime, endTime, venue } = req.body;

    if (!subject || !department || !date || !startTime || !endTime || !venue) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const timetable = new Timetable({
      subject,
      examType,
      department,
      year,
      semester,
      date,
      startTime,
      endTime,
      venue
    });

    await timetable.save(); // year & semester autofill via pre('save') hook

    const populatedTimetable = await timetable.populate('subject', 'name code year semester');

    res.status(201).json({ success: true, timetable: populatedTimetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a timetable entry
// @route   PUT /api/timetables/:id
// @access  Private
exports.updateTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    const canUpdate = ['exam_officer', 'registrar', 'admin', 'dean', 'hod'].includes(req.user.role);
    if (!canUpdate) {
      return res.status(403).json({ success: false, message: 'Not authorized to update timetables' });
    }

    let fieldsToUpdate = ['subject', 'examType', 'department', 'year', 'semester', 'date', 'startTime', 'endTime', 'venue', 'status', 'supervisors', 'batch'];
    
    // Strict restriction for HOD role
    if (req.user.role === 'hod') {
      fieldsToUpdate = ['batch', 'status', 'supervisors'];
    }

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) timetable[field] = req.body[field];
    });

    await timetable.save(); // pre('save') hook will autofill year/semester if subject changed

    const populatedTimetable = await timetable.populate('subject', 'name code year semester');

    res.json({ success: true, timetable: populatedTimetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a timetable entry
// @route   DELETE /api/timetables/:id
// @access  Private
exports.deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    const canDelete = ['exam_officer', 'registrar', 'admin'].includes(req.user.role);
    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete timetables' });
    }

    await timetable.deleteOne();

    res.json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    next(error);
  }
};
// @desc    Bulk create timetable entries
// @route   POST /api/timetables/bulk
// @access  Private
exports.bulkCreateTimetables = async (req, res, next) => {
  try {
    const { timetables } = req.body;

    if (!timetables || !Array.isArray(timetables) || timetables.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty timetables array' });
    }

    // Validate entries
    for (const entry of timetables) {
      if (!entry.subject || !entry.department || !entry.date || !entry.startTime || !entry.endTime || !entry.venue) {
        return res.status(400).json({ success: false, message: 'Missing required fields in one or more entries' });
      }
    }

    // Create entries one by one to ensure pre('save') hooks run
    const createdTimetables = [];
    const errors = [];

    for (let i = 0; i < timetables.length; i++) {
      const entry = timetables[i];
      try {
        const timetable = new Timetable({
          subject: entry.subject,
          year: entry.year,
          semester: entry.semester,
          examType: entry.examType || 'final',
          department: entry.department,
          date: entry.date,
          startTime: entry.startTime,
          endTime: entry.endTime,
          venue: entry.venue,
          status: entry.status || 'draft'
        });
        await timetable.save();
        createdTimetables.push(timetable);
      } catch (err) {
        console.error(`Error saving timetable entry ${i}:`, err.message);
        errors.push(`Entry ${i} (${entry.subjectCode || 'Unknown'}): ${err.message}`);
      }
    }

    if (errors.length > 0 && createdTimetables.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to create any timetable entries', 
        errors 
      });
    }

    res.status(201).json({
      success: true,
      count: createdTimetables.length,
      partialErrors: errors.length > 0 ? errors : undefined,
      message: `${createdTimetables.length} timetable entries created successfully`
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update timetable status (Workflow)
// @route   PUT /api/timetables/bulk-status
// @access  Private
exports.bulkUpdateTimetableStatus = async (req, res, next) => {
  try {
    const { timetableIds, status, batch } = req.body;
    
    if (!timetableIds || !Array.isArray(timetableIds)) {
      return res.status(400).json({ success: false, message: 'Invalid timetable IDs' });
    }

    const updateData = {};
    if (status) {
      if (!['draft', 'pending_dean', 'pending_hod', 'published'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      updateData.status = status;
    }
    
    if (batch) {
      updateData.batch = batch;
    }

    // Role-based status transition validation (only if status is changing)
    const role = req.user.role;
    if (status) {
      if (status === 'pending_dean' && !['exam_officer', 'registrar', 'admin', 'hod'].includes(role)) {
         return res.status(403).json({ success: false, message: 'Only Exam Officers/HODs can send for Dean approval' });
      }
      if (status === 'pending_hod' && !['dean', 'admin'].includes(role)) {
         return res.status(403).json({ success: false, message: 'Only Deans can approve and send to HOD' });
      }
      if (status === 'published' && !['hod', 'admin'].includes(role)) {
         return res.status(403).json({ success: false, message: 'Only HODs can publish timetables' });
      }
      if (status === 'draft' && !['dean', 'exam_officer', 'registrar', 'admin'].includes(role)) {
         return res.status(403).json({ success: false, message: 'Unauthorized to revert to draft' });
      }
    }

    // Perform update
    const now = Date.now();
    const signature = req.user.signature;

    if (status === 'pending_dean') {
      updateData.examOfficerSignature = signature;
    } else if (status === 'pending_hod') {
      updateData.deanSignature = signature;
      updateData.approvedAtDean = now;
    } else if (status === 'published') {
      updateData.hodSignature = signature;
      updateData.approvedAtHOD = now;
      updateData.publishedAt = now;
    }

    await Timetable.updateMany(
      { _id: { $in: timetableIds } },
      { $set: updateData }
    );

    // Fetch updated timetables for notification
    const updatedTimetables = await Timetable.find({ _id: { $in: timetableIds } })
      .populate('subject', 'name code department');

    // Trigger Notifications
    try {
      if (status === 'pending_dean') {
        const deans = await User.find({ role: 'dean' });
        
        // Group by department to send consolidated PDFs (one PDF per department)
        const groups = {};
        updatedTimetables.forEach(t => {
          const key = t.department || 'General';
          if (!groups[key]) groups[key] = [];
          groups[key].push(t);
        });

        for (const dept in groups) {
          const groupTimetables = groups[dept];
          
          // Determine if it's a single year/semester or mixed
          const years = [...new Set(groupTimetables.map(t => t.year))];
          const semesters = [...new Set(groupTimetables.map(t => t.semester))];

          const metadata = {
            department: dept,
            year: years.length === 1 ? years[0] : 'All Years',
            semester: semesters.length === 1 ? semesters[0] : 'All Semesters',
            examType: groupTimetables[0].examType
          };

          const facultyName = emailService.getFacultyName(dept);
          
          // Route exclusively to the Dean of the associated faculty
          const targetDeans = deans.filter(dean => {
            const deanFaculty = (dean.faculty || '').trim().toUpperCase();
            const deanDept = (dean.department || '').trim().toUpperCase();
            return deanFaculty === facultyName.toUpperCase() || 
                   deanDept === dept.toUpperCase() || 
                   (!dean.faculty && !dean.department); // Fallback to all deans if none assigned
          });

          for (const dean of targetDeans.length > 0 ? targetDeans : deans) {
            await emailService.sendTimetableGroupPendingDean(dean, groupTimetables, metadata);
          }
        }
      } else if (status === 'pending_hod') {
        // Group by department to send consolidated PDFs to HODs
        const groups = {};
        updatedTimetables.forEach(t => {
          const key = t.department || 'General';
          if (!groups[key]) groups[key] = [];
          groups[key].push(t);
        });

        for (const dept in groups) {
          const groupTimetables = groups[dept];
          
          const years = [...new Set(groupTimetables.map(t => t.year))];
          const semesters = [...new Set(groupTimetables.map(t => t.semester))];

          const metadata = {
            department: dept,
            year: years.length === 1 ? years[0] : 'All Years',
            semester: semesters.length === 1 ? semesters[0] : 'All Semesters',
            examType: groupTimetables[0].examType
          };

          const targetHods = await User.find({ role: 'hod', department: dept });
          for (const hod of targetHods) {
            await emailService.sendTimetableGroupPendingHOD(hod, groupTimetables, metadata);
          }
        }
      } else if (status === 'published') {
        // Group by department and year to send consolidated PDFs to students
        const groups = {};
        updatedTimetables.forEach(t => {
          const key = `${t.department || 'General'}_${t.year || 'All'}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(t);
        });

        for (const key in groups) {
          const groupTimetables = groups[key];
          const dept = groupTimetables[0].department || 'General';
          const year = groupTimetables[0].year || 'All';
          const semesters = [...new Set(groupTimetables.map(t => t.semester))];

          const metadata = {
            department: dept,
            year: year,
            semester: semesters.length === 1 ? semesters[0] : 'All Semesters',
            examType: groupTimetables[0].examType
          };

          const facultyName = emailService.getFacultyName(dept);
          const deans = await User.find({ role: 'dean' });
          const targetDeans = deans.filter(dean => {
            const deanFaculty = (dean.faculty || '').trim().toUpperCase();
            const deanDept = (dean.department || '').trim().toUpperCase();
            return deanFaculty === facultyName.toUpperCase() || 
                   deanDept === dept.toUpperCase() || 
                   (!dean.faculty && !dean.department);
          });

          // Fetch all departmental stakeholders + administrative staff
          const departmentalUsers = await User.find({ 
             $or: [
                { department: dept }, // Students, Lecturers, HODs in this dept
                { role: { $in: ['exam_officer', 'registrar', 'admin'] } } // System admins
             ]
          });
          
          const allRecipients = [...departmentalUsers, ...targetDeans];
          const recipientEmails = [...new Set(allRecipients.map(u => u.email).filter(Boolean))];

          if (recipientEmails.length > 0) {
            await emailService.sendTimetableGroupPublished(recipientEmails, groupTimetables, metadata);
          }
        }
      } else if (status === 'draft' || (status === 'pending_dean' && req.user.role === 'hod')) {
        // Rejections
        const examOfficers = await User.find({ role: { $in: ['exam_officer', 'registrar', 'admin'] } });
        for (const t of updatedTimetables) {
          for (const officer of examOfficers) {
            await emailService.sendTimetableRejected(officer, t, req.user.role);
          }
        }
      }
    } catch (emailError) {
      console.error('Email Notification Error:', emailError);
      // Don't fail the request if emails fail
    }

    res.json({
      success: true,
      message: status 
        ? `Successfully updated ${timetableIds.length} timetables to ${status.replace('_', ' ').toUpperCase()}`
        : `Successfully updated ${timetableIds.length} timetables`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign supervisor to timetable
// @route   PUT /api/timetables/:id/supervisor
// @access  Private (HOD)
exports.assignSupervisor = async (req, res, next) => {
  try {
    const { supervisorIds } = req.body;
    
    // Convert single string back to array if sent sequentially instead of an array
    const supervisorsArray = Array.isArray(supervisorIds) ? supervisorIds : [supervisorIds].filter(Boolean);

    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { supervisors: supervisorsArray },
      { new: true }
    ).populate('subject', 'name code year semester').populate('supervisors', 'name email');

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    // Trigger Notifications for supervisors
    try {
      const supervisors = await User.find({ _id: { $in: supervisorsArray } });
      for (const lecturer of supervisors) {
        await emailService.sendTimetableSupervisorAssignment(lecturer, timetable);
      }
    } catch (emailError) {
      console.error('Supervisor Email Error:', emailError);
    }

    res.json({ success: true, timetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Automatically generate timetable entries
// @route   POST /api/timetables/generate
// @access  Private
exports.generateTimetable = async (req, res, next) => {
  try {
    const { 
      startDate: startDateStr, 
      year, 
      semester, 
      department, 
      examType = 'final',
      slots = [
        { startTime: '08:30', endTime: '11:30' },
        { startTime: '13:30', endTime: '16:30' }
      ],
      venues = ['Hall A', 'Hall B', 'Main Auditorium'],
      skipWeekends = true,
      avoidConflicts = true
    } = req.body;

    if (!startDateStr || !year || !semester || !department) {
      return res.status(400).json({ success: false, message: 'Missing required parameters.' });
    }

    // 1. Fetch subjects
    const subjectQuery = { isActive: true };
    if (department && department !== 'all') subjectQuery.department = department;
    if (year && year !== 'all') subjectQuery.year = year;
    if (semester && semester !== 'all') {
      const sNum = parseInt(semester);
      if (!isNaN(sNum)) subjectQuery.semester = sNum;
      else subjectQuery.semester = semester;
    }
    
    const subjects = await Subject.find(subjectQuery).populate('lecturer', 'name').lean();
    
    if (!subjects.length) {
      return res.status(404).json({ success: false, message: 'No subjects found for the selected criteria.' });
    }

    // Fetch all relevant data
    const existingTimetablesAll = await Timetable.find({}).lean();
    const subjectIds = subjects.map(s => s._id);
    const moderators = await ModeratorAssignment.find({ subject: { $in: subjectIds } }).populate('moderator', 'name').lean();
    
    // Sanitize venues to ensure they are strings for filtering
    const safeVenues = (Array.isArray(venues) ? venues : [])
      .filter(v => v && typeof v === 'string')
      .map(v => v.trim());

    // Filter out subjects already scheduled for this specific exam type
    const subjectsToSchedule = subjects.filter(s => {
      return !existingTimetablesAll.some(t => 
        t.subject.toString() === s._id.toString() && 
        t.examType === examType
      );
    });

    if (!subjectsToSchedule.length) {
      return res.status(400).json({ success: false, message: `All subjects for this group are already scheduled for ${examType} exams.` });
    }

    // 2. Prepare reference data for clashes (only if avoidance is on)
    const clashTimetables = avoidConflicts ? await Timetable.find({ 
      date: { $gte: new Date(startDateStr) } 
    }).lean() : [];

    // 3. Algorithm
    const generatedEntries = [];
    const batchLastDate = {};
    const startDate = new Date(startDateStr);
    let currentDate = new Date(startDate);
    
    // Safety break
    let daysTried = 0;
    const maxDays = 90;

    // We keep trying until all subjects are scheduled or we hit maxDays
    const remainingSubjects = [...subjectsToSchedule];

    while (remainingSubjects.length > 0 && daysTried < maxDays) {
      const day = currentDate.getDay();
      if (skipWeekends && (day === 0 || day === 6)) { // Skip Sat/Sun
        currentDate.setDate(currentDate.getDate() + 1);
        daysTried++;
        continue;
      }

      // Try each subject for today
      for (let i = 0; i < remainingSubjects.length; i++) {
        const subject = remainingSubjects[i];
        const batchKey = `${subject.department}-${subject.year}-${subject.semester}`;

        // 2-day gap rule (Batch specific)
        if (batchLastDate[batchKey]) {
          const diffDays = Math.ceil(Math.abs(currentDate - batchLastDate[batchKey]) / (1000 * 60 * 60 * 24));
          if (diffDays < 3) continue; // Need at least 2 days in between
        }

        // Try to find a slot and venue today
        let foundSlot = false;
        for (const slot of slots) {
          // Intelligent Venue Selection: Prioritize Labs for Practicals
          let prioritizedVenues = [...safeVenues];
          const subName = (subject.name || '').toLowerCase();
          const subCat = subject.category || '';
          
          const isPractical = 
            ['Practical', 'Clinical', 'Project'].includes(subCat) || 
            subName.includes('practical') || 
            subName.includes('lab') ||
            subName.includes('internship') ||
            subName.includes('clinical') ||
            subName.includes('practical work');

          if (isPractical) {
            const isClinical = subCat === 'Clinical' || subName.includes('clinical');
            // Try to find a matching specialized venue first
            let matchedVenues = [];
            if (isClinical) {
              matchedVenues = safeVenues.filter(v => 
                v.toLowerCase().includes('clinic') || 
                v.toLowerCase().includes('hospital') || 
                v.toLowerCase().includes('ward')
              );
            }
            
            // Fallback to labs for any practical/clinical work if no specific clinic found
            if (matchedVenues.length === 0) {
              matchedVenues = safeVenues.filter(v => 
                v.toLowerCase().includes('lab') || 
                v.toLowerCase().includes('computer')
              );
            }

            if (matchedVenues.length > 0) {
              prioritizedVenues = matchedVenues;
            } else {
              // Strict fallback: force a practical environment
              prioritizedVenues = isClinical ? ['Clinical Ward'] : ['Computer Laboratory'];
            }
          } else {
            // For lectures/other (Theory, General, Management), avoid labs if there are halls available
            const halls = safeVenues.filter(v => 
              !v.toLowerCase().includes('lab') && 
              !v.toLowerCase().includes('computer') &&
              !v.toLowerCase().includes('clinic')
            );
            if (halls.length > 0) prioritizedVenues = halls;
          }

          for (const v of prioritizedVenues) {
            // Check clash with DB or already generated
            const hasClash = avoidConflicts && (clashTimetables.some(t => {
              const tDateStr = new Date(t.date).toISOString().split('T')[0];
              const currDateStr = currentDate.toISOString().split('T')[0];
              return tDateStr === currDateStr && t.startTime === slot.startTime && t.venue === v;
            }) || generatedEntries.some(t => {
              const tDateStr = new Date(t.date).toISOString().split('T')[0];
              const currDateStr = currentDate.toISOString().split('T')[0];
              return tDateStr === currDateStr && t.startTime === slot.startTime && t.venue === v;
            }));

            if (!hasClash) {
              const modAssign = moderators.find(m => m.subject.toString() === subject._id.toString());
              generatedEntries.push({
                subject: subject._id,
                subjectCode: subject.code,
                subjectName: subject.name,
                year: subject.year,
                semester: subject.semester,
                department: subject.department,
                lecturerName: subject.lecturer?.name || 'Not Assigned',
                moderatorName: modAssign?.moderator?.name || 'Not Assigned',
                examType,
                date: new Date(currentDate),
                startTime: slot.startTime,
                endTime: slot.endTime,
                venue: v,
                status: 'draft'
              });
              batchLastDate[batchKey] = new Date(currentDate);
              remainingSubjects.splice(i, 1);
              i--; // Adjust index due to splice
              foundSlot = true;
              break;
            }
          }
          if (foundSlot) break;
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      daysTried++;
    }

    res.json({
      success: true,
      count: generatedEntries.length,
      timetables: generatedEntries,
      unscheduledCount: remainingSubjects.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Timetable PDF
// @route   GET /api/timetables/export
// @access  Private
exports.exportTimetablePDF = async (req, res, next) => {
  try {
    const { department, year, semester, batch } = req.query;
    let query = {};
    if (department && department !== 'all') query.department = department;
    if (year && year !== 'all') query.year = year;
    if (semester && semester !== 'all') query.semester = semester;

    // Role-based filtering
    const role = req.user.role;
    if (role === 'student') {
      query.status = 'published';
      if (req.user.department) query.department = req.user.department;
    } else if (role === 'hod') {
      if (req.user.department) query.department = req.user.department;
    }

    const timetablesRaw = await Timetable.find(query)
      .populate({
        path: 'subject',
        select: 'name code year semester department lecturer category',
        populate: { path: 'lecturer', select: 'name' }
      })
      .sort({ date: 1, startTime: 1 })
      .lean();

    // Attach moderator names
    const subjectIds = timetablesRaw.map(t => t.subject?._id).filter(Boolean);
    const moderators = await ModeratorAssignment.find({ subject: { $in: subjectIds } })
      .populate('moderator', 'name')
      .lean();

    const timetables = timetablesRaw.map(t => {
      const modAssign = moderators.find(m => m.subject.toString() === t.subject?._id.toString());
      return {
        ...t,
        moderatorName: modAssign?.moderator?.name || 'Not Assigned'
      };
    });

    if (timetables.length === 0) {
      return res.status(404).json({ success: false, message: 'No timetables found for the selected criteria' });
    }

    const metadata = { department, year, semester, batch };
    const pdfBuffer = await emailService.generateTimetablePDF(timetables, metadata);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=timetable_${department || 'campus'}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

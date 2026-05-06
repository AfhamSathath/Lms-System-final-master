const fs = require('fs');
const path = require('path');

exports.appendTimetableToHistory = (timetable) => {
  try {
    const dirPath = path.join(__dirname, '..', 'data', 'history');
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Determine filename based on Year, Semester, and Department
    const safeYear = (timetable.year || 'UnknownYear').replace(/\s+/g, '_');
    const safeDept = (timetable.department || 'UnknownDept').replace(/\s+/g, '_');
    const filename = `timetable_history_${safeYear}_Sem${timetable.semester || 'Unknown'}_${safeDept}.csv`;
    const filePath = path.join(dirPath, filename);

    const isNewFile = !fs.existsSync(filePath);

    let csvContent = '';
    
    // Header row if new file
    if (isNewFile) {
      csvContent += 'Subject Name,Subject Code,Department,Year,Semester,Date,Start Time,End Time,Venue,Batch,Supervisors,Completed At,Exam Officer Signature,Dean Signature,HOD Signature\n';
    }

    // Escape fields for CSV
    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    const subjectName = escapeCsv(timetable.subject?.name);
    const subjectCode = escapeCsv(timetable.subject?.code);
    const department = escapeCsv(timetable.department);
    const year = escapeCsv(timetable.year);
    const semester = escapeCsv(timetable.semester);
    const dateStr = escapeCsv(timetable.date ? new Date(timetable.date).toLocaleDateString() : '');
    const startTime = escapeCsv(timetable.startTime);
    const endTime = escapeCsv(timetable.endTime);
    const venue = escapeCsv(timetable.venue);
    const batch = escapeCsv(timetable.batch);
    const supervisors = escapeCsv(timetable.supervisors?.map(s => s.name).join('; '));
    const completedAt = escapeCsv(new Date().toISOString());
    const eoSig = escapeCsv(timetable.examOfficerSignature);
    const deanSig = escapeCsv(timetable.deanSignature);
    const hodSig = escapeCsv(timetable.hodSignature);

    csvContent += `${subjectName},${subjectCode},${department},${year},${semester},${dateStr},${startTime},${endTime},${venue},${batch},${supervisors},${completedAt},${eoSig},${deanSig},${hodSig}\n`;

    fs.appendFileSync(filePath, csvContent);
    console.log(`Successfully appended history to ${filename}`);
  } catch (error) {
    console.error('Error writing to history CSV:', error);
  }
};

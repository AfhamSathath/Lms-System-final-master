import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiBook, FiUsers, FiBarChart2, FiChevronRight, FiSearch, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const LecturerAttendanceDetails = () => {
  const { user } = useAuth();
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [detailViewMode, setDetailViewMode] = useState('summary'); // 'summary' or 'records'

  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [1, 2];

  useEffect(() => {
    if (user?.id) {
      fetchSubjectsAndAttendance();
    }
  }, [user]);

  const fetchSubjectsAndAttendance = async () => {
    setLoading(true);
    try {
      const subjectRes = await api.get(`/api/subjects/lecturer/${user.id}`);
      const fetchedSubjects = subjectRes.data.subjects || [];

      const summary = await Promise.all(fetchedSubjects.map(async (subject) => {
        const enrollmentRes = await api.get(`/api/enrollments/course/${subject._id}`);
        const enrollments = enrollmentRes.data.enrollments || [];
        const totalStudents = enrollments.length;
        const allRecords = enrollments.flatMap((enrollment) => enrollment.attendance || []);
        const presentCount = allRecords.filter((record) => record.status === 'present').length;
        const absentCount = allRecords.filter((record) => record.status === 'absent').length;
        const lateCount = allRecords.filter((record) => record.status === 'late').length;
        const excusedCount = allRecords.filter((record) => record.status === 'excused').length;
        const averageAttendance = totalStudents > 0
          ? Math.round(enrollments.reduce((sum, enrollment) => sum + (enrollment.attendancePercentage || 0), 0) / totalStudents)
          : 0;
        const minAttendance = totalStudents > 0
          ? Math.min(...enrollments.map((enrollment) => enrollment.attendancePercentage || 0))
          : 0;
        const maxAttendance = totalStudents > 0
          ? Math.max(...enrollments.map((enrollment) => enrollment.attendancePercentage || 0))
          : 0;

        return {
          subject,
          enrollments,
          totalStudents,
          averageAttendance,
          minAttendance,
          maxAttendance,
          attendanceRecords: allRecords,
          statusCounts: {
            all: allRecords.length,
            present: presentCount,
            absent: absentCount,
            late: lateCount,
            excused: excusedCount,
          }
        };
      }));

      setAttendanceSummary(summary);
      if (summary.length) {
        setSelectedSubjectId(summary[0].subject._id);
      }
    } catch (error) {
      console.error('Error loading attendance details:', error);
      toast.error('Failed to load lecturer attendance details');
    } finally {
      setLoading(false);
    }
  };

  const selectedSubject = attendanceSummary.find((item) => item.subject._id === selectedSubjectId) || null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-100 text-emerald-700';
      case 'absent': return 'bg-rose-100 text-rose-700';
      case 'late': return 'bg-amber-100 text-amber-700';
      case 'excused': return 'bg-sky-100 text-sky-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      case 'excused': return 'Excused';
      default: return 'All';
    }
  };

  const getFlattenedRecords = () => {
    if (!selectedSubject) return [];
    return selectedSubject.enrollments.flatMap((enrollment) => (enrollment.attendance || []).map((record) => ({
      ...record,
      studentName: enrollment.student?.name || 'Unknown',
      studentId: enrollment.student?.studentId || 'N/A',
      studentEmail: enrollment.student?.email || '',
      enrollmentId: enrollment._id
    })));
  };

  const getStudentSummaries = () => {
    if (!selectedSubject) return [];

    let summaries = selectedSubject.enrollments.map(enrollment => {
      let records = enrollment.attendance || [];
      if (filterDate) {
        records = records.filter(r => new Date(r.date).toISOString().split('T')[0] === filterDate);
      }
      const totalCount = records.length;
      const presentCount = records.filter(r => r.status === 'present').length;
      const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
      return {
        studentName: enrollment.student?.name || 'Unknown',
        studentId: enrollment.student?.studentId || 'N/A',
        studentEmail: enrollment.student?.email || '',
        totalCount,
        presentCount,
        percentage
      };
    });

    if (searchTerm) {
      const normalized = searchTerm.toLowerCase();
      summaries = summaries.filter(s =>
        s.studentName.toLowerCase().includes(normalized) ||
        s.studentId.toLowerCase().includes(normalized)
      );
    }
    return summaries.sort((a, b) => a.studentId.localeCompare(b.studentId));
  };

  const filteredSummary = attendanceSummary.filter((item) => {
    if (selectedYear !== 'all' && item.subject.year !== selectedYear) return false;
    if (selectedSemester !== 'all' && item.subject.semester !== parseInt(selectedSemester)) return false;

    if (!searchTerm) return true;
    const normalized = searchTerm.toLowerCase();
    return item.subject.name?.toLowerCase().includes(normalized)
      || item.subject.code?.toLowerCase().includes(normalized);
  });

  const attendanceRecords = getFlattenedRecords();
  const filteredAttendanceRecords = attendanceRecords
    .filter((record) => statusFilter === 'all' || record.status === statusFilter)
    .filter((record) => !filterDate || new Date(record.date).toISOString().split('T')[0] === filterDate)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 font-outfit">Attendance Details</h1>
        <p className="text-gray-600 mt-2">Review student attendance percentages and session summaries for your subjects.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="bg-white rounded-3xl border border-black shadow-sm p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400 mb-3">Subjects</p>
          <p className="text-3xl font-black text-slate-800">{attendanceSummary.length}</p>
          <p className="text-sm text-slate-500 mt-2">Total courses you teach</p>
        </div>
        <div className="bg-white rounded-3xl border border-black shadow-sm p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400 mb-3">Average Attendance</p>
          <p className="text-3xl font-black text-slate-800">{attendanceSummary.length > 0 ? Math.round(attendanceSummary.reduce((sum, item) => sum + item.averageAttendance, 0) / attendanceSummary.length) : 0}%</p>
          <p className="text-sm text-slate-500 mt-2">Across your current subjects</p>
        </div>
        <div className="bg-white rounded-3xl border border-black shadow-sm p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400 mb-3">Students Monitored</p>
          <p className="text-3xl font-black text-slate-800">{attendanceSummary.reduce((sum, item) => sum + item.totalStudents, 0)}</p>
          <p className="text-sm text-slate-500 mt-2">Total enrollments across your subjects</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl border border-black p-6 mb-8">
        <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Subject Summaries</h2>
            <p className="text-sm text-slate-500 mt-1">Click a subject to review its attendance percentages in detail.</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="border border-black rounded-xl px-4 py-3 text-sm focus:border-indigo-400 focus:ring-indigo-300 focus:ring-2 outline-none">
              <option value="all">All Years</option>
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="border border-black rounded-xl px-4 py-3 text-sm focus:border-indigo-400 focus:ring-indigo-300 focus:ring-2 outline-none">
              <option value="all">All Semesters</option>
              {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <div className="relative flex-grow min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subject..."
                className="w-full pl-10 pr-4 py-3 border border-black rounded-xl focus:border-indigo-400 focus:ring-indigo-300 focus:ring-2 text-sm outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-[0.2em]">
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Students</th>
                <th className="px-6 py-4">Average</th>
                <th className="px-6 py-4">Min</th>
                <th className="px-6 py-4">Max</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummary.map((item) => (
                <tr
                  key={item.subject._id}
                  className={`bg-white border border-black rounded-3xl transition-all ${selectedSubjectId === item.subject._id ? 'shadow-lg bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-6 py-4 align-top">
                    <div className="font-semibold text-slate-800">{item.subject.code || item.subject.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.subject.name}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="font-semibold text-slate-800">{item.totalStudents}</div>
                    <div className="text-xs text-slate-500">students enrolled</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className="inline-flex items-center px-3 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">{item.averageAttendance}%</span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className="inline-flex items-center px-3 py-2 rounded-full bg-rose-100 text-rose-700 text-sm font-semibold">{typeof item.minAttendance === 'number' ? item.minAttendance.toFixed(2) : item.minAttendance}%</span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className="inline-flex items-center px-3 py-2 rounded-full bg-white border border-black text-slate-700 text-sm font-semibold">{typeof item.maxAttendance === 'number' ? item.maxAttendance.toFixed(2) : item.maxAttendance}%</span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <button
                      type="button"
                      onClick={() => setSelectedSubjectId(item.subject._id)}
                      className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-slate-800"
                    >
                      View <FiChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSummary.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No subjects match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSubject ? (
        <div className="bg-white rounded-[2rem] border border-black shadow-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-slate-400">{selectedSubject.subject.code || selectedSubject.subject.courseCode || 'Subject'}</div>
              <h2 className="text-2xl font-bold text-slate-900">{selectedSubject.subject.name}</h2>
              <p className="text-sm text-slate-500 mt-1">Detailed attendance records by status for this course.</p>
            </div>
            <div className="grid grid-cols-4 gap-4 w-full md:w-auto">
              <div className="bg-white rounded-3xl p-4 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Students</p>
                <p className="text-2xl font-black text-slate-900">{selectedSubject.totalStudents}</p>
              </div>
              <div className="bg-white rounded-3xl p-4 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Total Records</p>
                <p className="text-2xl font-black text-slate-900">{selectedSubject.attendanceRecords.length}</p>
              </div>
              <div className="bg-white rounded-3xl p-4 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Average</p>
                <p className="text-2xl font-black text-slate-900">{selectedSubject.averageAttendance}%</p>
              </div>
              <div className="bg-white rounded-3xl p-4 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Filtered</p>
                <p className="text-2xl font-black text-slate-900">{filteredAttendanceRecords.length}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setDetailViewMode('summary')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${detailViewMode === 'summary' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Student Summary
              </button>
              <button
                onClick={() => setDetailViewMode('records')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${detailViewMode === 'records' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                All Records
              </button>
            </div>
            
            <div className="flex items-center gap-2 bg-white border border-black p-1 rounded-xl">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-3">Filter Date:</span>
               <input 
                 type="date" 
                 value={filterDate}
                 onChange={(e) => {
                   const selectedDate = e.target.value;
                   if (!selectedDate) {
                     setFilterDate('');
                     return;
                   }
                   const classExists = attendanceRecords.some(r => new Date(r.date).toISOString().split('T')[0] === selectedDate);
                   if (!classExists) {
                     toast.error("No classes were held on this date", { icon: '📅' });
                   }
                   setFilterDate(selectedDate);
                 }}
                 className="bg-white border-0 py-1.5 px-3 rounded-lg text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-300 outline-none"
               />
               {filterDate && (
                 <button onClick={() => setFilterDate('')} className="px-2 text-rose-500 hover:text-rose-700">Clear</button>
               )}
            </div>
          </div>

            {detailViewMode === 'records' && (
              <div className="flex flex-wrap gap-2">
                {['all', 'present', 'absent', 'late', 'excused'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${statusFilter === status ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {getStatusLabel(status)} ({selectedSubject.statusCounts[status] || 0})
                  </button>
                ))}
              </div>
            )}
          </div>

          {detailViewMode === 'summary' ? (
            <div className="overflow-x-auto rounded-3xl border border-black">
              <table className="min-w-full text-left">
                <thead className="bg-white text-slate-500 text-xs uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Student ID</th>
                    <th className="px-6 py-4">Classes Held</th>
                    <th className="px-6 py-4">Attended</th>
                    <th className="px-6 py-4">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {getStudentSummaries().map((s, idx) => (
                    <tr key={idx} className="border-t border-black hover:bg-white transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{s.studentName}</div>
                        <div className="text-xs text-slate-500">{s.studentEmail}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-600 font-bold">{s.studentId}</td>
                      <td className="px-6 py-4 font-bold text-slate-600 text-sm pl-10">{s.totalCount}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600 text-sm pl-8">{s.presentCount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center min-w-[3.5rem] px-3 py-1.5 rounded-full text-xs font-bold ${s.percentage >= 80 ? 'bg-emerald-100 text-emerald-700' : s.percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {s.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {getStudentSummaries().length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">No students found matching summary parameters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : filteredAttendanceRecords.length > 0 ? (
            <div className="overflow-x-auto rounded-3xl border border-black">
              <table className="min-w-full text-left">
                <thead className="bg-white text-slate-500 text-xs uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Student ID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">HOD Reviewed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendanceRecords.map((record, index) => (
                    <tr key={`${record.enrollmentId}-${index}`} className="border-t border-black hover:bg-white transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-700">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{record.studentName}</div>
                        <div className="text-xs text-slate-500">{record.studentEmail}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-500">{record.studentId}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(record.status)}`}>
                          {getStatusLabel(record.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-[1.5rem] p-12 text-center">
              <p className="text-slate-500">No attendance records found for the selected status.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black shadow-2xl p-8 text-center">
          <p className="text-slate-500">Select a subject to see attendance details.</p>
        </div>
      )}
    </div>
  );
};

export default LecturerAttendanceDetails;

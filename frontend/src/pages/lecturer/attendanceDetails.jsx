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

  const filteredSummary = attendanceSummary.filter((item) => {
    if (!searchTerm) return true;
    const normalized = searchTerm.toLowerCase();
    return item.subject.name?.toLowerCase().includes(normalized)
      || item.subject.code?.toLowerCase().includes(normalized);
  });

  const attendanceRecords = getFlattenedRecords();
  const filteredAttendanceRecords = attendanceRecords
    .filter((record) => statusFilter === 'all' || record.status === statusFilter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 font-outfit">Attendance Details</h1>
        <p className="text-gray-600 mt-2">Review student attendance percentages and session summaries for your subjects.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400 mb-3">Subjects</p>
          <p className="text-3xl font-black text-slate-800">{attendanceSummary.length}</p>
          <p className="text-sm text-slate-500 mt-2">Total courses you teach</p>
        </div>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400 mb-3">Average Attendance</p>
          <p className="text-3xl font-black text-slate-800">{attendanceSummary.length > 0 ? Math.round(attendanceSummary.reduce((sum, item) => sum + item.averageAttendance, 0) / attendanceSummary.length) : 0}%</p>
          <p className="text-sm text-slate-500 mt-2">Across your current subjects</p>
        </div>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400 mb-3">Students Monitored</p>
          <p className="text-3xl font-black text-slate-800">{attendanceSummary.reduce((sum, item) => sum + item.totalStudents, 0)}</p>
          <p className="text-sm text-slate-500 mt-2">Total enrollments across your subjects</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Subject Summaries</h2>
            <p className="text-sm text-slate-500 mt-1">Click a subject to review its attendance percentages in detail.</p>
          </div>
          <div className="relative max-w-md w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by subject code or name"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:border-indigo-400 focus:ring-indigo-300 focus:ring-2"
            />
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
                  className={`bg-white border border-slate-200 rounded-3xl transition-all ${selectedSubjectId === item.subject._id ? 'shadow-lg bg-indigo-50' : 'hover:bg-slate-50'}`}
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
                    <span className="inline-flex items-center px-3 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">{typeof item.maxAttendance === 'number' ? item.maxAttendance.toFixed(2) : item.maxAttendance}%</span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <button
                      type="button"
                      onClick={() => setSelectedSubjectId(item.subject._id)}
                      className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800"
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
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-slate-400">{selectedSubject.subject.code || selectedSubject.subject.courseCode || 'Subject'}</div>
              <h2 className="text-2xl font-bold text-slate-900">{selectedSubject.subject.name}</h2>
              <p className="text-sm text-slate-500 mt-1">Detailed attendance records by status for this course.</p>
            </div>
            <div className="grid grid-cols-4 gap-4 w-full md:w-auto">
              <div className="bg-slate-50 rounded-3xl p-4 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Students</p>
                <p className="text-2xl font-black text-slate-900">{selectedSubject.totalStudents}</p>
              </div>
              <div className="bg-slate-50 rounded-3xl p-4 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Total Records</p>
                <p className="text-2xl font-black text-slate-900">{selectedSubject.attendanceRecords.length}</p>
              </div>
              <div className="bg-slate-50 rounded-3xl p-4 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Average</p>
                <p className="text-2xl font-black text-slate-900">{selectedSubject.averageAttendance}%</p>
              </div>
              <div className="bg-slate-50 rounded-3xl p-4 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Filtered</p>
                <p className="text-2xl font-black text-slate-900">{filteredAttendanceRecords.length}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {['all', 'present', 'absent', 'late', 'excused'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {getStatusLabel(status)} ({selectedSubject.statusCounts[status] || 0})
              </button>
            ))}
          </div>

          {filteredAttendanceRecords.length > 0 ? (
            <div className="overflow-x-auto rounded-3xl border border-slate-200">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Student ID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Student Confirmed</th>
                    <th className="px-6 py-4">HOD Reviewed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendanceRecords.map((record, index) => (
                    <tr key={`${record.enrollmentId}-${index}`} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
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
                      <td className="px-6 py-4 text-sm text-slate-700">{record.studentConfirmed ? 'Yes' : 'No'}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{record.updatedByHOD ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-[1.5rem] p-12 text-center">
              <p className="text-slate-500">No attendance records found for the selected status.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-8 text-center">
          <p className="text-slate-500">Select a subject to see attendance details.</p>
        </div>
      )}
    </div>
  );
};

export default LecturerAttendanceDetails;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiTrendingUp, FiUser, FiBook, FiSearch, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

const HodProgress = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectEnrollments, setSubjectEnrollments] = useState([]);
  const [fetchingAttendance, setFetchingAttendance] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const departmentKey = user?.department;
      if (!departmentKey) {
        toast.error('Department not found in your profile');
        setLoading(false);
        return;
      }

      const res = await api.get(`/api/lecturer-assignments/department/${encodeURIComponent(departmentKey)}`);
      setAssignments(res.data.data || []);
    } catch (err) {
      console.error('Error fetching assignments', err);
      toast.error('Failed to load teaching progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user]);

  const handleViewAttendance = async (assignment) => {
    setSelectedSubject(assignment.subject);
    setShowAttendanceModal(true);
    setFetchingAttendance(true);
    try {
      const res = await api.get(`/api/enrollments/course/${assignment.subject._id}`);
      setSubjectEnrollments(res.data.enrollments || []);
    } catch (err) {
      console.error('Error fetching student attendance', err);
      toast.error('Failed to load student attendance details');
    } finally {
      setFetchingAttendance(false);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch =
      (a.subject?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.lecturer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.subject?.code || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesYear = selectedYear === 'all' || a.academicYear === selectedYear;

    return matchesSearch && matchesYear;
  });

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-2">Department Teaching Progress</h1>
          <p className="text-slate-500 font-medium italic">Monitoring syllabus coverage across all subjects in <span className="text-indigo-600 font-bold">{user?.department}</span></p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-[2rem] border border-black p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search lecturer or subject..."
                className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 w-full transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 w-full transition-all appearance-none cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="all">All Academic Years</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end">
              <button
                onClick={fetchAssignments}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-black p-20 text-center">
            <FiBook size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">No active assignments found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredAssignments.map((a, idx) => (
              <div
                key={a._id}
                className="bg-white rounded-[2.5rem] border border-black p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-all group-hover:scale-110"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white border border-black rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        <FiBook size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter line-clamp-1">{a.subject?.name || 'N/A'}</h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{a.subject?.code} • {a.academicYear} • Sem {a.semester}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 mb-8 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-black flex items-center justify-center text-slate-400">
                      <FiUser />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest leading-none mb-1">Assigned Lecturer</p>
                      <p className="font-bold text-slate-700">{a.lecturer?.name || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Overall Coverage</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{a.curriculum?.progressPercentage || 0}%</p>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-4 border border-slate-200 p-1 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                          style={{ width: `${a.curriculum?.progressPercentage || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-white border border-black rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Lectures</p>
                        <p className="text-lg font-black text-indigo-600">
                          {a.curriculum?.lecturesCompleted}/{a.curriculum?.totalLectures}
                        </p>
                      </div>
                      <div className="p-4 bg-white border border-black rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Labs</p>
                        <p className="text-lg font-black text-emerald-600">
                          {a.curriculum?.practicalsCompleted}/{a.curriculum?.totalPracticals}
                        </p>
                      </div>
                      <div className="p-4 bg-white border border-black rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Assessments</p>
                        <p className="text-lg font-black text-amber-600">
                          {a.curriculum?.assignmentsCompleted}/{a.curriculum?.totalAssignments}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewAttendance(a)}
                    className="w-full py-3 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                  >
                    View Student Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] border border-black w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-black bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Student Attendance Details</h2>
                <p className="text-[11px] font-black uppercase text-indigo-600 tracking-widest mt-1">
                  {selectedSubject?.code} • {selectedSubject?.name}
                </p>
              </div>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="w-12 h-12 rounded-2xl border border-black flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                <FiSearch className="rotate-45" size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {fetchingAttendance ? (
                <div className="py-20 flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-black uppercase text-slate-400 tracking-widest text-xs">Fetching enrollment data...</p>
                </div>
              ) : subjectEnrollments.length === 0 ? (
                <div className="py-20 text-center">
                  <FiUser size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest">No students enrolled in this subject</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-white sticky top-0 z-10">
                    <div className="col-span-4">Student Info</div>
                    <div className="col-span-2 text-center">Attended</div>
                    <div className="col-span-2 text-center">Absent</div>
                    <div className="col-span-2 text-center">Percentage</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>

                  {subjectEnrollments.map((enrollment) => {
                    const total = enrollment.attendance?.length || 0;
                    const present = enrollment.attendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
                    const absent = total - present;
                    const percentage = enrollment.attendancePercentage || 0;
                    const isLow = percentage < 75;

                    return (
                      <div key={enrollment._id} className="grid grid-cols-12 gap-4 px-6 py-4 border border-black rounded-2xl items-center hover:bg-slate-50 transition-colors">
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100">
                            {enrollment.student?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 line-clamp-1">{enrollment.student?.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{enrollment.student?.studentId}</p>
                          </div>
                        </div>
                        <div className="col-span-2 text-center font-black text-emerald-600">{present}</div>
                        <div className="col-span-2 text-center font-black text-rose-500">{absent}</div>
                        <div className="col-span-2 text-center">
                          <div className="font-black text-slate-800">{percentage}%</div>
                          <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mt-1">
                            <div
                              className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${isLow ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            }`}>
                            {isLow ? 'Low' : 'Good'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-black bg-slate-50 flex justify-between items-center">
              <div className="flex gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border border-black"></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">On Track (≥75%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500 border border-black"></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">At Risk (&lt;75%)</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 italic italic">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodProgress;

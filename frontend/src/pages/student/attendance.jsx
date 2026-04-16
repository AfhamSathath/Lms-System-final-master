import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiBook, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('1st Year');
  const [selectedSemester, setSelectedSemester] = useState(1);

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  useEffect(() => {
    // Filter enrollments by selected year and semester
    const filtered = enrollments.filter(e =>
      e.yearOfStudy === selectedYear &&
      e.semester === parseInt(selectedSemester)
    );
    setFilteredEnrollments(filtered);
  }, [enrollments, selectedYear, selectedSemester]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/enrollments/student/${user.id}`);
      const allEnrollments = response.data.enrollments || [];

      console.log('📚 Student Enrollments:', {
        total: allEnrollments.length,
        details: allEnrollments.map(e => ({
          course: e.course?.courseName,
          semester: e.semester,
          attendance: e.attendance?.length || 0
        }))
      });

      setEnrollments(allEnrollments);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-100 text-emerald-700';
      case 'absent': return 'bg-rose-100 text-rose-700';
      case 'late': return 'bg-amber-100 text-amber-700';
      case 'excused': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <FiCheckCircle className="w-4 h-4" />;
      case 'absent': return <FiXCircle className="w-4 h-4" />;
      case 'late': return <FiClock className="w-4 h-4" />;
      case 'excused': return <FiCheckCircle className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 font-outfit">My Attendance</h1>
        <p className="text-gray-600 mt-2">View your attendance records across all subjects</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-slate-50">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 italic">
            Academic Year
          </label>
          <div className="flex flex-wrap gap-4">
            {years.map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${selectedYear === y
                  ? 'bg-slate-900 text-white shadow-2xl scale-105'
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 border border-indigo-50">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 italic">
            Semester
          </label>
          <div className="flex flex-wrap gap-4">
            {[1, 2].map(sem => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${selectedSemester === sem
                  ? 'bg-indigo-600 text-white shadow-2xl scale-105'
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
              >
                Semester {sem}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Unified Academic Calendar Matrix Container */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 mb-20">
        <div className="bg-slate-50 px-10 py-6 border-b border-slate-100 flex items-center justify-between">
           <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Unified Academic Matrix</h2>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Present</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-rose-500 shadow-lg shadow-rose-200" />
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Absent</span>
              </div>
           </div>
        </div>

        <div className="p-0 overflow-x-auto custom-scrollbar">
          {filteredEnrollments.length > 0 ? (() => {
            // 1. Extract all unique dates where sessions occurred across all subjects
            const allDates = Array.from(new Set(
              filteredEnrollments.flatMap(e => (e.attendance || []).map(r => new Date(r.date).toDateString()))
            )).map(d => new Date(d)).sort((a, b) => a - b);

            return (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-white">
                    <th className="px-6 py-8 text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] border-b border-slate-100 sticky left-0 bg-white z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">Subject</th>
                    <th className="px-6 py-8 text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] border-b border-slate-100 text-center">Type</th>
                    <th className="px-6 py-8 text-[10px] font-black text-slate-800 uppercase tracking-[1px] border-b border-slate-100 text-center whitespace-nowrap">
                       <p className="leading-none mb-1">Percentage</p>
                       <p className="text-[7px] font-bold text-slate-400 normal-case">(Attended/Total)</p>
                    </th>
                    {/* Unique Calendar Dates as Headers */}
                    {allDates.length > 0 ? allDates.map((date, i) => (
                      <th key={i} className="px-3 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center border-b border-slate-100 border-l border-slate-50 min-w-[65px]">
                        <p className="leading-none text-slate-800">{date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</p>
                        <p className="text-[7px] font-bold text-slate-400 mt-1">{date.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                      </th>
                    )) : Array.from({ length: 10 }).map((_, i) => (
                      <th key={i} className="px-3 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100 border-l border-slate-50 min-w-[65px]">
                        --/--
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredEnrollments.map((enrollment, eIdx) => {
                    const attendedCount = (enrollment.attendance || []).filter(r => r.status === 'present' || r.status === 'late' || r.status === 'excused').length;
                    const totalCount = enrollment.attendance?.length || 0;
                    const percentage = totalCount > 0 ? (attendedCount / totalCount * 100).toFixed(0) : '0';

                    return (
                      <tr key={eIdx} className="hover:bg-slate-50 transition-colors duration-300">
                        <td className="px-6 py-6 sticky left-0 bg-white z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] border-r border-slate-50 group-hover:bg-slate-50 transition-colors">
                          <p className="text-xs font-black text-slate-900 leading-none mb-1 tracking-tight">{enrollment.course?.code}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{enrollment.course?.name}</p>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[8px] font-black rounded-full uppercase tracking-widest">
                            {enrollment.course?.category || 'Theory'}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="flex flex-col items-center">
                             <p className={`text-sm font-black leading-none mb-1 ${parseInt(percentage) < 75 ? 'text-rose-600' : 'text-slate-900'}`}>{percentage}%</p>
                             <p className="text-[8px] font-bold text-slate-400">({attendedCount}/{totalCount})</p>
                          </div>
                        </td>
                        {/* Session Mapping based on Date */}
                        {allDates.length > 0 ? allDates.map((date, dIdx) => {
                          const record = (enrollment.attendance || []).find(r => new Date(r.date).toDateString() === date.toDateString());
                          const isPresent = record?.status === 'present' || record?.status === 'late' || record?.status === 'excused';
                          const isAbsent = record?.status === 'absent';
                          const isHODVerified = !!record?.updatedByHOD;

                          return (
                            <td key={dIdx} className="px-2 py-6 text-center border-l border-slate-50">
                              {record ? (
                                <div className="flex justify-center">
                                  {isPresent ? (
                                    <div 
                                      className={`w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm ring-1 ${isHODVerified ? 'ring-indigo-400 ring-offset-1' : 'ring-emerald-200'} transition-transform hover:scale-110`} 
                                      title={`${record.status.toUpperCase()}${isHODVerified ? ' (Verified by HOD)' : ''}${record.hodRemarks ? ': ' + record.hodRemarks : ''}`}
                                    >
                                      <FiCheckCircle className="w-4 h-4 stroke-[3px]" />
                                    </div>
                                  ) : isAbsent ? (
                                    <div 
                                      className={`w-7 h-7 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm ring-1 ${isHODVerified ? 'ring-indigo-400 ring-offset-1' : 'ring-rose-200'} transition-transform hover:scale-110`}
                                      title={`ABSENT${isHODVerified ? ' (Verified by HOD)' : ''}${record.hodRemarks ? ': ' + record.hodRemarks : ''}`}
                                    >
                                      <FiXCircle className="w-4 h-4 stroke-[3px]" />
                                    </div>
                                  ) : (
                                    <div className={`w-7 h-7 rounded-xl bg-slate-100 border ${isHODVerified ? 'border-indigo-400' : 'border-slate-200'}`} />
                                  )}
                                </div>
                              ) : (
                                <div className="h-0.5 w-2 bg-slate-100 mx-auto rounded-full" />
                              )}
                            </td>
                          );
                        }) : Array.from({ length: 10 }).map((_, i) => (
                          <td key={i} className="px-2 py-6 text-center border-l border-slate-50">
                             <div className="h-0.5 w-2 bg-slate-100 mx-auto rounded-full" />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })() : (
            <div className="py-32 flex flex-col items-center justify-center bg-slate-50/50">
              <FiBook className="h-16 w-16 text-slate-200 mb-6" />
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">No Active Enrollments</h3>
              <p className="text-slate-400 font-medium italic mt-2">Registers for {selectedYear} Semester {selectedSemester} will appear here.</p>
            </div>
          )}
        </div>
        
        {/* Footer Progress Indicator */}
        <div className="px-10 py-6 bg-slate-50 flex items-center justify-between border-t border-slate-100">
           <div className="h-2 w-64 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-slate-900 rounded-full shadow-lg" />
           </div>
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attendance Unified Calendar v2.0 • Matrix Engine</p>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;

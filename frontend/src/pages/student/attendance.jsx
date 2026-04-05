import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiBook } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(user?.yearOfStudy || '1st Year');
  const [selectedSemester, setSelectedSemester] = useState(user?.semester || 1);

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  useEffect(() => {
    fetchAttendance();
  }, [user, selectedYear, selectedSemester]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/enrollments/student/${user.id}`);
      let all = response.data.enrollments || [];
      // Filter by selected year and semester
      all = all.filter(e => e.academicYear === selectedYear && e.semester === parseInt(selectedSemester));
      setEnrollments(all);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 font-outfit">My Attendance</h1>
        <p className="text-gray-600 mt-2">Track your presence across all subjects</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] p-8 border border-slate-50 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <FiCalendar className="text-slate-100 h-24 w-24 -mr-8 -mt-8 rotate-12" />
           </div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 italic">Academic Roadmap</label>
           <div className="flex flex-wrap gap-4 relative z-10">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${
                    selectedYear === y ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {y}
                </button>
              ))}
           </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(79,_70,_229,_0.07)] p-8 border border-slate-50 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <FiClock className="text-slate-100 h-24 w-24 -mr-8 -mt-8 -rotate-12" />
           </div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 italic">Semester Selection</label>
           <div className="flex flex-wrap gap-4 relative z-10">
              {[1, 2].map(sem => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${
                    selectedSemester === sem ? 'bg-indigo-600 text-white shadow-2xl scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  Semester {sem}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {enrollments.length > 0 ? enrollments.map((enrollment) => (
          <div key={enrollment._id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">{enrollment.course?.courseCode}</h3>
                  <p className="text-blue-100 font-medium">{enrollment.course?.courseName}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30">
                  <span className="text-white font-bold text-lg">{enrollment.attendancePercentage}%</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6 h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ease-out rounded-full ${
                    enrollment.attendancePercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${enrollment.attendancePercentage}%` }}
                ></div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-700 flex items-center">
                  <FiClock className="mr-2 text-indigo-500" />
                  Recent History
                </h4>
                <div className="flex flex-col gap-3">
                  {enrollment.attendance && enrollment.attendance.length > 0 ? (
                    enrollment.attendance.slice(-5).reverse().map((record, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center">
                          <FiCalendar className="mr-3 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 
                          record.status === 'absent' ? 'bg-rose-100 text-rose-700' : 
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <FiBook className="mx-auto text-gray-300 mb-2 h-8 w-8" />
                      <p className="text-gray-400 text-sm">No attendance records yet</p>
                    </div>
                  )}
                </div>
              </div>

              {enrollment.attendancePercentage < 75 && (
                <div className="mt-6 p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
                  <FiXCircle className="text-rose-500 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="text-rose-700 font-bold text-sm uppercase">At Risk</h5>
                    <p className="text-rose-600 text-xs mt-1">Your attendance is below the 75% requirement. Please contact your lecturer.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )) : (
          <div className="lg:col-span-2 bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-100 shadow-inner">
             <FiBook className="h-16 w-16 text-slate-200 mx-auto mb-6" />
             <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">No Active Enrollments</h4>
             <p className="text-slate-400 font-medium italic mt-2">You don't have any registered subjects for {selectedYear}, Semester {selectedSemester}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;

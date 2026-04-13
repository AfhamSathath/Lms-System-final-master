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
                className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${
                  selectedYear === y 
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
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${
                  selectedSemester === sem 
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

      {/* Attendance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredEnrollments.length > 0 ? (
          filteredEnrollments.map((enrollment) => (
            <AttendanceCard key={enrollment._id} enrollment={enrollment} />
          ))
        ) : (
          <div className="lg:col-span-2 bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-100 shadow-inner">
            <FiBook className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
              No Enrollments
            </h4>
            <p className="text-slate-400 font-medium italic mt-2">
              You don't have any registered courses for this semester.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const AttendanceCard = ({ enrollment }) => {
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

  const attendancePercentage = enrollment.attendancePercentage || 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">
              {enrollment.course?.courseCode}
            </h3>
            <p className="text-blue-100 font-medium">{enrollment.course?.courseName}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30">
            <span className="text-white font-bold text-lg">{attendancePercentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-6 h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full transition-all duration-1000 ease-out rounded-full ${
              attendancePercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            style={{ width: `${attendancePercentage}%` }}
          ></div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-2 mb-6">
          {enrollment.attendance?.length > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              <FiCalendar className="w-3 h-3" />
              {enrollment.attendance.length} Sessions
            </div>
          )}
          {attendancePercentage < 75 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              <FiAlertTriangle className="w-3 h-3" />
              At Risk
            </div>
          )}
        </div>

        {/* Attendance Records */}
        <div className="space-y-3">
          <h4 className="font-bold text-gray-700 flex items-center">
            <FiClock className="mr-2 text-indigo-500" />
            Recent Records
          </h4>

          {enrollment.attendance && enrollment.attendance.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {enrollment.attendance.slice(-10).reverse().map((record, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <FiCalendar className="text-gray-400 w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(record.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(record.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <FiBook className="mx-auto text-gray-300 mb-2 h-8 w-8" />
              <p className="text-gray-400 text-sm">No attendance records yet</p>
            </div>
          )}
        </div>

        {/* Risk Warning */}
        {attendancePercentage < 75 && (
          <div className="mt-6 p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
            <FiAlertTriangle className="text-rose-500 mt-1 flex-shrink-0" />
            <div>
              <h5 className="text-rose-700 font-bold text-sm uppercase">Attendance Warning</h5>
              <p className="text-rose-600 text-xs mt-1">
                Your attendance is below 75%. Contact your lecturer immediately.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;

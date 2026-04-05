import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheck, FiX, FiUsers, FiCalendar, FiArrowLeft, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

const LecturerAttendance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { subjectId, subjectName } = location.state || {};

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({}); // {enrollmentId: status}

  useEffect(() => {
    if (!subjectId) {
      navigate('/lecturer/subjects');
      return;
    }
    fetchStudents();
  }, [subjectId]);

  const fetchStudents = async () => {
    try {
      const response = await api.get(`/api/enrollments/course/${subjectId}`);
      const enrollments = response.data.enrollments || [];
      setStudents(enrollments);
      
      // Initialize with 'present'
      const initial = {};
      enrollments.forEach(e => {
        initial[e._id] = 'present';
      });
      setAttendanceData(initial);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load student list');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (id, status) => {
    setAttendanceData(prev => ({ ...prev, [id]: status }));
  };

  const handleSave = async () => {
    try {
      // We need to call the bulk update or individual updates
      // The current enrollmentController has updateAttendance for a single enrollment
      // I'll simulate a loop or I should add a bulk attendance endpoint
      
      const promises = Object.entries(attendanceData).map(([id, status]) => {
        return api.put(`/api/enrollments/${id}/attendance`, {
          attendance: [{ date: attendanceDate, status }]
        });
      });

      await Promise.all(promises);
      toast.success('Attendance records saved successfully');
      navigate('/lecturer/subjects');
    } catch (error) {
      toast.error('Failed to save some attendance records');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest mb-4 transition-colors"
          >
            <FiArrowLeft className="mr-1" /> Back to Subjects
          </button>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">Mark Attendance</h1>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">{subjectName}</p>
        </div>
        
        <div className="bg-white p-4 rounded-[1.5rem] shadow-xl border border-slate-100 flex items-center gap-6">
           <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Session Date</span>
              <input 
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="border-0 p-0 text-slate-700 font-black text-lg focus:ring-0 bg-transparent"
              />
           </div>
           <div className="h-10 w-[1px] bg-slate-100"></div>
           <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Students</span>
              <span className="text-lg font-black text-slate-700">{students.length}</span>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student ID</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status Selection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                        {student.student?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-700">{student.student?.name}</p>
                        <p className="text-xs text-slate-400">{student.student?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="font-mono text-xs bg-slate-100 px-3 py-1 rounded-lg text-slate-500">{student.student?.studentId}</span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex justify-center items-center gap-3">
                      <button 
                        onClick={() => toggleStatus(student._id, 'present')}
                        className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          attendanceData[student._id] === 'present' 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 scale-105' 
                          : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Present
                      </button>
                      <button 
                        onClick={() => toggleStatus(student._id, 'absent')}
                        className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          attendanceData[student._id] === 'absent' 
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-100 scale-105' 
                          : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Absent
                      </button>
                      <button 
                        onClick={() => toggleStatus(student._id, 'late')}
                        className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          attendanceData[student._id] === 'late' 
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-100 scale-105' 
                          : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Late
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed bottom-10 left-0 right-0 z-50 px-4">
        <div className="container mx-auto flex justify-center">
           <button 
              onClick={handleSave}
              className="bg-slate-900 text-white px-12 py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
           >
              <FiSave className="h-5 w-5" />
              Upload Attendance Sync
           </button>
        </div>
      </div>
    </div>
  );
};

export default LecturerAttendance;

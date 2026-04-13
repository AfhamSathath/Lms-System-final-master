import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheck, FiX, FiUsers, FiCalendar, FiArrowLeft, FiSave, FiLayers, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const LecturerAttendance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { subjectId, subjectName } = location.state || {};

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({}); // {enrollmentId: status}

  useEffect(() => {
    if (!subjectId) {
      navigate('/lecturer/dashboard');
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

  const markAll = (status) => {
    const newData = {};
    students.forEach(student => {
      newData[student._id] = status;
    });
    setAttendanceData(newData);
    toast.success(`All marked as ${status}`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendanceData).map(([id, status]) => ({
         enrollmentId: id,
         status
      }));

      // Bulk Data Update Call
      const response = await api.put(`/api/enrollments/course/${subjectId}/bulk-attendance`, {
         date: attendanceDate,
         records
      });

      if(response.data.success) {
         toast.success(`Successfully uploaded attendance for ${response.data.count} students.`);
         navigate('/lecturer/dashboard');
      } else {
         toast.error("Failed to upload bulk attendance.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sync attendance records');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen pb-32">
      <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-400 hover:text-emerald-600 font-bold text-xs uppercase tracking-widest mb-4 transition-colors group"
          >
            <FiArrowLeft className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Modules
          </button>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">Mark Attendance</h1>
          <p className="text-emerald-600 mt-2 font-bold uppercase tracking-widest text-xs flex items-center">
             <FiLayers className="mr-1.5" /> {subjectName}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
           <div className="flex flex-col items-center sm:items-start">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex items-center"><FiCalendar className="mr-1 inline" /> Session Date</span>
              <input 
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="border border-slate-200 p-2 rounded-xl text-slate-700 font-bold text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 transition-colors"
              />
           </div>
           <div className="hidden sm:block h-12 w-[1px] bg-slate-200"></div>
           <div className="flex flex-col items-center sm:items-start">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex items-center"><FiUsers className="mr-1 inline" /> Students Count</span>
              <span className="text-2xl font-black text-slate-700 bg-emerald-50 text-emerald-700 px-4 py-1 rounded-xl">{students.length}</span>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-8 flex flex-wrap items-center justify-between gap-4">
         <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Bulk Actions Data Update</p>
         <div className="flex gap-3">
            <button onClick={() => markAll('present')} className="px-5 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2">
               <FiCheckCircle /> Mark All Present
            </button>
            <button onClick={() => markAll('absent')} className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2">
               <FiX /> Mark All Absent
            </button>
            <button onClick={() => markAll('late')} className="px-5 py-2.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2">
               <FiAlertCircle /> Mark All Late
            </button>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status Selection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 font-extrabold shadow-sm border border-emerald-200/50">
                        {student.student?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800">{student.student?.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{student.student?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-mono text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 border border-slate-200">{student.student?.studentId}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-max mx-auto">
                      <button 
                        onClick={() => toggleStatus(student._id, 'present')}
                        className={`px-5 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex-1 ${
                          attendanceData[student._id] === 'present' 
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                          : 'bg-transparent text-slate-400 hover:bg-slate-200/50 hover:text-slate-600'
                        }`}
                      >
                        Present
                      </button>
                      <button 
                        onClick={() => toggleStatus(student._id, 'absent')}
                        className={`px-5 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex-1 ${
                          attendanceData[student._id] === 'absent' 
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                          : 'bg-transparent text-slate-400 hover:bg-slate-200/50 hover:text-slate-600'
                        }`}
                      >
                        Absent
                      </button>
                      <button 
                        onClick={() => toggleStatus(student._id, 'late')}
                        className={`px-5 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex-1 ${
                          attendanceData[student._id] === 'late' 
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                          : 'bg-transparent text-slate-400 hover:bg-slate-200/50 hover:text-slate-600'
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
          {students.length === 0 && (
             <div className="py-12 text-center">
                <FiUsers className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                <p className="text-slate-500 font-bold">No students found for this module.</p>
             </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
        <div className="container md:ml-20 mx-auto flex justify-center pointer-events-auto">
           <button 
              onClick={handleSave}
              disabled={saving || students.length === 0}
              className={`text-white px-12 py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 ${saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/30'}`}
           >
              {saving ? (
                <>Syncing...</>
              ) : (
                <>
                  <FiSave className="h-5 w-5" />
                  Upload Data Sync
                </>
              )}
           </button>
        </div>
      </div>
    </div>
  );
};

export default LecturerAttendance;

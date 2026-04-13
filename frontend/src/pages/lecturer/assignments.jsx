import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiEdit3, FiSave, FiArrowLeft, FiUser, FiFileText, FiAward, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const LecturerAssignments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { subjectId, subjectName } = location.state || {};

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [marks, setMarks] = useState({
    continuousAssessment: 0,
    finalExam: 0,
    remarks: ''
  });

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
      setStudents(response.data.enrollments || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const openGrading = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setMarks({
      continuousAssessment: enrollment.continuousAssessment || 0,
      finalExam: enrollment.finalExam || 0,
      remarks: enrollment.remarks || ''
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
       await api.put(`/api/enrollments/${selectedEnrollment._id}/grades`, {
         continuousAssessment: marks.continuousAssessment,
         finalExam: marks.finalExam,
         remarks: marks.remarks
       });
       
       toast.success('Grades updated and student notified!');
       setSelectedEnrollment(null);
       fetchStudents();
    } catch (error) {
       toast.error('Failed to update grades');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-400 hover:text-rose-500 font-bold text-xs uppercase tracking-widest mb-4 transition-colors"
          >
            <FiArrowLeft className="mr-1" /> Back to Dashboard
          </button>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight leading-none uppercase">Academic Grading</h1>
          <p className="text-slate-500 mt-2 font-black uppercase tracking-widest text-[10px]">{subjectName}</p>
        </div>
        
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center gap-6">
           <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 shadow-sm">
              <FiAward className="h-8 w-8" />
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Pass Ratio</p>
              <p className="text-2xl font-black text-slate-700 leading-none">
                {Math.round((students.filter(s => s.totalMarks >= 40).length / (students.length || 1)) * 100)}%
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">CA (40%)</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Final (60%)</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student._id} className={`hover:bg-slate-50/50 transition-colors ${selectedEnrollment?._id === student._id ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                            {student.student?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-700">{student.student?.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{student.student?.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-slate-600 font-bold">{student.continuousAssessment || 0}</td>
                      <td className="px-10 py-6 text-slate-600 font-bold">{student.finalExam || 0}</td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                          student.totalMarks >= 40 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {student.totalMarks?.toFixed(1) || '0.0'}%
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <button 
                          onClick={() => openGrading(student)}
                          className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all hover:scale-110 active:scale-95 shadow-xl shadow-slate-200"
                        >
                          <FiEdit3 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
           {selectedEnrollment ? (
             <div className="bg-white rounded-[4rem] shadow-2xl p-12 border border-slate-100 sticky top-10">
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-16 w-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white">
                      <FiAward className="h-8 w-8" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-800 leading-none mb-1">Grade Student</h3>
                      <p className="text-indigo-600 font-black uppercase tracking-widest text-[10px] leading-none mb-2">{selectedEnrollment.student?.name}</p>
                   </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                   <div className="space-y-6">
                      <div className="group">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 leading-none">Continuous Assessment (0-100)</label>
                         <input 
                           type="number"
                           max="100"
                           min="0"
                           value={marks.continuousAssessment}
                           onChange={(e) => setMarks({ ...marks, continuousAssessment: e.target.value })}
                           className="w-full bg-slate-50 border-0 rounded-3xl p-6 text-slate-800 font-black text-xl focus:ring-4 focus:ring-indigo-100 transition-all"
                         />
                      </div>
                      <div className="group">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 leading-none">Final Examination (0-100)</label>
                         <input 
                           type="number"
                           max="100"
                           min="0"
                           value={marks.finalExam}
                           onChange={(e) => setMarks({ ...marks, finalExam: e.target.value })}
                           className="w-full bg-slate-50 border-0 rounded-3xl p-6 text-slate-800 font-black text-xl focus:ring-4 focus:ring-indigo-100 transition-all"
                         />
                      </div>
                      <div className="group">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 leading-none">Private Remarks</label>
                         <textarea 
                           value={marks.remarks}
                           onChange={(e) => setMarks({ ...marks, remarks: e.target.value })}
                           className="w-full bg-slate-50 border-0 rounded-3xl p-6 text-slate-800 font-medium text-sm focus:ring-4 focus:ring-indigo-100 transition-all min-h-[120px]"
                           placeholder="Feedback for the student..."
                         />
                      </div>
                   </div>

                   <button 
                     type="submit"
                     className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                   >
                     <FiSave className="h-5 w-5" /> Deploy Marks & Update Portal
                   </button>
                   
                   <button 
                     type="button"
                     onClick={() => setSelectedEnrollment(null)}
                     className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors"
                   >
                     Discard Changes
                   </button>
                </form>
             </div>
           ) : (
             <div className="bg-slate-900 rounded-[4rem] shadow-2xl p-16 h-[500px] flex flex-col items-center justify-center text-center sticky top-10">
                <div className="p-8 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/10 mb-8 overflow-hidden group">
                   <FiUser className="h-10 w-10 text-indigo-400 group-hover:scale-125 transition-transform" />
                </div>
                <h4 className="text-2xl font-black text-white mb-3">Academic Registry</h4>
                <p className="text-indigo-200 text-sm font-medium italic opacity-60 px-6">Select a student from the ledger to begin automated grading and student portal update.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default LecturerAssignments;

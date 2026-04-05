import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheck, FiX, FiRefreshCw, FiClock, FiAlertCircle, FiTrendingDown, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminRepeatApprovals = () => {
  const { user } = useAuth();
  const [repeats, setRepeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRepeats();
  }, [user]);

  const fetchRepeats = async () => {
    try {
      const response = await api.get('/api/repeatexams');
      setRepeats(response.data.records || []);
    } catch (error) {
      console.error('Error fetching repeats:', error);
      toast.error('Failed to load repeat registrations');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, reason = '') => {
    setProcessingId(id);
    try {
       await api.put(`/api/repeatexams/${id}/approve`, {
         approvalStatus: status,
         rejectionReason: reason
       });
       
       toast.success(`Request ${status} successfully.`);
       fetchRepeats();
    } catch (error) {
       toast.error('Failed to update status');
    } finally {
       setProcessingId(null);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight font-outfit uppercase tracking-widest leading-none">Repeat Approval Worklist</h1>
        <p className="text-slate-500 mt-2 font-medium italic">Monitor academic regists for course retakes and credit recovery.</p>
      </div>

      <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 px-10">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Student Info</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Course Detail</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Academic State</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Fee Stat</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Work-Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Registry Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {repeats.map((repeat) => (
                <tr key={repeat._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-100 rounded-[1rem] flex items-center justify-center text-indigo-600 font-black">
                           {repeat.student?.name?.charAt(0)}
                        </div>
                        <div>
                           <p className="text-md font-extrabold text-slate-800">{repeat.student?.name}</p>
                           <p className="text-[10px] text-slate-400 font-mono tracking-widest">{repeat.student?.studentId}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-10 py-8">
                     <p className="text-md font-extrabold text-slate-700">{repeat.course?.courseName}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{repeat.course?.courseCode}</p>
                  </td>
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">Fail: {repeat.previousGrade}</div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">SEM {repeat.semester}</p>
                     </div>
                  </td>
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${repeat.feeStatus === 'paid' ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-amber-500 shadow-lg shadow-amber-200 animate-pulse'}`}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{repeat.feeStatus}</span>
                     </div>
                  </td>
                  <td className="px-10 py-8 text-center bg-slate-50/20">
                     <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                        repeat.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        repeat.approvalStatus === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700 animate-pulse'
                      }`}>
                        {repeat.approvalStatus}
                      </span>
                  </td>
                  <td className="px-10 py-8">
                     {repeat.approvalStatus === 'pending' ? (
                       <div className="flex items-center gap-3">
                          <button 
                             onClick={() => updateStatus(repeat._id, 'approved')}
                             disabled={processingId === repeat._id}
                             className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95 shadow-xl shadow-emerald-100"
                          >
                             <FiCheck />
                          </button>
                          <button 
                             onClick={() => {
                               const reason = window.prompt('Enter rejection reason:');
                               if (reason) updateStatus(repeat._id, 'rejected', reason);
                             }}
                             disabled={processingId === repeat._id}
                             className="p-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all hover:scale-110 active:scale-95 shadow-xl shadow-rose-100"
                          >
                             <FiX />
                          </button>
                       </div>
                     ) : (
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Decision Sync'd</p>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRepeatApprovals;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiDollarSign, FiUser, FiBook, FiCheck, FiX, FiInfo, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const BursarRepeatFees = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [feeModal, setFeeModal] = useState({ open: false, app: null, amount: 2000, comments: '' });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/api/repeat-registration/bursar/pending');
      setApplications(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load pending fee allocations');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    setSubmittingId(feeModal.app._id);
    try {
      await api.put(`/api/repeat-registration/${feeModal.app._id}/bursar-allocate-fees`, {
        amount: feeModal.amount,
        comments: feeModal.comments
      });
      toast.success('Fees allocated and student notified');
      setFeeModal({ open: false, app: null, amount: 2000, comments: '' });
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Allocation failed');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 max-w-[1440px] mx-auto min-h-screen bg-slate-50/50">
      <header className="mb-14 text-center">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2 italic underline decoration-indigo-600 decoration-8 underline-offset-[10px]">Repeat Fee Allocation</h1>
        <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px]">Financial Control & Bursary Division</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        <AnimatePresence>
          {applications.map((app) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              key={app._id}
              className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-slate-100 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-16 w-16 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xl transform group-hover:rotate-[360deg] transition-transform duration-1000">
                    <FiTag size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{app.student?.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{app.student?.studentId} • {app.student?.department}</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 mb-8 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1 italic">Subject Unit</p>
                    <p className="text-lg font-extrabold text-slate-700 leading-tight">{app.subjectCode} - {app.subjectName}</p>
                  </div>
                  
                  <div className="flex gap-4 pt-4 border-t border-slate-200/50">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year</p>
                      <p className="text-sm font-bold text-slate-600">{app.academicYear}</p>
                    </div>
                  </div>
                </div>

                {/* Workflow Progress Tracker */}
                <div className="mb-8 grid grid-cols-1 gap-5">
                   {/* Combined Review History for Bursar */}
                   <div className="p-8 bg-slate-900/5 rounded-[4rem] border border-slate-200/50 backdrop-blur-sm group-hover:bg-white transition-all shadow-inner">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50">
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] italic">Review Chain</p>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                           <FiCheck size={10} strokeWidth={4} />
                           <span className="text-[9px] font-black uppercase tracking-widest">3 / 3 Complete</span>
                        </div>
                      </div>

                      <div className="space-y-8">
                        {/* Lecturer Approval */}
                        <div className="relative pl-6 border-l-2 border-emerald-400">
                          <div className="absolute top-0 left-0 w-3 h-3 bg-emerald-400 rounded-full -ml-[7px] border-2 border-white shadow-sm scale-125"></div>
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Lecturer Decision</p>
                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none bg-emerald-50 px-1.5 py-0.5 rounded italic">Approved</p>
                          </div>
                          <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{app.lecturerReviewComments || 'Confirmed eligibility based on attendance.'}"</p>
                        </div>

                        {/* HOD Approval */}
                        <div className="relative pl-6 border-l-2 border-indigo-400">
                          <div className="absolute top-0 left-0 w-3 h-3 bg-indigo-400 rounded-full -ml-[7px] border-2 border-white shadow-sm scale-125"></div>
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">HOD Decision</p>
                            <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none bg-indigo-50 px-1.5 py-0.5 rounded italic">Approved</p>
                          </div>
                          <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{app.hodReviewComments || 'Recommended for registration'}"</p>
                        </div>

                        {/* Exam Officer Decision */}
                        <div className="relative pl-6 border-l-2 border-slate-800">
                          <div className="absolute top-0 left-0 w-3 h-3 bg-slate-800 rounded-full -ml-[7px] border-2 border-white shadow-sm scale-125"></div>
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Exam Office</p>
                            <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest leading-none bg-slate-100 px-1.5 py-0.5 rounded italic">Authorized</p>
                          </div>
                          <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{app.examOfficerReviewComments || 'Cleared for fee allocation'}"</p>
                        </div>
                      </div>
                   </div>
                </div>

                <button
                  onClick={() => setFeeModal({ open: true, app, amount: 2000, comments: '' })}
                  className="mt-auto w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4"
                >
                  <FiDollarSign size={18} strokeWidth={4} />
                  Set Fee Amount
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {applications.length === 0 && (
          <div className="col-span-full py-40 text-center bg-white rounded-[5rem] border-4 border-dashed border-slate-200">
             <div className="h-32 w-32 bg-emerald-50 text-emerald-300 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                <FiCheck size={64} />
             </div>
             <h3 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-4 italic">No Pending Allocations</h3>
             <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">All approved repeat requests have been processed.</p>
          </div>
        )}
      </div>

      {/* Fee Modal */}
      {feeModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, y: 50, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            className="bg-white rounded-[4rem] w-full max-w-xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.4)]"
          >
            <div className="p-12 bg-indigo-600 text-white relative">
              <button 
                onClick={() => setFeeModal({ ...feeModal, open: false })} 
                className="absolute top-10 right-10 h-12 w-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
                >
                <FiX size={24} strokeWidth={3} />
              </button>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic scale-x-110 origin-left mb-2">ALLOCATE REPEAT FEE</h2>
              <p className="font-bold opacity-60 uppercase text-xs tracking-widest leading-loose">Bursary Authorization for {feeModal.app.student?.name}</p>
            </div>

            <div className="p-14">
               <div className="mb-10">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-4 block italic underline decoration-slate-200 decoration-4 underline-offset-8">Required Fee Amount (LKR)</label>
                  <div className="relative">
                     <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 font-black text-2xl tracking-tighter">LKR</span>
                     <input
                        type="number"
                        value={feeModal.amount}
                        onChange={(e) => setFeeModal({ ...feeModal, amount: e.target.value })}
                        className="w-full bg-slate-50 border-4 border-slate-100 rounded-[2rem] py-8 pl-24 pr-8 text-4xl font-black text-indigo-600 focus:border-indigo-500 outline-none transition-all shadow-inner"
                     />
                  </div>
               </div>

               <div className="mb-12">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-4 block italic underline decoration-slate-200 decoration-4 underline-offset-8">Internal Comments / Reference</label>
                  <textarea
                    value={feeModal.comments}
                    onChange={(e) => setFeeModal({ ...feeModal, comments: e.target.value })}
                    placeholder="Enter any internal notes for this allocation..."
                    className="w-full h-32 bg-slate-50 border-4 border-slate-100 rounded-[2rem] p-8 focus:border-indigo-500 outline-none transition-all resize-none text-slate-700 font-bold"
                  />
               </div>

               <button
                  onClick={handleAllocate}
                  disabled={submittingId === feeModal.app._id}
                  className="w-full py-8 rounded-[2.5rem] bg-indigo-600 text-white font-black uppercase text-sm tracking-[0.4em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-6"
               >
                  {submittingId === feeModal.app._id ? 'POSTING LEDGER...' : 'CONFIRM FEE ALLOCATION'}
                  <FiCheck size={24} strokeWidth={4} />
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BursarRepeatFees;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheck, FiX, FiInfo, FiFileText, FiUser, FiCamera, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ExamOfficerVerifyPayments = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [receiptModal, setReceiptModal] = useState({ open: false, app: null, comments: '' });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/api/repeat-registration/exam-officer/payment-pending');
      setApplications(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load pending payment verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (action) => {
    setVerifyingId(receiptModal.app._id);
    try {
      await api.put(`/api/repeat-registration/${receiptModal.app._id}/verify-payment`, {
        action,
        comments: receiptModal.comments
      });
      toast.success(`Payment ${action === 'VERIFY' ? 'verified' : 'rejected'} successfully`);
      setReceiptModal({ open: false, app: null, comments: '' });
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 max-w-[1440px] mx-auto min-h-screen bg-slate-50/50">
      <header className="mb-14">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase mb-2">Payment Verification</h1>
        <p className="text-slate-500 font-medium italic">Validate student repeat fee payments and finalize registration.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence>
          {applications.map((app) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={app._id}
              className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 flex flex-col group relative overflow-hidden h-[450px]"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="h-16 w-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                  {app.student?.name?.charAt(0)}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Fee Result</p>
                  <p className="text-xl font-black text-slate-800 tracking-tight">LKR {app.repeatFeeAmount}</p>
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-800 leading-tight mb-1">{app.student?.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 italic">{app.student?.studentId} • {app.student?.department}</p>

               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 mb-8">
                <div className="flex items-center gap-3">
                   <FiBook className="text-indigo-400" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{app.subjectCode} - {app.subjectName}</p>
                </div>
                <div className="flex items-center gap-3">
                   <FiFileText className="text-indigo-400" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ref: {app.paymentReference || 'N/A'}</p>
                </div>

                {/* Workflow Summary */}
                <div className="pt-4 border-t border-slate-200 mt-4 space-y-4">
                   <div>
                      <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                         <span>Stage 1: Lecturer Approval</span>
                         <span className={app.lecturerReviewStatus === 'APPROVED' ? 'text-emerald-500' : 'text-rose-500'}>{app.lecturerReviewStatus}</span>
                      </div>
                      {app.lecturerReviewComments && (
                         <p className="text-[9px] font-bold text-slate-500 italic line-clamp-1">"{app.lecturerReviewComments}"</p>
                      )}
                   </div>
                   
                   <div>
                      <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                         <span>Stage 2: HOD Review</span>
                         <span className={app.hodReviewStatus === 'APPROVED' ? 'text-indigo-500' : 'text-rose-500'}>{app.hodReviewStatus}</span>
                      </div>
                      {app.hodReviewComments && (
                         <p className="text-[9px] font-bold text-slate-500 italic line-clamp-1">"{app.hodReviewComments}"</p>
                      )}
                   </div>

                   <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <span>Stage 3: Exam Office</span>
                      <span className={app.examOfficerReviewStatus === 'APPROVED' ? 'text-slate-900' : 'text-rose-500'}>{app.examOfficerReviewStatus}</span>
                   </div>
                </div>
              </div>

              <button
                onClick={() => setReceiptModal({ open: true, app, comments: '' })}
                className="mt-auto w-full bg-slate-900 text-white rounded-[1.8rem] py-5 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                Inspect Verification <FiCamera size={14} strokeWidth={3} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {applications.length === 0 && (
          <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border border-slate-200 border-dashed">
             <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
                <FiCheck size={48} strokeWidth={4} />
             </div>
             <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-2">Clean Queue</h3>
             <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">No pending repeat payment verifications at this time.</p>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {receiptModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3.5rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[85vh]"
          >
            {/* Receipt Preview */}
            <div className="md:w-1/2 bg-slate-100 relative overflow-hidden flex items-center justify-center border-r border-slate-200">
               {receiptModal.app.paymentProof ? (
                 <img
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${receiptModal.app.paymentProof}`}
                    alt="Payment Proof Receipt"
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/600x800?text=Receipt+Not+Readable';
                    }}
                 />
               ) : (
                 <div className="text-center p-12">
                   <FiFileText size={64} className="mx-auto mb-6 text-slate-300" />
                   <p className="font-black text-slate-400 uppercase tracking-widest italic text-xs leading-relaxed">No Receipt Uploaded.<br/>Check Payment Reference: {receiptModal.app.paymentReference}</p>
                 </div>
               )}
            </div>

            {/* Review Controls */}
            <div className="md:w-1/2 p-14 h-full flex flex-col bg-white">
               <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">VERIFY LEDGER</h2>
                  <button onClick={() => setReceiptModal({ ...receiptModal, open: false })} className="hover:rotate-90 transition-transform">
                    <FiX size={24} strokeWidth={3} className="text-slate-400" />
                  </button>
               </div>

               <div className="space-y-6 mb-12">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 italic">Submission Info</p>
                     <p className="text-lg font-extrabold text-slate-700 leading-tight mb-2 italic underline decoration-slate-200 decoration-4 underline-offset-4">{receiptModal.app.student?.name}</p>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{receiptModal.app.subjectCode} • {receiptModal.app.subjectName}</p>
                  </div>
                  <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center group overflow-hidden relative">
                     <div className="absolute top-0 right-0 h-10 w-10 bg-white/30 rounded-full -mr-5 -mt-5"></div>
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1 italic">Allocated Fee</p>
                        <p className="text-2xl font-black text-indigo-600 italic tracking-tighter">LKR {receiptModal.app.repeatFeeAmount}</p>
                     </div>
                  </div>
               </div>

               <div className="mb-10">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block italic">Verification Remarks</label>
                  <textarea
                    value={receiptModal.comments}
                    onChange={(e) => setReceiptModal({ ...receiptModal, comments: e.target.value })}
                    placeholder="Enter any verification notes or reasons for rejection..."
                    className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 focus:border-indigo-500 outline-none transition-all resize-none font-bold text-slate-700"
                  />
               </div>

               <div className="mt-auto flex gap-4">
                  <button
                    onClick={() => handleVerify('VERIFY')}
                    disabled={verifyingId === receiptModal.app._id}
                    className="flex-1 py-6 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    {verifyingId === receiptModal.app._id ? 'POSTING...' : 'CONFIRM PAYMENT'}
                    <FiCheck size={18} strokeWidth={4} />
                  </button>
                  <button
                    onClick={() => handleVerify('REJECT')}
                    disabled={verifyingId === receiptModal.app._id}
                    className="px-8 border-2 border-slate-100 text-slate-400 py-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-rose-200 hover:text-rose-500 transition-all active:scale-95"
                  >
                    <FiX size={18} strokeWidth={4} />
                  </button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ExamOfficerVerifyPayments;

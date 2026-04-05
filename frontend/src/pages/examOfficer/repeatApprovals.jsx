import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheck, FiX, FiInfo, FiUser, FiBook, FiSearch, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ExamOfficerRepeatApprovals = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [reviewModal, setReviewModal] = useState({ open: false, app: null, action: null, comments: '' });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/api/repeat-registration/exam-officer/pending');
      setApplications(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load pending applications');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    setProcessingId(reviewModal.app._id);
    try {
      await api.put(`/api/repeat-registration/${reviewModal.app._id}/exam-officer-review`, {
        action: reviewModal.action,
        comments: reviewModal.comments
      });
      toast.success(`Application ${reviewModal.action.toLowerCase()}ed successfully`);
      setReviewModal({ open: false, app: null, action: null, comments: '' });
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-slate-50/30">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Exam Office Authorizations</h1>
        <p className="text-slate-500 font-medium italic mt-2">Third-stage review for repeat registrations before finance allocation.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence>
          {applications.map((app) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={app._id}
              className="bg-white rounded-[3rem] p-10 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                   <div className="flex items-center gap-5">
                      <div className="h-16 w-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl border-2 border-white shadow-xl">
                        {app.student?.name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 leading-none mb-1">{app.student?.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{app.student?.studentId} • {app.student?.department}</p>
                      </div>
                   </div>
                    <div className="text-right flex flex-col items-end gap-1">
                       <span className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                        Stage 3: Authorization
                      </span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/50">
                        <span className="text-[8px] font-black uppercase tracking-widest leading-none">HOD Approved</span>
                        <div className="h-1 w-1 bg-emerald-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 border border-slate-100">
                   <div className="flex flex-col gap-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm"><FiBook className="text-indigo-500" /></div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Subject Unit</p>
                           <h4 className="text-lg font-extrabold text-slate-700">{app.subjectCode} - {app.subjectName}</h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Academic Year: {app.academicYear}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Prev Grade</p>
                            <p className="text-2xl font-black text-rose-500">{app.previousAttempt?.grade}</p>
                         </div>
                         <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Attendance</p>
                            <p className="text-2xl font-black text-emerald-500">{app.previousAttempt?.attendancePercentage}%</p>
                         </div>
                      </div>
                   </div>
                </div>
 
                 {/* Workflow Progress / Review History */}
                 <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Lecturer Review Stage */}
                    <div className="p-5 bg-slate-50/80 rounded-3xl border border-slate-100 flex flex-col justify-between group-hover:bg-white/40 transition-colors shadow-sm">
                       <div className="mb-4">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Lecturer Stage</p>
                          {app.lecturerReviewComments ? (
                             <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{app.lecturerReviewComments}"</p>
                          ) : (
                             <p className="text-[10px] text-slate-300 font-medium italic">No comments provided</p>
                          )}
                       </div>
                       <div className="flex items-center justify-between pointer-events-none">
                          <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${app.lecturerReviewStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                             {app.lecturerReviewStatus}
                          </span>
                          <p className="text-[8px] text-slate-300 font-black">{app.lecturerReviewedAt ? new Date(app.lecturerReviewedAt).toLocaleDateString() : 'N/A'}</p>
                       </div>
                    </div>
 
                    {/* HOD Review Stage */}
                    <div className="p-5 bg-slate-50/80 rounded-3xl border border-slate-100 flex flex-col justify-between group-hover:bg-white/40 transition-colors shadow-sm">
                       <div className="mb-4">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">HOD Stage</p>
                          {app.hodReviewComments ? (
                             <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{app.hodReviewComments}"</p>
                          ) : (
                             <p className="text-[10px] text-slate-300 font-medium italic">No comments provided</p>
                          )}
                       </div>
                       <div className="flex items-center justify-between pointer-events-none">
                          <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${app.hodReviewStatus === 'APPROVED' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                             {app.hodReviewStatus}
                          </span>
                          <p className="text-[8px] text-slate-300 font-black">{app.hodReviewedAt ? new Date(app.hodReviewedAt).toLocaleDateString() : 'N/A'}</p>
                       </div>
                    </div>
                 </div>
 
                 <div className="flex gap-4">
                  <button
                    onClick={() => setReviewModal({ open: true, app, action: 'APPROVE', comments: '' })}
                    className="flex-1 bg-slate-900 text-white rounded-2xl py-5 font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    Authorize <FiCheck strokeWidth={4} />
                  </button>
                  <button
                    onClick={() => setReviewModal({ open: true, app, action: 'REJECT', comments: '' })}
                    className="px-8 bg-white border border-slate-200 text-rose-500 rounded-2xl py-5 font-black text-xs uppercase tracking-widest hover:border-rose-300 transition-all active:scale-95"
                  >
                    <FiX size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {applications.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-200">
             <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
                <FiCheck size={48} />
             </div>
             <h3 className="text-3xl font-black text-slate-700 tracking-tight">QUIET OFFICE</h3>
             <p className="text-slate-400 mt-3 font-medium px-4">There are no pending repeat exam authorizations from HODs at this time.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[3.5rem] w-full max-w-lg overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
          >
            <div className={`p-10 ${reviewModal.action === 'APPROVE' ? 'bg-slate-900' : 'bg-rose-600'} text-white relative`}>
              <button 
                onClick={() => setReviewModal({ ...reviewModal, open: false })} 
                className="absolute top-8 right-8 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                <FiX size={20} />
              </button>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-2">FINAL REVIEW</h2>
              <p className="opacity-70 font-bold uppercase text-[10px] tracking-[0.2em]">{reviewModal.app.student?.name} • REPEAT EXAM</p>
            </div>

            <div className="p-12">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Authorization Notes</label>
               <textarea
                  value={reviewModal.comments}
                  onChange={(e) => setReviewModal({ ...reviewModal, comments: e.target.value })}
                  placeholder="Enter any necessary verification notes or special instructions..."
                  className="w-full h-44 bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 focus:border-indigo-500 outline-none transition-all resize-none text-slate-700 font-medium"
               />

               <div className="mt-10">
                  <button
                    onClick={handleReview}
                    disabled={processingId === reviewModal.app._id}
                    className={`w-full py-6 rounded-3xl text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${
                      reviewModal.action === 'APPROVE' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {processingId === reviewModal.app._id ? 'AUTHORIZING...' : `CONFIRM ${reviewModal.action}`}
                    <FiArrowRight size={20} strokeWidth={3} />
                  </button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ExamOfficerRepeatApprovals;

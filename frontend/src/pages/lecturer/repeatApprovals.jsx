import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheck, FiX, FiInfo, FiUser, FiCalendar, FiBookOpen, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const LecturerRepeatApprovals = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewModal, setReviewModal] = useState({ open: false, app: null, action: null, comments: '' });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/api/repeat-registration/lecturer/pending');
      setApplications(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load pending applications');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    setSubmitting(true);
    try {
      await api.put(`/api/repeat-registration/${reviewModal.app._id}/lecturer-review`, {
        action: reviewModal.action,
        comments: reviewModal.comments
      });
      toast.success(`Application ${reviewModal.action.toLowerCase()}ed successfully`);
      setReviewModal({ open: false, app: null, action: null, comments: '' });
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Review failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Repeat Exam Approvals</h1>
        <p className="text-slate-500 font-medium italic mt-2">Assess student repeat requests based on attendance and performance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {applications.map((app, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={app._id}
              className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden group"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <FiUser size={20} />
                  </div>
                  <div className="text-right">
                    <span className="bg-amber-100 text-amber-700 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full block mb-1 shadow-sm">
                      Worklow Stage 1
                    </span>
                    <p className="text-[8px] font-extrabold text-indigo-400 uppercase tracking-widest italic flex items-center justify-end gap-1">
                      Forwarded to: HOD <FiAlertCircle size={8} />
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-1">{app.student?.name}</h3>
                <p className="text-sm font-medium text-slate-500 mb-6">{app.student?.studentId} • {app.student?.department}</p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <FiBookOpen className="text-indigo-500" />
                    <div className="w-full">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Unit</p>
                        <span className="text-[9px] font-black text-indigo-400 uppercase bg-indigo-50/50 px-2 rounded-lg">{app.academicYear}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{app.subjectCode} - {app.subjectName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Prev Result</p>
                      <p className="text-2xl font-black text-rose-600 italic tracking-tighter">
                        {app.previousAttempt?.grade || 'F'} <span className="text-[10px] opacity-40 ml-1">{app.previousAttempt?.marks || 0}m</span>
                      </p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center relative overflow-hidden group/m">
                      <div className="absolute inset-0 bg-emerald-100/50 -translate-x-full group-hover/m:translate-x-0 transition-transform duration-500"></div>
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Attendance</p>
                        <p className="text-2xl font-black text-emerald-600 italic tracking-tighter">{app.previousAttempt?.attendancePercentage || 0}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Details for Lecturer */}
                  <div className="p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 space-y-4">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <p className="text-slate-400 italic">Repeat Basis</p>
                       <p className="text-indigo-600 underline decoration-indigo-200 decoration-4 underline-offset-4">{app.repeatReason?.replace('_', ' ')}</p>
                     </div>
                     {app.additionalComments && (
                       <div className="pt-3 border-t border-indigo-100/50">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Student Context</p>
                         <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{app.additionalComments}"</p>
                       </div>
                     )}
                     <div className="pt-2 text-right">
                       <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Submitted: {new Date(app.createdAt).toLocaleDateString()}</p>
                     </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-auto">
                  <button
                    onClick={() => setReviewModal({ open: true, app, action: 'APPROVE', comments: '' })}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg active:scale-95"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setReviewModal({ open: true, app, action: 'REJECT', comments: '' })}
                    className="flex-1 bg-white border border-slate-200 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-rose-300 hover:text-rose-500 transition-all active:scale-95"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {applications.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="h-20 w-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheck size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-700">All caught up!</h3>
            <p className="text-slate-400 mt-2 italic">There are no pending repeat exam applications for your subjects.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className={`p-8 ${reviewModal.action === 'APPROVE' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black uppercase tracking-tight">{reviewModal.action} APPLICATION</h2>
                <button onClick={() => setReviewModal({ ...reviewModal, open: false })} className="hover:rotate-90 transition-transform">
                  <FiX size={24} />
                </button>
              </div>
              <p className="opacity-80 font-medium">Add review comments for {reviewModal.app.student?.name}</p>
            </div>

            <div className="p-10">
              <textarea
                value={reviewModal.comments}
                onChange={(e) => setReviewModal({ ...reviewModal, comments: e.target.value })}
                placeholder={`Why are you ${reviewModal.action.toLowerCase()}ing this student?`}
                className="w-full h-40 bg-slate-50 border border-slate-200 rounded-3xl p-6 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-slate-700"
              />
              
              <div className="mt-8 flex gap-4">
                <button
                  onClick={handleReview}
                  disabled={submitting}
                  className={`flex-1 py-5 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 ${
                    reviewModal.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Processing...' : `Confirm ${reviewModal.action}`}
                </button>
                <button
                  onClick={() => setReviewModal({ ...reviewModal, open: false })}
                  className="px-8 py-5 rounded-2xl bg-slate-100 text-slate-500 font-bold uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LecturerRepeatApprovals;

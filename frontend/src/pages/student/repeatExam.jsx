import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle, FiTrendingDown, FiSearch, FiPlus, FiArrowRight, FiInfo, FiLayers, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const StudentRepeatExam = () => {
  const { user } = useAuth();
  const [eligibleSubjects, setEligibleSubjects] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [registerModal, setRegisterModal] = useState({ open: false, subject: null, reason: '', comments: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eligibleRes, myRegsRes] = await Promise.all([
        api.get('/api/repeat-registration/eligible-subjects'),
        api.get('/api/repeat-registration/my-registrations')
      ]);
      setEligibleSubjects(eligibleRes.data.subjects || []);
      setRegistrations(myRegsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load repeat examination data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setSubmittingId(registerModal.subject.subjectId);
    try {
      const response = await api.post('/api/repeat-registration', {
        subject: registerModal.subject.subjectId,
        reason: registerModal.reason,
        academicYear: registerModal.subject.academicYear,
        additionalComments: registerModal.comments
      });
      
      const newRegId = response.data.data._id;
      // Immediately submit for review
      await api.put(`/api/repeat-registration/${newRegId}/submit`);
      
      toast.success('Repeat registration submitted for Lecturer approval');
      setRegisterModal({ open: false, subject: null, reason: '', comments: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'LECTURER_APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'HOD_APPROVED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'EXAM_OFFICER_APPROVED': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'FEE_ALLOCATED': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'PAYMENT_SUBMITTED': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'COMPLETED': return 'bg-slate-900 text-white border-slate-900 shadow-xl';
      case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-8 max-w-[1500px] mx-auto min-h-screen bg-slate-50/30">
      <header className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase leading-none mb-3 italic scale-x-110 origin-left">
            Repeat Examination <span className="text-indigo-600">Portal</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] ml-1">Resit Application Workflow • EUSL</p>
        </div>
        
        <div className="bg-white px-8 py-5 rounded-[2rem] shadow-2xl border border-slate-100 flex items-center gap-6">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Eligibility</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{eligibleSubjects.length} Units</p>
           </div>
           <div className="h-10 w-[2px] bg-slate-100"></div>
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Ongoing</p>
              <p className="text-2xl font-black text-indigo-600 tracking-tighter">{registrations.filter(r => r.registrationStatus !== 'COMPLETED').length}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        <div className="xl:col-span-8">
           <div className="flex items-center gap-4 mb-10 group cursor-default">
              <div className="h-12 w-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                <FiTrendingDown size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic underline decoration-rose-200 decoration-8 underline-offset-[10px]">Failed Subjects (Eligible for Repeat)</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AnimatePresence>
                {eligibleSubjects.map((sub, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={sub.subjectId}
                    className="bg-white p-10 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-2 border-slate-50 hover:border-indigo-100 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                    
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="flex justify-between items-start mb-8">
                        <span className="bg-rose-50 text-rose-600 px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-100 shadow-sm">
                          Low Grade: {sub.previousGrade}
                        </span>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Semester</p>
                          <p className="text-lg font-black text-slate-400">0{sub.semester}</p>
                        </div>
                      </div>

                      <h3 className="text-2xl font-black text-slate-800 tracking-tight italic scale-x-105 origin-left mb-2 group-hover:text-indigo-600 transition-colors">
                        {sub.subjectName}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 italic">{sub.subjectId} • {sub.credits} CREDITS • {sub.academicYear}</p>

                      <div className="mt-auto">
                        <button
                          onClick={() => setRegisterModal({ open: true, subject: sub, reason: '', comments: '' })}
                          className="w-full bg-slate-900 border-4 border-slate-900 text-white rounded-[2rem] py-5 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-white hover:text-slate-900 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4"
                        >
                          Initiate Repeat <FiPlus size={16} strokeWidth={4} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {eligibleSubjects.length === 0 && (
                <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
                   <div className="h-24 w-24 bg-emerald-50 text-emerald-300 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100">
                      <FiCheckCircle size={48} strokeWidth={3} />
                   </div>
                   <h3 className="text-3xl font-black text-slate-700 tracking-tighter uppercase mb-2">Academic Standing: CLEAR</h3>
                   <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">You have no failing grades requiring a repeat registration.</p>
                </div>
              )}
           </div>
        </div>

        <div className="xl:col-span-4">
           <div className="flex items-center gap-4 mb-10 group cursor-default">
              <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center transform group-hover:-rotate-12 transition-transform duration-500">
                <FiClock size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic underline decoration-indigo-200 decoration-8 underline-offset-[10px]">Submission Tracking</h2>
           </div>

           <div className="space-y-8">
              {registrations.map((reg) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={reg._id}
                  className="bg-white rounded-[3rem] p-10 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border-2 border-slate-50 relative overflow-hidden group"
                >
                   <div className={`absolute top-0 right-0 w-2 h-full ${getStatusStyle(reg.registrationStatus).split(' ')[0]} bg-opacity-50`}></div>
                   
                   <div className="flex justify-between items-start mb-6">
                      <span className={`px-4 py-2 border rounded-full font-black text-[9px] uppercase tracking-widest ${getStatusStyle(reg.registrationStatus)}`}>
                        {reg.registrationStatus.replace('_', ' ')}
                      </span>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">#{reg._id.slice(-6).toUpperCase()}</p>
                   </div>

                   <h4 className="font-black text-slate-800 italic scale-x-105 origin-left mb-1 truncate">{reg.subjectName}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{reg.subjectCode}</p>

                   <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-400 italic">Fee Status</span>
                         <span className={reg.feeStatus === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}>{reg.feeStatus}</span>
                      </div>
                      {reg.registrationStatus === 'FEE_ALLOCATED' && (
                        <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Amount Due</span>
                           <span className="text-lg font-black text-indigo-600 tracking-tighter italic">LKR {reg.repeatFeeAmount}</span>
                        </div>
                      )}
                   </div>

                   {reg.registrationStatus === 'FEE_ALLOCATED' && (
                     <a
                        href="/student/fees"
                        className="mt-6 w-full bg-indigo-600 text-white rounded-2xl py-4 font-black text-[10px] uppercase tracking-widest text-center block shadow-xl hover:bg-slate-900 transition-all transform hover:scale-[1.02] active:scale-95"
                     >
                        Pay Fees Now
                     </a>
                   )}

                   {reg.registrationStatus === 'REJECTED' && reg.workflowHistory?.some(h => h.comments) && (
                     <div className="mt-6 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1 italic">Rejection Reason</p>
                        <p className="text-[11px] font-bold text-rose-600 italic">"{reg.workflowHistory.slice().reverse().find(h => h.comments)?.comments}"</p>
                     </div>
                   )}
                </motion.div>
              ))}

              {registrations.length === 0 && (
                <div className="bg-slate-50 rounded-[3rem] p-16 text-center border-2 border-dashed border-slate-200 flex flex-col items-center">
                   <FiLayers size={40} className="text-slate-200 mb-6" />
                   <p className="text-slate-300 font-black italic uppercase tracking-widest text-[10px]">Your application timeline will appear here</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Register Modal */}
      {registerModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[4.5rem] w-full max-w-2xl overflow-hidden shadow-[0_50px_120px_rgba(0,0,0,0.5)] border-4 border-white"
          >
            <div className="p-14 bg-slate-900 text-white relative">
              <button 
                onClick={() => setRegisterModal({ ...registerModal, open: false })}
                className="absolute top-12 right-12 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <FiX size={24} strokeWidth={4} />
              </button>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4 italic leading-tight">Formal Request for Repeat Examination</p>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic scale-x-110 origin-left leading-none decoration-indigo-600 underline-offset-[10px] decoration-8 underline">{registerModal.subject.subjectName}</h2>
              <div className="mt-8 flex gap-6">
                 <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">CODE: {registerModal.subject.subjectId}</p>
                 <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">CREDITS: {registerModal.subject.credits}</p>
                 <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">PREV GRADE: {registerModal.subject.previousGrade}</p>
              </div>
            </div>

            <div className="p-16">
               <div className="mb-10">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-4 block italic underline decoration-slate-100 decoration-4 underline-offset-8">Primary Reason for Repeat</label>
                  <select
                    value={registerModal.reason}
                    onChange={(e) => setRegisterModal({ ...registerModal, reason: e.target.value })}
                    className="w-full bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] py-6 px-8 text-sm font-black text-indigo-600 focus:border-indigo-500 outline-none transition-all shadow-inner uppercase tracking-widest"
                  >
                    <option value="">Select a reason...</option>
                    <option value="FAIL">Academic Failure (F/E/D/C-)</option>
                    <option value="IMPROVE">Grade Improvement (Resit)</option>
                    <option value="ABSENT">Absent with Valid Reason</option>
                    <option value="OTHER">Other Institutional Mandate</option>
                  </select>
               </div>

               <div className="mb-12">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-4 block italic underline decoration-slate-100 decoration-4 underline-offset-8">Additional Context (Optional)</label>
                  <textarea
                    value={registerModal.comments}
                    onChange={(e) => setRegisterModal({ ...registerModal, comments: e.target.value })}
                    placeholder="Provide any additional details for the subject lecturer..."
                    className="w-full h-32 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] p-8 focus:border-indigo-500 outline-none transition-all resize-none text-slate-700 font-bold italic"
                  />
               </div>

               <button
                  onClick={handleRegister}
                  disabled={submittingId === registerModal.subject.subjectId || !registerModal.reason}
                  className="w-full py-8 rounded-[3rem] bg-indigo-600 text-white font-black uppercase text-sm tracking-[0.4em] shadow-[0_20px_60px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-6 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {submittingId === registerModal.subject.subjectId ? 'TRANSMITTING...' : 'SUBMIT APPLICATION'}
                  <FiArrowRight size={24} strokeWidth={4} />
               </button>
               <p className="mt-8 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic max-w-sm mx-auto leading-relaxed">By submitting, you agree that your attendance and previous academic history will be reviewed by the lecturer.</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudentRepeatExam;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle, FiTrendingDown, FiSearch, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StudentRepeatExam = () => {
  const { user } = useAuth();
  const [eligibilityList, setEligibilityList] = useState([]);
  const [myRepeats, setMyRepeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [enrollRes, repeatRes] = await Promise.all([
        api.get(`/api/enrollments/student/${user.id}`),
        api.get('/api/repeatexams/my')
      ]);

      const enrollments = enrollRes.data.enrollments || [];
      // Filter for failing grades needing repeat
      const eligible = enrollments.filter(e => 
        ['F', 'E', 'D', 'C-'].includes(e.grade) && 
        !repeatRes.data.records.some(r => r.course?._id === e.course?._id)
      );
      
      setEligibilityList(eligible);
      setMyRepeats(repeatRes.data.records || []);
    } catch (error) {
      console.error('Error fetching repeat data:', error);
      toast.error('Failed to load academic records');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (enrollment) => {
    setRegisteringId(enrollment._id);
    try {
      await api.post('/api/repeatexams/register', {
        course: enrollment.course?._id,
        previousGrade: enrollment.grade,
        academicYear: enrollment.academicYear,
        semester: enrollment.semester
      });
      
      toast.success('Repeat registration submitted. Please check your Finance tab for fee details.');
      fetchData();
    } catch (error) {
       toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
       setRegisteringId(null);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight font-outfit uppercase">Exam Repeats (Resit)</h1>
        <p className="text-slate-500 mt-2 font-medium italic">Improve your academic standing by repeating failing courses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
           <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3 mb-8">
              <FiTrendingDown className="text-rose-500" />
              Repeat Eligibility
           </h3>
           
           {eligibilityList.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eligibilityList.map((enrollment) => (
                  <div key={enrollment._id} className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 hover:border-rose-200 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                      <FiRefreshCw className="h-32 w-32 -mr-10 -mt-10" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Low Grade: {enrollment.grade}</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sem {enrollment.semester}</p>
                      </div>
                      
                      <h4 className="text-xl font-black text-slate-800 leading-tight mb-2 group-hover:text-rose-600 transition-colors">
                        {enrollment.course?.name || enrollment.course?.courseName}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mb-8 italic">Academic Record: {enrollment.academicYear} • Code: {enrollment.course?.code || enrollment.course?.courseCode}</p>
                      
                      <button 
                        onClick={() => handleRegister(enrollment)}
                        disabled={registeringId === enrollment._id}
                        className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-rose-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                      >
                         {registeringId === enrollment._id ? 'Processing...' : 'Register for Repeat'}
                         <FiPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="bg-white rounded-[4rem] p-20 text-center border-dashed border-2 border-slate-200 shadow-inner">
                <FiCheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
                <h4 className="text-2xl font-black text-slate-700 leading-none">All records are clear.</h4>
                <p className="text-slate-400 font-medium italic mt-2">You have no pending course failures eligible for repeat.</p>
             </div>
           )}
        </div>

        <div className="lg:col-span-4">
           <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3 mb-8">
              <FiClock className="text-indigo-600" />
              Submission History
           </h3>
           
           <div className="space-y-6">
              {myRepeats.map((repeat) => (
                <div key={repeat._id} className="bg-white rounded-[2rem] shadow-xl p-6 border border-slate-100">
                   <div className="flex justify-between items-start mb-4">
                      <p className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        repeat.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        repeat.approvalStatus === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700 animate-pulse'
                      }`}>
                        {repeat.approvalStatus}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{repeat._id.slice(-6)}</p>
                   </div>
                   
                   <h5 className="font-extrabold text-slate-800 text-md truncate leading-tight">
                     {repeat.course?.name || repeat.course?.courseName}
                   </h5>
                   <p className="text-[10px] text-slate-400 font-medium mb-4">{repeat.course?.code || repeat.course?.courseCode} • {repeat.academicYear} • SEM {repeat.semester}</p>
                   
                   <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${repeat.feeStatus === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee: {repeat.feeStatus}</span>
                     </div>
                     {repeat.rejectionReason && (
                       <button 
                         onClick={() => toast.error(`Reason: ${repeat.rejectionReason}`)}
                         className="p-2bg-rose-50 rounded-xl text-rose-500"
                        >
                         <FiAlertCircle />
                       </button>
                     )}
                   </div>
                </div>
              ))}
              
              {myRepeats.length === 0 && (
                <div className="bg-indigo-50/30 rounded-[2rem] p-10 text-center border border-indigo-100 border-dashed">
                  <p className="text-indigo-300 font-bold italic text-sm">Your recent repeat history will appear here.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRepeatExam;

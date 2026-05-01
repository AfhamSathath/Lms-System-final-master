import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiCheckSquare, FiAlertCircle, FiSettings, FiActivity, FiSearch, FiRefreshCcw, FiLayers, FiCalendar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';

const ExamOfficerDashboard = () => {
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExamStats = async () => {
      try {
        const res = await api.get('/api/stats/dashboard');
        setExamData(res.data.data);
      } catch (err) {
        console.error('Exam Board Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExamStats();
  }, []);

  if (loading) return <div className="p-20 text-center font-black text-indigo-600 animate-pulse uppercase tracking-[0.2em]">Verifying Grading Integrity...</div>;

  const stats = [
    { title: 'Total Results Processed', value: examData?.totalResults || 0, icon: FiFileText, color: 'bg-indigo-600', link: '/exam_officer/results' },
    { title: 'Verification Queue', value: examData?.verificationQueue || 0, icon: FiCheckSquare, color: 'bg-violet-600', link: '/exam_officer/exam-tasks' },
    { title: 'Scheduled Exams', value: examData?.scheduledExams || 0, icon: FiCalendar, color: 'bg-rose-500', link: '/exam_officer/timetables' },
    { title: 'Repeat Requests', value: examData?.repeatRequests || 0, icon: FiRefreshCcw, color: 'bg-blue-600', link: '/exam_officer/repeats' },
  ];


  const markingQueue = [
    { id: 'CS301-2026', subject: 'Advanced Algorithms', status: 'Marking in Progress', progress: 65, lecturer: 'Dr. Sarah Smith' },
    { id: 'EE402-2026', subject: 'Power Electronics', status: 'Verification Pending', progress: 100, lecturer: 'Prof. David Lee' },
    { id: 'MA101-2026', subject: 'Calculus I', status: 'Result Finalized', progress: 100, lecturer: 'Dr. Emily Blunt' },
  ];

  return (
    <div className="p-10 bg-[#f4f7fe] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-12">
        <div className="w-full max-w-2xl">
          <h1 className="text-4xl font-black text-[#1B2559] leading-tight uppercase tracking-tight">Examinations Control</h1>
          <p className="text-[#A3AED0] text-lg font-medium flex items-center gap-2">
             <FiLayers /> Grading Integrity & Official Results Certification Portal
          </p>
          <div className="mt-8 relative max-w-lg">
             <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input 
                type="text" 
                placeholder="Search Student Index or Script Batch ID..." 
                className="w-full bg-white pl-14 pr-8 py-4 rounded-3xl shadow-sm border border-black focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold placeholder:text-gray-300"
             />
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <button className="flex-1 md:flex-none px-10 py-4 bg-white text-[#1B2559] font-black rounded-3xl shadow-sm hover:shadow-xl transition-all flex items-center justify-center gap-3">
              <FiSettings /> Assessment Setup
           </button>
           <button className="flex-1 md:flex-none px-10 py-4 bg-[#422AFB] text-white font-black rounded-3xl shadow-2xl shadow-indigo-500/30 hover:bg-[#3311DB] transition-all flex items-center justify-center gap-3">
              <FiRefreshCcw /> Finalize Results
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {stats.map((stat, i) => (
          <Link
            key={i}
            to={stat.link}
            className="block"
          >
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-10 rounded-[45px] shadow-sm border border-black flex items-center gap-8 relative overflow-hidden group hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150">
                 <stat.icon size={100} />
              </div>
              <div className={`${stat.color} p-6 rounded-3xl text-white shadow-xl shadow-indigo-100`}>
                 <stat.icon size={32} />
              </div>
              <div>
                <p className="text-sm font-black text-[#A3AED0] uppercase tracking-widest mb-1">{stat.title}</p>
                <p className="text-3xl font-black text-[#1B2559]">{stat.value}</p>
              </div>
            </motion.div>
          </Link>

        ))}
      </div>

      <div className="bg-white p-12 rounded-[50px] shadow-sm border border-black">
         <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-[#1B2559] uppercase tracking-wide">Live Marking Queue</h2>
            <Link to="/exam_officer/timetables" className="text-indigo-600 font-black cursor-pointer hover:underline">View Global Schedule</Link>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {markingQueue.map((item, i) => (
               <div key={i} className={`p-8 rounded-[40px] border-2 group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all ${
                  item.progress === 100 ? 'bg-emerald-50/30 border-emerald-100' : 'bg-[#f4f7fe]/50 border-[#f4f7fe]'
               }`}>
                  <div className="flex justify-between items-start mb-6">
                     <span className="text-xs font-black text-[#A3AED0] uppercase tracking-widest">{item.id}</span>
                     {item.progress === 100 && <FiCheckSquare className="text-emerald-500 text-xl" />}
                  </div>
                  <h3 className="text-xl font-bold text-[#1B2559] mb-2">{item.subject}</h3>
                  <p className="text-sm font-black text-[#422AFB] mb-6">{item.lecturer}</p>
                  
                  <div className="flex justify-between items-center mb-3">
                     <span className="text-xs font-black text-gray-400">BATCH PROGRESS</span>
                     <span className="text-xs font-black text-indigo-600">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-[#E0E5F2] h-2 rounded-full overflow-hidden mb-8">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        className={`h-full rounded-full ${item.progress === 100 ? 'bg-emerald-500' : 'bg-[#422AFB]'}`}
                     />
                  </div>
                  
                  <button className={`w-full py-4 rounded-2xl font-black transition-all ${
                     item.progress === 100 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-[#1B2559] border border-black'
                  }`}>
                     {item.progress === 100 ? 'Certify Grade Book' : 'Track Marker Daily'}
                  </button>
               </div>
            ))}
         </div>
      </div>
      
      {/* Exam Operations Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-12 rounded-[50px] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group border border-black">
            <FiCalendar className="absolute -right-10 -bottom-10 text-white/10 w-64 h-64 transform rotate-12 group-hover:scale-110 transition-transform" />
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">Exam Timetable</h2>
            <p className="text-indigo-100 text-lg mb-10 font-medium max-w-sm">Schedule assessments, assign halls, and manage examination dates with automated conflict detection.</p>
            <Link 
               to="/exam_officer/timetables" 
               className="inline-flex items-center gap-3 px-10 py-5 bg-white text-indigo-600 font-black rounded-3xl hover:bg-indigo-50 transition-all shadow-xl"
            >
               <FiCalendar /> Manage Timetables
            </Link>
         </div>
         
         <div className="bg-white p-12 rounded-[50px] shadow-sm border border-black flex flex-col justify-center">
            <h2 className="text-2xl font-black text-[#1B2559] mb-4 uppercase tracking-tight">Certification Center</h2>
            <p className="text-[#A3AED0] text-lg mb-8 font-medium">Verify grading accuracy and issue official academic certificates for finalized batches.</p>
            <Link 
               to="/exam_officer/certification" 
               className="inline-flex items-center gap-3 px-10 py-5 bg-[#f4f7fe] text-[#1B2559] font-black rounded-3xl hover:bg-gray-100 transition-all border border-black/5"
            >
               <FiFileText /> Issue Certificates
            </Link>
         </div>
      </div>

    </div>
  );
};

export default ExamOfficerDashboard;

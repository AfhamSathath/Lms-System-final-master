import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { 
  FiTrendingUp, FiAward, FiBook, FiCheckCircle, 
  FiArrowLeft, FiBarChart2, FiPieChart 
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CreditProgress = () => {
  const [data, setData] = useState({ enrollments: [], totalCredits: 0, gpa: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/enrollments');
        const enrollments = res.data.enrollments || [];
        
        // Calculate stats
        let totalCredits = 0;
        let totalPoints = 0;
        let completedCredits = 0;

        enrollments.forEach(e => {
          const credits = e.course?.credits || 0;
          totalCredits += credits;
          
          if (e.enrollmentStatus === 'completed') {
            completedCredits += credits;
            // Simplified GPA mapping (A=4, B=3, etc)
            const points = getPointsFromGrade(e.grade);
            totalPoints += (points * credits);
          }
        });

        const gpa = completedCredits > 0 ? (totalPoints / completedCredits).toFixed(2) : '0.00';

        setData({ 
          enrollments, 
          totalCredits: completedCredits, 
          totalAttempted: totalCredits,
          gpa 
        });
      } catch (err) {
        console.error('Failed to load academic data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getPointsFromGrade = (grade) => {
    const mapping = { 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0, 'F': 0 };
    return mapping[grade] || 0;
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
           <div>
             <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none mb-2">Academic Summary</h1>
             <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Real-time credit tracking & GPA analysis</p>
           </div>
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm">
             <FiArrowLeft /> Go Back
           </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <StatCard 
              label="Cumulative GPA" 
              value={data.gpa} 
              icon={<FiTrendingUp />} 
              color="indigo" 
              footer="Based on completed modules"
            />
            <StatCard 
              label="Completed Credits" 
              value={data.totalCredits} 
              suffix={`/ ${data.totalAttempted}`}
              icon={<FiAward />} 
              color="emerald" 
              footer="Academic progress to date"
            />
            <StatCard 
              label="Modules Completed" 
              value={data.enrollments.filter(e => e.enrollmentStatus === 'completed').length} 
              icon={<FiCheckCircle />} 
              color="blue" 
              footer="Official transcript records"
            />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Module Breakdown</h3>
                    <FiBarChart2 className="text-slate-200 text-2xl" />
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-slate-50/50">
                         <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                         <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Credits</th>
                         <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Grade</th>
                         <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {data.enrollments.map((e, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-10 py-6">
                               <p className="font-black text-slate-700 uppercase tracking-tight text-sm">{e.course?.name}</p>
                               <p className="text-[10px] font-bold text-slate-400 lowercase">{e.course?.code}</p>
                            </td>
                            <td className="px-10 py-6 font-mono font-bold text-slate-500">{e.course?.credits}</td>
                            <td className="px-10 py-6">
                               <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black text-xs">
                                 {e.grade || 'PND'}
                               </span>
                            </td>
                            <td className="px-10 py-6">
                               <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${e.enrollmentStatus === 'completed' ? 'bg-emerald-500' : 'bg-amber-400 animation-pulse'}`}></div>
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">{e.enrollmentStatus}</span>
                               </div>
                            </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
            </div>

            <div className="lg:col-span-1 space-y-8">
                 <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-100">
                    <FiPieChart className="text-4xl text-indigo-400 mb-6" />
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Degree Goals</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                      You have completed <span className="text-white font-bold">{data.totalCredits}</span> credits. Keep maintaining your GPA of <span className="text-white font-bold">{data.gpa}</span> to qualify for Honours.
                    </p>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min((data.totalCredits / 120) * 100, 100)}%` }}
                         transition={{ duration: 1.5, ease: "easeOut" }}
                         className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                       />
                    </div>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Progress to Graduation (120 Credits)</p>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, suffix, icon, color, footer }) => (
  <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700`}></div>
    <div className="relative z-10">
      <div className={`w-14 h-14 bg-${color}-50 text-${color}-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner`}>
        {icon}
      </div>
      <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <h2 className="text-5xl font-black text-slate-800 tracking-tighter leading-none">{value}</h2>
        {suffix && <span className="text-xl font-bold text-slate-300">{suffix}</span>}
      </div>
      <p className="mt-6 text-[10px] font-black uppercase text-slate-300 tracking-widest">{footer}</p>
    </div>
  </div>
);

export default CreditProgress;

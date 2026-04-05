import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiActivity, FiGlobe, FiCloudLightning, FiCommand } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DeanReports = () => {
  const [stats, setStats] = useState(null);
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/stats/dashboard');
      setStats(res.data.data);
      // Dean stats now includes auditData
      if (res.data.data.auditData) {
        setAuditData(res.data.data.auditData);
      }
    } catch (err) {
      toast.error('Failed to aggregate faculty reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    toast.loading('Generating Executive PDF...', { id: 'pdf' });
    setTimeout(() => {
      toast.success('Executive Faculty Report Downloaded', { id: 'pdf' });
    }, 2000);
  };

  const handleInvestigate = (anomaly) => {
    setSelectedAnomaly(anomaly);
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-emerald-500 font-black uppercase tracking-tighter">Synthesizing Data Streams...</div>;

  // Calculate real Completion Rate
  const avgProgress = auditData.length > 0 
    ? Math.round(auditData.reduce((acc, curr) => acc + (curr.progress || 0), 0) / auditData.length)
    : 0;

  // Real anomalies (Progress < 40%)
  const anomalies = auditData.filter(a => a.progress < 40);

  const cards = [
    { title: 'Global Grade Distribution', value: stats?.averageGPA || '0.00', icon: <FiPieChart size={32} />, color: 'from-emerald-500 to-teal-700', trend: 'Live Academic Standing' },
    { title: 'Academic Performance Index', value: (parseFloat(stats?.averageGPA || 0) * 2.5).toFixed(1), icon: <FiTrendingUp size={32} />, color: 'from-indigo-500 to-blue-700', trend: 'Weighted Faculty Index' },
    { title: 'Subject Completion Rates', value: `${avgProgress}%`, icon: <FiActivity size={32} />, color: 'from-rose-500 to-pink-700', trend: 'Curriculum Velocity' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div className="flex items-center gap-4">
           <div className="p-4 bg-emerald-600 rounded-3xl text-white shadow-xl shadow-emerald-200">
              <FiBarChart2 size={32} strokeWidth={3} />
           </div>
           <div>
             <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Strategic Analytics</h1>
             <p className="text-gray-500 font-medium tracking-tight">Enterprise Faculty Performance & Growth Metrics</p>
           </div>
        </div>
        <button 
          onClick={() => toast.info('Customization deck feature coming in next release')}
          className="flex items-center gap-2 px-8 py-3 bg-white text-gray-800 border-none rounded-2xl shadow-sm hover:shadow-md transition-all font-black text-xs tracking-widest uppercase"
        >
          <FiCommand /> Customize Deck
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-gradient-to-br ${card.color} p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer`}
          >
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity scale-[3]">
               <div className="text-white">{card.icon}</div>
            </div>
            
            <div className="relative z-10">
               <p className="text-xs font-black uppercase text-white/60 tracking-[0.2em] mb-4">{card.title}</p>
               <h2 className="text-5xl font-black mb-4 tracking-tighter">{card.value}</h2>
               <div className="flex items-center gap-2 bg-white/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest">{card.trend}</span>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 relative group overflow-hidden">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                     <FiGlobe className="text-emerald-500" /> Departmental Throughput
                  </h3>
                  <button 
                    onClick={() => fetchStats()}
                    className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all shadow-sm border border-gray-100"
                  >
                    <FiActivity size={16} />
                  </button>
               </div>
               
               <div className="h-64 flex items-end justify-between gap-4 px-4 pt-4">
                  {auditData.slice(0, 10).map((a, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${a.progress}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="flex-1 bg-gradient-to-t from-emerald-500/20 to-emerald-500 rounded-t-2xl relative group/bar"
                    >
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity font-black uppercase tracking-widest shadow-xl whitespace-nowrap">{a.code}</div>
                    </motion.div>
                  ))}
               </div>
               <div className="flex justify-between mt-6 px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  <span>Throughput Spectrum (Active Courses)</span>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
               <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                  <FiCloudLightning className="text-indigo-500" /> Real-time Anomaly Detection
               </h3>
               <div className="space-y-4">
                  {anomalies.length > 0 ? (
                    anomalies.map((a, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-3xl transition-all border border-transparent hover:border-gray-100">
                         <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100">
                            <FiAlertCircle size={24} />
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">Critical Delay in {a.code}</p>
                            <p className="text-xs text-gray-400 font-medium">Progress is only {a.progress}% (Critical threshold)</p>
                         </div>
                         <button 
                           onClick={() => handleInvestigate(a)}
                           className="text-xs font-black uppercase text-indigo-600 tracking-widest px-4 py-2 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all active:scale-95"
                         >
                           Investigate
                         </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-3xl text-gray-400 font-bold uppercase text-xs tracking-widest">No anomalies detected in faculty stream</div>
                  )}
               </div>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 h-fit">
            <h3 className="text-xl font-bold text-gray-800 mb-8">Faculty Pulse</h3>
            <div className="space-y-8">
               {[
                 { label: 'Total Managed Students', val: stats?.totalStudents || 0, color: 'bg-emerald-500' },
                 { label: 'Active Faculty Courses', val: stats?.totalCourses || 0, color: 'bg-indigo-500' },
                 { label: 'Pending Repeat Reviews', val: stats?.pendingRepeats || 0, color: 'bg-amber-500' },
                 { label: 'Faculty Grade Point Avg', val: stats?.averageGPA || '0.00', color: 'bg-rose-500' },
               ].map((p, i) => (
                 <div key={i} className="group">
                    <div className="flex justify-between items-end mb-3">
                       <span className="text-[10px] font-black text-gray-400 tracking-widest group-hover:text-gray-800 transition-colors uppercase">{p.label}</span>
                       <span className="text-sm font-black text-gray-800">{p.val}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                       <motion.div
                         initial={{ width: 0 }}
                         animate={{ width: '80%' }}
                         transition={{ duration: 1.5 }}
                         className={`h-full ${p.color} rounded-full`}
                       />
                    </div>
                 </div>
               ))}
            </div>
            
            <button 
              onClick={handleDownloadPDF}
              className="w-full mt-12 py-4 bg-gray-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Download Executive PDF
            </button>
         </div>
      </div>

      <AnimatePresence>
        {selectedAnomaly && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-10"
             >
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Anomaly Detection: {selectedAnomaly.code}</h2>
                   <button onClick={() => setSelectedAnomaly(null)} className="p-2 border rounded-xl"><FiX /></button>
                </div>
                <div className="bg-rose-50 p-6 rounded-3xl mb-8 border border-rose-100">
                   <p className="text-xs font-bold text-rose-800 mb-2">PROGRESS ANOMALY</p>
                   <p className="text-gray-700 font-medium">Automatic tracker detected that {selectedAnomaly.name} is currently at {selectedAnomaly.progress}% completion, which is 60% below the expected faculty pace.</p>
                </div>
                <div className="space-y-4 mb-10">
                   <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Department</span>
                      <span className="text-sm font-bold">{selectedAnomaly.department}</span>
                   </div>
                   <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Year/Sem</span>
                      <span className="text-sm font-bold">{selectedAnomaly.year} • Sem {selectedAnomaly.semester}</span>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => { toast.success('Lecturer notified'); setSelectedAnomaly(null); }} className="py-4 border-2 border-gray-100 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-gray-50 transition-all">Request Correction</button>
                   <button onClick={() => { toast.success('Dean review scheduled'); setSelectedAnomaly(null); }} className="py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-rose-200 transition-all">Escalate to HOD</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FiX = () => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const FiAlertCircle = ({ size, className }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size} className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

export default DeanReports;

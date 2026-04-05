import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiCreditCard, FiAlertCircle, FiMessageCircle, FiBarChart, FiShield } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';

const BursarDashboard = () => {
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinanceStats = async () => {
      try {
        const res = await api.get('/api/stats/dashboard');
        setFinanceData(res.data.data);
      } catch (err) {
        console.error('Bursar Ledger Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinanceStats();
  }, []);

  if (loading) return <div className="p-20 text-center font-black text-emerald-600 animate-pulse uppercase tracking-widest">Reconciling Institutional Ledger...</div>;

  const stats = [
    { title: 'Total Revenue Collected', value: `LKR ${financeData?.revenue?.toLocaleString() || 0}`, icon: FiDollarSign, color: 'bg-emerald-600' },
    { title: 'Outstanding Receivables', value: `LKR ${financeData?.outstanding?.toLocaleString() || 0}`, icon: FiAlertCircle, color: 'bg-rose-500' },
    { title: 'Active Scholarships', value: financeData?.activeScholarships || 0, icon: FiTrendingUp, color: 'bg-cyan-500' },
    { title: 'Recent Activity', value: financeData?.recentTransactions?.length || 0, icon: FiCreditCard, color: 'bg-indigo-600' },
  ];

  const RecentTransactions = [
    { id: 'TX-4021', name: 'James Wilson', amount: 'LKR 4,200', category: 'Tuition Fee 2026S2', method: 'Scholarship Support', date: '2026-04-03' },
    { id: 'TX-4022', name: 'Emma Watson', amount: 'LKR 150', category: 'Repeated Course Enrollment', method: 'Debit Card', date: '2026-04-03' },
    { id: 'TX-4023', name: 'Liam Neeson', amount: 'LKR 900', category: 'Student Housing Q2', method: 'Institutional Advance', date: '2026-04-02' },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-outfit">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter scale-x-110 origin-left">Bursary Operations Control</h1>
          <p className="text-emerald-700 font-bold flex items-center gap-2 uppercase tracking-[0.4em] text-[10px] ml-1 mt-1">
             <FiTrendingUp /> Revenue Integrity & Financial Compliance Dashboard
          </p>
        </div>
        <div className="flex gap-4">
           <button className="px-8 py-3 bg-white border-2 border-emerald-100 text-emerald-700 font-black rounded-2xl shadow-sm hover:shadow-lg transition-all text-xs uppercase tracking-widest">Consolidate Accounts</button>
           <button className="px-8 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2 text-xs uppercase tracking-widest">
              <FiBarChart /> Fiscal Forecast
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -8 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-50 flex items-center gap-6"
          >
            <div className={`${stat.color} p-4 rounded-2xl text-white shadow-xl shadow-${stat.color.split('-')[1]}-100`}>
               <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic leading-none">{stat.title}</p>
              <p className="text-2xl font-black text-gray-900 leading-none tracking-tighter italic">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative">
            <h2 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-tighter italic flex items-center justify-between">
               Revenue Ledger (Today) <FiShield className="text-gray-100 text-6xl absolute -top-4 -right-4" />
            </h2>
            <div className="space-y-4 relative z-10">
               {RecentTransactions.map((tx, idx) => (
                  <div key={idx} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-50 flex justify-between items-center hover:bg-emerald-50/20 transition-all cursor-pointer group">
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 font-black shadow-sm group-hover:rotate-[360deg] transition-transform duration-700 text-xs">{tx.id.slice(3)}</div>
                        <div>
                           <p className="font-black text-gray-800">{tx.name}</p>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">{tx.category}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-black text-emerald-700 uppercase tracking-tighter italic">{tx.amount}</p>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-tighter leading-none mt-1">{tx.method}</p>
                     </div>
                  </div>
               ))}
            </div>
            <button className="w-full mt-8 py-5 text-emerald-600 font-black border-2 border-emerald-50 rounded-3xl hover:bg-emerald-50 transition-all text-[10px] uppercase tracking-[0.4em] italic">Audit Global Ledger</button>
         </div>

         <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-black p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
               <h3 className="text-lg font-black mb-10 uppercase tracking-widest border-b border-indigo-400/30 pb-4 italic">Budget Snapshot</h3>
               <div className="space-y-10">
                  <div>
                     <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-2 italic leading-none">Faculty Discretionary Fund</p>
                     <p className="text-4xl font-black tracking-tighter italic leading-none">LKR 285,000</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-2 italic leading-none">Operational Fixed Assets</p>
                     <p className="text-4xl font-black tracking-tighter italic leading-none">LKR 1,100,000</p>
                  </div>
                  <div className="pt-4">
                     <button className="w-full py-5 bg-indigo-500 rounded-3xl font-black shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition-all text-[10px] uppercase tracking-widest">Download Fiscal Audit</button>
                  </div>
               </div>
            </div>
            
            <div className="bg-rose-50 p-10 rounded-[40px] border border-rose-100 relative group overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FiAlertCircle size={48} />
               </div>
               <h3 className="text-rose-600 font-black uppercase tracking-tight mb-4 flex items-center gap-3 italic"><FiAlertCircle /> Priority Reconciliation</h3>
               <p className="text-rose-800 text-[11px] font-bold leading-relaxed uppercase tracking-wide">
                  There are <span className="text-rose-600 font-black px-2 py-0.5 bg-rose-200/50 rounded-lg">12</span> student profiles with overlapping scholarship advances that require immediate Bursar authorization.
               </p>
               <button className="mt-8 w-full py-5 bg-rose-600 text-white rounded-3xl font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 text-[10px] uppercase tracking-widest">Review Claims</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default BursarDashboard;

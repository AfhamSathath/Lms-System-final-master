import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiCreditCard, FiAlertCircle, FiMessageCircle, FiBarChart } from 'react-icons/fi';
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
    { title: 'Total Revenue Collected', value: `$${financeData?.revenue?.toLocaleString() || 0}`, icon: FiDollarSign, color: 'bg-emerald-600' },
    { title: 'Outstanding Receivables', value: `$${financeData?.outstanding?.toLocaleString() || 0}`, icon: FiAlertCircle, color: 'bg-rose-500' },
    { title: 'Active Scholarships', value: financeData?.activeScholarships || 0, icon: FiTrendingUp, color: 'bg-cyan-500' },
    { title: 'Recent Activity', value: financeData?.recentTransactions?.length || 0, icon: FiCreditCard, color: 'bg-indigo-600' },
  ];

  const RecentTransactions = [
    { id: 'TX-4021', name: 'James Wilson', amount: '$4,200', category: 'Tuition Fee 2026S2', method: 'Scholarship Support', date: '2026-04-03' },
    { id: 'TX-4022', name: 'Emma Watson', amount: '$150', category: 'Repeated Course Enrollment', method: 'Debit Card', date: '2026-04-03' },
    { id: 'TX-4023', name: 'Liam Neeson', amount: '$900', category: 'Student Housing Q2', method: 'Institutional Advance', date: '2026-04-02' },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase">Bursary Operations Control</h1>
          <p className="text-emerald-700 font-bold flex items-center gap-2">
             <FiTrendingUp /> Revenue Integrity & Financial Compliance Dashboard
          </p>
        </div>
        <div className="flex gap-4">
           <button className="px-8 py-3 bg-white border-2 border-emerald-100 text-emerald-700 font-black rounded-2xl shadow-sm hover:shadow-lg transition-all">Consolidate Accounts</button>
           <button className="px-8 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2">
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
            <div className={`${stat.color} p-4 rounded-2xl text-white shadow-xl shadow-${stat.color.split('-')[1]}-200`}>
               <stat.icon size={28} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-tighter mb-1">{stat.title}</p>
              <p className="text-2xl font-black text-gray-900 leading-none">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-gray-800 mb-8 uppercase tracking-tight flex items-center justify-between">
               Revenue Ledger (Today) <FiMessageCircle className="text-gray-200" />
            </h2>
            <div className="space-y-4">
               {RecentTransactions.map((tx, idx) => (
                  <div key={idx} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-50 flex justify-between items-center hover:bg-emerald-50/20 transition-all cursor-pointer group">
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 font-black shadow-sm group-hover:scale-110 transition-transform">{tx.id.slice(3)}</div>
                        <div>
                           <p className="font-black text-gray-800">{tx.name}</p>
                           <p className="text-sm font-bold text-gray-400">{tx.category}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-black text-emerald-700 uppercase">{tx.amount}</p>
                        <p className="text-xs font-black text-gray-300 uppercase tracking-tighter">{tx.method}</p>
                     </div>
                  </div>
               ))}
            </div>
            <button className="w-full mt-8 py-4 text-emerald-600 font-black border-2 border-emerald-50 rounded-3xl hover:bg-emerald-50 transition-all">Audit Global Ledger</button>
         </div>

         <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-black p-10 rounded-[40px] text-white shadow-2xl">
               <h3 className="text-xl font-black mb-8 uppercase tracking-widest border-b border-indigo-400/30 pb-4">Budget Snapshot</h3>
               <div className="space-y-6">
                  <div>
                     <p className="text-xs font-black text-indigo-300 uppercase mb-2">Faculty Discretionary Fund</p>
                     <p className="text-3xl font-black">$285,000</p>
                  </div>
                  <div>
                     <p className="text-xs font-black text-indigo-300 uppercase mb-2">Operational Fixed Assets</p>
                     <p className="text-3xl font-black">$1,100,000</p>
                  </div>
                  <div className="pt-4">
                     <button className="w-full py-4 bg-indigo-500 rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition-all">Download Fiscal Audit</button>
                  </div>
               </div>
            </div>
            
            <div className="bg-rose-50 p-10 rounded-[40px] border border-rose-100">
               <h3 className="text-rose-600 font-black uppercase tracking-tight mb-4 flex items-center gap-2"><FiAlertCircle /> Priority Reconciliation</h3>
               <p className="text-rose-800 text-sm font-bold leading-relaxed">
                  There are **12** student profiles with overlapping scholarship advances that require immediate Bursar authorization.
               </p>
               <button className="mt-6 w-full py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20">Review Claims</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default BursarDashboard;

import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiCreditCard, FiAlertCircle, FiMessageCircle, FiBarChart, FiCheckSquare, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RevenueManagement = () => {
  const [finances, setFinances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ revenue: 0, outstanding: 0 });

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/finance');
      const records = res.data.finances;
      setFinances(records);
      const rev = records.filter(f => f.status === 'paid').reduce((acc, f) => acc + f.amount, 0);
      const out = records.filter(f => f.status !== 'paid').reduce((acc, f) => acc + f.amount, 0);
      setTotals({ revenue: rev, outstanding: out });
    } catch (err) {
      toast.error('Financial reconciliation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-10 mb-12">
        <div>
           <h1 className="text-4xl font-black text-gray-900 leading-tight uppercase tracking-tight">Institutional Revenue Ledger</h1>
           <p className="text-emerald-700 font-bold flex items-center gap-2">
              <FiDollarSign /> Central Accounts & Revenue Cycle Operations
           </p>
        </div>
        <div className="flex gap-4">
           <div className="p-8 bg-emerald-600 rounded-[35px] text-white shadow-xl shadow-emerald-200">
              <p className="text-xs font-black text-emerald-100 uppercase mb-1">Settled Revenue</p>
              <p className="text-3xl font-black">${totals.revenue.toLocaleString()}</p>
           </div>
           <div className="p-8 bg-rose-600 rounded-[35px] text-white shadow-xl shadow-rose-200">
              <p className="text-xs font-black text-rose-100 uppercase mb-1">Institutional Debt</p>
              <p className="text-3xl font-black">${totals.outstanding.toLocaleString()}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[50px] shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center px-12">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Global Transaction Ledger</h2>
            <div className="relative">
               <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
               <input type="text" placeholder="Filter Transactions..." className="pl-12 pr-6 py-3 rounded-2xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold" />
            </div>
         </div>

         <div className="overflow-x-auto px-6 pb-6">
            <table className="w-full text-left">
               <thead>
                  <tr>
                     <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Transaction Trace</th>
                     <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Student Faculty</th>
                     <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Classification</th>
                     <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Fiscal Status</th>
                     <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Value</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan="5" className="p-20 text-center font-black animate-pulse text-emerald-200 uppercase tracking-[0.3em]">Auditing Fiscal Systems...</td></tr>
                  ) : finances.map((f, i) => (
                    <tr key={f._id} className="group hover:bg-emerald-50/20 transition-all cursor-pointer">
                       <td className="px-8 py-6">
                          <p className="font-black text-gray-800 uppercase tracking-tighter">FIN-{f._id.slice(-6)}</p>
                          <p className="text-xs font-bold text-gray-400">{new Date(f.createdAt).toLocaleDateString()}</p>
                       </td>
                       <td className="px-8 py-6">
                          <p className="font-bold text-gray-800">{f.student?.name || 'Unknown Participant'}</p>
                          <p className="text-xs font-black text-emerald-600">{f.student?.studentId || 'ID Pending'}</p>
                       </td>
                       <td className="px-8 py-6">
                          <p className="font-bold text-gray-600">{f.title}</p>
                          <p className="text-xs font-medium text-gray-400">{f.description}</p>
                       </td>
                       <td className="px-8 py-6">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                             f.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                             {f.status}
                          </span>
                       </td>
                       <td className="px-8 py-6 font-black text-gray-800 text-lg">
                          ${f.amount.toLocaleString()}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default RevenueManagement;

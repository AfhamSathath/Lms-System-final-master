import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiCreditCard, FiAlertCircle, FiMessageCircle, FiBarChart, FiCheckSquare, FiSearch, FiLayers, FiEye, FiCheck, FiX, FiClock, FiFileText } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RevenueManagement = () => {
  const [finances, setFinances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ revenue: 0, outstanding: 0 });
  const [filter, setFilter] = useState('all'); // all, paid, pending_verification
  const [selectedFinance, setSelectedFinance] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleVerify = async (financeId) => {
    setSubmitting(true);
    try {
       const finance = finances.find(f => f._id === financeId);
       await api.put(`/api/finance/${financeId}/pay`, {
         amount: finance.amount,
         paymentMethod: 'Bank Slip Verified',
         transactionId: 'VER-' + Date.now().toString().slice(-6)
       });
       toast.success('Transaction verified and reconciled');
       setSelectedFinance(null);
       fetchFinances();
    } catch (error) {
       toast.error('Verification failed');
    } finally {
       setSubmitting(false);
    }
  };

  const handleReject = async (financeId) => {
    const comments = window.prompt("Rejection reason (sent to student):", "Evidence unreadable or deposit not confirmed.");
    if (!comments) return;

    setSubmitting(true);
    try {
       await api.put(`/api/finance/${financeId}/reject-slip`, { comments });
       toast.error('Submission rejected. Student notified.');
       setSelectedFinance(null);
       fetchFinances();
    } catch (error) {
       toast.error('Action failed');
    } finally {
       setSubmitting(false);
    }
  };

  const filteredFinances = finances.filter(f => {
    if (filter === 'all') return true;
    if (filter === 'paid') return f.status === 'paid';
    if (filter === 'pending_verification') return f.status === 'payment_submitted';
    return true;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'payment_submitted': return 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse';
      case 'overdue': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  return (
    <div className="p-12 bg-slate-50/50 min-h-screen font-outfit">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-10 mb-14">
        <div>
           <h1 className="text-5xl font-black text-slate-900 leading-tight uppercase tracking-tighter italic">Institutional <span className="text-emerald-600 underline underline-offset-8 decoration-emerald-100">Revenue Ledger</span></h1>
           <p className="text-slate-400 font-bold flex items-center gap-2 uppercase tracking-[0.4em] text-[10px] ml-1 mt-2">
              <FiShield className="text-emerald-500" /> Central Accounts & Revenue Cycle Operations
           </p>
        </div>
        <div className="flex gap-6">
           <div className="px-10 py-8 bg-emerald-600 rounded-[40px] text-white shadow-2xl shadow-emerald-200/50 border-4 border-white">
              <p className="text-[10px] font-black text-emerald-100 uppercase mb-2 tracking-widest italic opacity-80">Settled Revenue</p>
              <p className="text-4xl font-black tracking-tighter">LKR {totals.revenue.toLocaleString()}</p>
           </div>
           <div className="px-10 py-8 bg-slate-900 rounded-[40px] text-white shadow-2xl shadow-slate-200/50 border-4 border-white">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest italic opacity-80">Outstanding Debt</p>
              <p className="text-4xl font-black tracking-tighter">LKR {totals.outstanding.toLocaleString()}</p>
           </div>
        </div>
      </header>

      {/* Stats and Filtering */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <button 
           onClick={() => setFilter('all')}
           className={`p-8 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-4 ${filter === 'all' ? 'bg-white border-indigo-600 shadow-2xl shadow-indigo-100' : 'bg-white/50 border-transparent hover:bg-white'}`}
        >
           <FiLayers size={32} className={filter === 'all' ? 'text-indigo-600' : 'text-slate-300'} />
           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Total Records ({finances.length})</p>
        </button>
        <button 
           onClick={() => setFilter('paid')}
           className={`p-8 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-4 ${filter === 'paid' ? 'bg-white border-emerald-600 shadow-2xl shadow-emerald-100' : 'bg-white/50 border-transparent hover:bg-white'}`}
        >
           <FiCheckSquare size={32} className={filter === 'paid' ? 'text-emerald-600' : 'text-slate-300'} />
           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Paid Items ({finances.filter(f=>f.status==='paid').length})</p>
        </button>
        <button 
           onClick={() => setFilter('pending_verification')}
           className={`p-8 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-4 ${filter === 'pending_verification' ? 'bg-white border-indigo-600 shadow-2xl shadow-indigo-100' : 'bg-white/50 border-transparent hover:bg-white'}`}
        >
           <div className="relative">
              <FiClock size={32} className={filter === 'pending_verification' ? 'text-indigo-600' : 'text-slate-300'} />
              {finances.some(f => f.status === 'payment_submitted') && <div className="absolute -top-1 -right-1 h-3 w-3 bg-rose-500 rounded-full animate-ping"></div>}
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Review ({finances.filter(f=>f.status==='payment_submitted').length})</p>
        </button>
        <div className="p-8 bg-white/50 rounded-[3rem] border-2 border-transparent flex flex-col items-center justify-center relative overflow-hidden group">
           <FiBarChart size={32} className="text-slate-200 group-hover:text-amber-400 transition-colors" />
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-4 italic">Fiscal Analytics</p>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] shadow-2xl shadow-slate-100 border border-slate-100 overflow-hidden relative">
         <div className="p-10 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 px-14">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic scale-x-110 origin-left flex items-center gap-4">
               <FiTrendingUp className="text-emerald-500" /> Global Transaction Registry
            </h2>
            <div className="relative w-full md:w-96">
               <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
               <input type="text" placeholder="Trace ID, Student Name, Faculty..." className="w-full pl-14 pr-8 py-5 rounded-2xl bg-white border-2 border-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-bold text-sm" />
            </div>
         </div>

         <div className="overflow-x-auto px-6 pb-12">
            <table className="w-full text-left">
               <thead>
                  <tr>
                     <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Fiscal Identity</th>
                     <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Entity Trace</th>
                     <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Allocation Type</th>
                     <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic text-center">Protocol Status</th>
                     <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic text-right whitespace-nowrap">Value (LKR) / Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="5" className="py-40 text-center font-black animate-pulse text-slate-200 uppercase tracking-[0.4em]">Auditing Fiscal Systems...</td></tr>
                  ) : filteredFinances.length === 0 ? (
                    <tr><td colSpan="5" className="py-40 text-center">
                       <FiAlertCircle size={64} className="mx-auto text-slate-100 mb-6" />
                       <p className="font-black text-slate-300 uppercase tracking-widest text-xs italic">No matching records indexed in the current ledger</p>
                    </td></tr>
                  ) : filteredFinances.map((f, i) => (
                    <tr key={f._id} className="group hover:bg-slate-50 transition-all">
                       <td className="px-10 py-8">
                          <p className="font-black text-slate-800 uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">FIN-{f._id.slice(-6).toUpperCase()}</p>
                          <p className="text-[10px] font-bold text-slate-400 italic mt-1">Processed: {new Date(f.createdAt).toLocaleDateString()}</p>
                       </td>
                       <td className="px-10 py-8">
                          <p className="font-black text-slate-800 tracking-tight">{f.student?.name || 'Unknown Entity'}</p>
                          <p className="text-[10px] font-black text-emerald-600 tracking-[0.15em] opacity-70 italic">{f.student?.studentId || 'ID_N/A'}</p>
                       </td>
                       <td className="px-10 py-8">
                          <p className="font-black text-slate-700 uppercase tracking-tight text-xs">{f.title.replace('_', ' ')}</p>
                          <p className="text-[10px] font-bold text-slate-400 italic line-clamp-1">{f.description}</p>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex justify-center">
                             <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all group-hover:scale-105 ${getStatusStyle(f.status)}`}>
                                {f.status.replace('_', ' ')}
                             </span>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end gap-6">
                             <p className="font-black text-slate-900 text-2xl tracking-tighter italic">LKR {f.amount.toLocaleString()}</p>
                             {f.status === 'payment_submitted' && (
                                <button 
                                   onClick={() => setSelectedFinance(f)}
                                   className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 hover:scale-110 active:scale-95"
                                   title="Verify Payment Slip"
                                >
                                   <FiEye size={20} strokeWidth={3} />
                                </button>
                             )}
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Slip Verification Modal */}
      <AnimatePresence>
        {selectedFinance && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
             <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 40 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 40 }}
               className="bg-white rounded-[4rem] w-full max-w-4xl overflow-hidden shadow-[0_50px_150px_rgba(0,0,0,0.6)] border-4 border-white flex flex-col md:flex-row h-[80vh]"
             >
                {/* Left: Slip Preview */}
                <div className="md:w-3/5 bg-slate-900 relative p-8 flex items-center justify-center overflow-hidden">
                   <div className="absolute top-10 left-10 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic z-10">Verification Preview • Evidence ID: {selectedFinance._id.slice(-8)}</div>
                   {selectedFinance.paymentSlip ? (
                      <div className="w-full h-full p-4 flex items-center justify-center">
                        <img 
                          src={`http://localhost:5001/${selectedFinance.paymentSlip.replace(/\\/g, '/')}`} 
                          alt="Payment Slip Evidence"
                          className="max-h-full max-w-full rounded-2xl shadow-2xl object-contain border-4 border-white/5"
                        />
                      </div>
                   ) : (
                      <div className="text-center p-20">
                         <FiAlertCircle size={80} className="mx-auto text-amber-500 mb-8" />
                         <p className="text-white font-black uppercase tracking-widest">No visual evidence found</p>
                      </div>
                   )}
                </div>

                {/* Right: Actions */}
                <div className="md:w-2/5 p-14 flex flex-col">
                   <div className="flex justify-between items-start mb-14">
                      <div>
                         <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 italic leading-relaxed underline underline-offset-8 decoration-indigo-600 decoration-4">Submission Context</p>
                         <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">{selectedFinance.student?.name}</h3>
                         <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">{selectedFinance.student?.studentId}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedFinance(null)}
                        className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 shadow-inner"
                      >
                         <FiX size={24} strokeWidth={4} />
                      </button>
                   </div>

                   <div className="bg-slate-50 rounded-[2.5rem] p-10 space-y-8 border border-slate-100 mb-auto">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic flex items-center gap-2">
                           <FiFileText /> Revenue Item
                         </p>
                         <p className="text-lg font-black text-slate-700 tracking-tight">{selectedFinance.title.replace('_', ' ')}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic flex items-center gap-2">
                           <FiDollarSign /> Value Ledger
                         </p>
                         <p className="text-3xl font-black text-indigo-600 tracking-tighter italic">LKR {selectedFinance.amount.toLocaleString()}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic flex items-center gap-2">
                           <FiClock /> Verification Status
                         </p>
                         <p className="text-xs font-bold text-amber-600 italic">Self-reported by student. Requires internal validation against bank records.</p>
                      </div>
                   </div>

                   <div className="pt-10 flex gap-4">
                      <button 
                        onClick={() => handleVerify(selectedFinance._id)}
                        disabled={submitting}
                        className="flex-1 py-8 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                      >
                         {submitting ? 'RECONCILING...' : 'APPROVE'} <FiCheck size={20} strokeWidth={4} />
                      </button>
                      <button 
                        onClick={() => handleReject(selectedFinance._id)}
                        disabled={submitting}
                        className="p-8 bg-rose-100 text-rose-600 rounded-[2rem] hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-inner"
                        title="Reject Slip"
                      >
                         <FiX size={24} strokeWidth={4} />
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RevenueManagement;

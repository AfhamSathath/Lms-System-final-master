import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCreditCard, FiCheckCircle, FiXCircle, FiClock, FiFileText, FiDownload, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StudentFees = () => {
  const { user } = useAuth();
  const [finances, setFinances] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinances();
  }, [user]);

  const fetchFinances = async () => {
    try {
      const response = await api.get('/api/finance/my');
      setFinances(response.data.finances || []);
      setTotalDue(response.data.totalDue || 0);
    } catch (error) {
      console.error('Error fetching finances:', error);
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (financeId) => {
    try {
       const response = await api.put(`/api/finance/${financeId}/pay`, {
         amount: finances.find(f => f._id === financeId).amount,
         paymentMethod: 'Online simulation'
       });
       
       if (response.data.success) {
         toast.success('Payment simulated successfully');
         fetchFinances();
       }
    } catch (error) {
       toast.error('Payment simulation failed');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight font-outfit">Finance & Fees</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage your tuition fees and payment history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[3rem] shadow-2xl overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <FiDollarSign className="w-48 h-48 -mr-12 -mt-12 text-white" />
             </div>
             
             <div className="p-10 relative z-10">
               <div className="flex items-center gap-3 mb-10">
                 <div className="p-3 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
                   <FiCreditCard className="text-white h-6 w-6" />
                 </div>
                 <span className="text-white font-black text-sm uppercase tracking-widest">Total Outstanding</span>
               </div>
               
               <div className="mb-10">
                 <p className="text-white/60 text-xs font-bold uppercase mb-2">Balance Amount</p>
                 <h2 className="text-5xl font-black text-white">${totalDue.toLocaleString()}</h2>
               </div>
               
               <div className="flex items-center gap-3 py-4 px-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10">
                 <div className={`h-2 w-2 rounded-full ${totalDue > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                 <span className="text-white/80 text-xs font-bold tracking-wider uppercase">
                   {totalDue > 0 ? 'Action Required' : 'Account in Good Standing'}
                 </span>
               </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-[3rem] shadow-xl p-10 border border-slate-100 flex flex-col justify-center">
            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <FiFileText className="text-rose-500" />
              Quick Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Records</p>
                 <p className="text-3xl font-black text-slate-700">{finances.length}</p>
               </div>
               <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                 <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">Paid Items</p>
                 <p className="text-3xl font-black text-emerald-600">{finances.filter(f => f.status === 'paid').length}</p>
               </div>
               <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                 <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mb-1">Overdue</p>
                 <p className="text-3xl font-black text-rose-600">{finances.filter(f => f.status === 'overdue').length}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <h3 className="text-2xl font-black text-slate-800">Fee Invoices</h3>
          <div className="flex gap-2">
            <button className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2">
              <FiDownload /> Export History
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 px-10">
              {finances.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50 group transition-colors">
                  <td className="px-10 py-6">
                    <p className="font-extrabold text-slate-700 text-md">{item.title}</p>
                    <p className="text-slate-400 text-xs mt-1 font-medium italic">{item.description || 'Institutional Tuition'}</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">SEM {item.semester}</span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center text-slate-600 text-sm font-bold gap-2">
                       <FiClock className={new Date(item.dueDate) < new Date() && item.status !== 'paid' ? 'text-rose-500' : 'text-slate-400'} />
                       {new Date(item.dueDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <p className="font-black text-slate-800 text-lg">${item.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                      item.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'overdue' ? 'bg-rose-100 text-rose-700 animate-pulse' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status === 'paid' ? <FiCheckCircle /> : <FiClock />}
                      {item.status}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    {item.status !== 'paid' ? (
                      <button 
                        onClick={() => handlePayment(item._id)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-indigo-100 hover:shadow-indigo-200"
                      >
                        Pay Now
                      </button>
                    ) : (
                      <button className="text-slate-400 hover:text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-1">
                        <FiDownload /> View Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {finances.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <FiFileText className="w-20 h-20 text-slate-300 mb-6" />
                      <p className="text-2xl font-black text-slate-400">No Invoices Found</p>
                      <p className="font-bold text-slate-400 mt-2">All your accounts are settled or pending generation.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentFees;

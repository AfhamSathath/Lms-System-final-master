import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { 
  FiPlus, FiFileText, FiDollarSign, FiClock, 
  FiCheckCircle, FiXCircle, FiTrash2, FiInfo 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const StudentClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    claimType: 'medical',
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const res = await api.get('/api/claims');
      setClaims(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/claims', formData);
      toast.success('Claim submitted successfully');
      setShowAddModal(false);
      setFormData({ claimType: 'medical', amount: '', description: '' });
      fetchClaims();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Withdraw this claim?')) return;
    try {
      await api.delete(`/api/claims/${id}`);
      toast.success('Claim withdrawn');
      fetchClaims();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-2">My Reimbursement Claims</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Track your medical, travel and registration claims</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95"
          >
            <FiPlus className="text-lg" /> New Claim Request
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {claims.length === 0 ? (
               <div className="col-span-full py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center text-center p-10">
                 <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-3xl text-slate-300 mb-6 shadow-inner">
                   <FiFileText />
                 </div>
                 <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">No Active Claims</h3>
                 <p className="text-slate-400 max-w-sm mt-2 font-medium">You haven't submitted any reimbursement requests yet. Click the button above to start.</p>
               </div>
            ) : (
              claims.map((claim, idx) => (
                <motion.div 
                  key={claim._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
                >
                  <div className={`absolute top-0 right-0 p-8 opacity-[0.03] transition-transform duration-700 group-hover:scale-150 group-hover:rotate-12`}>
                    <FiDollarSign className="text-9xl" />
                  </div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                        {claim.claimType === 'medical' ? <FiInfo /> : <FiDollarSign />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Type</p>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{claim.claimType}</h3>
                      </div>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>

                  <div className="space-y-4 mb-8">
                     <p className="text-slate-500 text-sm font-medium leading-relaxed italic border-l-4 border-indigo-100 pl-4">
                       "{claim.description}"
                     </p>
                     
                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Total Requested</p>
                          <p className="text-2xl font-black text-slate-800 tracking-tighter">LKR {claim.amount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Submitted On</p>
                          <p className="text-xs font-black text-slate-500 uppercase">{new Date(claim.createdAt).toLocaleDateString()}</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {claim.status === 'pending' && (
                      <button 
                        onClick={() => handleDelete(claim._id)}
                        className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all transform active:scale-95"
                      >
                        Withdraw Request
                      </button>
                    )}
                    <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all transform active:scale-95">
                      View Documents
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Submit New Claim">
         <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Claim Category</label>
                 <select 
                   className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold uppercase transition-all focus:ring-2 focus:ring-indigo-500 appearance-none"
                   value={formData.claimType}
                   onChange={(e) => setFormData({...formData, claimType: e.target.value})}
                 >
                   <option value="medical">Medical Expense</option>
                   <option value="travel">Field Visit / Travel</option>
                   <option value="registration">Registration Refund</option>
                   <option value="other">Other Academic</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount (LKR)</label>
                 <input 
                   type="number"
                   required
                   className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all placeholder:opacity-30"
                   placeholder="0.00"
                   value={formData.amount}
                   onChange={(e) => setFormData({...formData, amount: e.target.value})}
                 />
               </div>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Reason / Description</label>
               <textarea 
                 required
                 className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all placeholder:opacity-30 min-h-[120px]"
                 placeholder="Provide a detailed explanation for your claim..."
                 value={formData.description}
                 onChange={(e) => setFormData({...formData, description: e.target.value})}
               ></textarea>
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform active:scale-95 py-6">
               Submit Claim Request
            </button>
         </form>
      </Modal>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-600',
    approved: 'bg-emerald-50 text-emerald-600',
    rejected: 'bg-red-50 text-red-600',
    paid: 'bg-indigo-50 text-indigo-600'
  };
  const icons = {
    pending: <FiClock />,
    approved: <FiCheckCircle />,
    rejected: <FiXCircle />,
    paid: <FiCheckCircle />
  };
  return (
    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>
      {icons[status]}
      {status}
    </div>
  );
};

export default StudentClaims;

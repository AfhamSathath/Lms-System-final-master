import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLayers, FiCheckCircle, FiSend, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ChangeMedium = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRequest = (e) => {
    e.preventDefault();
    setLoading(true);
    // Mimic API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Medium change request submitted to Registry');
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-xl text-center max-w-lg border border-slate-100"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
            <FiCheckCircle />
          </div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4">Request Received</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-0">
            Your request to change the study medium has been logged. You will receive an email once the Registrar approves the change.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-12 text-white relative">
             <div className="absolute top-0 right-0 p-12 opacity-10">
                <FiLayers className="text-9xl" />
             </div>
             <div className="relative z-10">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Change Study Medium</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Request a transition between academic languages</p>
             </div>
          </div>

          <div className="p-12">
            <div className="flex items-center gap-4 p-6 bg-indigo-50 border border-indigo-100 rounded-3xl mb-10 text-indigo-700">
               <FiAlertCircle className="text-2xl shrink-0" />
               <p className="text-sm font-bold leading-tight">
                 Medium changes are typically only permitted within the first two weeks of the semester. Approval is subject to departmental review.
               </p>
            </div>

            <form onSubmit={handleRequest} className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Current Medium</label>
                    <div className="w-full px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-xs cursor-not-allowed">
                       English Instruction
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Medium</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black uppercase text-xs focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer">
                       <option value="english">English (Default)</option>
                       <option value="sinhala">Sinhala Instruction</option>
                       <option value="tamil">Tamil Instruction</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Statement of Justification</label>
                  <textarea 
                    required
                    className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl font-bold transition-all focus:ring-2 focus:ring-indigo-500 min-h-[150px]"
                    placeholder="Briefly explain the reason for your request..."
                  ></textarea>
               </div>

               <div className="pt-6 border-t border-slate-50 flex justify-end">
                  <button 
                    disabled={loading}
                    className="flex items-center gap-3 px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform active:scale-95"
                  >
                    {loading ? 'Processing...' : <><FiSend /> Submit Request</>}
                  </button>
               </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeMedium;

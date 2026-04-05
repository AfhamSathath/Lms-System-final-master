import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCreditCard, FiCheckCircle, FiXCircle, FiClock, FiFileText, FiDownload, FiDollarSign, FiUpload, FiX, FiImage, FiAlertCircle, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';

const StudentFees = () => {
  const { user } = useAuth();
  const [finances, setFinances] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ 
    open: false, 
    item: null, 
    method: 'online', 
    transactionId: '',
    file: null 
  });

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

  const handleOnlinePayment = async () => {
    setSubmitting(true);
    try {
       const response = await api.put(`/api/finance/${paymentModal.item._id}/pay`, {
         amount: paymentModal.item.amount,
         paymentMethod: 'Credit/Debit Card (Simulated)',
         transactionId: 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase()
       });
       
       if (response.data.success) {
         toast.success('Payment authorized successfully');
         setPaymentModal({ open: false, item: null, method: 'online', transactionId: '', file: null });
         fetchFinances();
       }
    } catch (error) {
       toast.error('Payment processing failed');
    } finally {
       setSubmitting(false);
    }
  };

  const handleSlipUpload = async () => {
    if (!paymentModal.file) {
      return toast.error('Please select a payment slip image or PDF');
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('paymentProof', paymentModal.file);
    formData.append('transactionId', paymentModal.transactionId);

    try {
       const response = await api.put(`/api/finance/${paymentModal.item._id}/submit-slip`, formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
       });
       
       if (response.data.success) {
         toast.success('Payment slip submitted for verification');
         setPaymentModal({ open: false, item: null, method: 'online', transactionId: '', file: null });
         fetchFinances();
       }
    } catch (error) {
       toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
       setSubmitting(false);
    }
  };

  const handleDownloadReceipt = (item) => {
    try {
      const doc = new jsPDF({
        format: 'a4',
        unit: 'mm'
      });

      // Colors and Fonts
      const primaryColor = [79, 70, 229]; // Indigo-600
      const secondaryColor = [30, 41, 59]; // Slate-800
      const accentColor = [16, 185, 129]; // Emerald-500

      // Header - Background
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL PAYMENT RECEIPT', 20, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Eastern University, Sri Lanka (EUSL)', 20, 32);

      // Reset text color
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

      // Metadata Box
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(20, 50, 170, 35, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('RECEIPT TO:', 25, 58);
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(user?.name?.toUpperCase() || 'STUDENT NAME', 25, 65);
      
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Student ID: ${user?.studentId || 'N/A'}`, 25, 72);
      doc.text(`Department: ${user?.department || 'N/A'}`, 25, 78);

      // Receipt info box
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('RECEIPT NO:', 140, 58);
      doc.setFont('helvetica', 'normal');
      doc.text(`REC-${item._id.slice(-8).toUpperCase()}`, 140, 63);
      
      doc.setFont('helvetica', 'bold');
      doc.text('DATE:', 140, 70);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString(), 140, 75);

      // Transaction Table Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(20, 100, 170, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPTION', 25, 106.5);
      doc.text('SEMESTER', 90, 106.5);
      doc.text('YEAR', 130, 106.5);
      doc.text('AMOUNT (LKR)', 160, 106.5);

      // Item row
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(item.title.replace('_', ' ').toUpperCase(), 25, 120);
      doc.setFont('helvetica', 'normal');
      doc.text(item.description || 'Institutional Fee', 25, 126);
      
      doc.text(`Sem 0${item.semester}`, 90, 120);
      doc.text(item.academicYear || 'N/A', 130, 120);
      doc.setFont('helvetica', 'bold');
      doc.text(item.amount.toLocaleString(), 160, 120);

      // Separator
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 135, 190, 135);

      // Payment Breakdown Heading
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('TRANSACTION HISTORY', 20, 145);

      // History Rows
      let yPos = 155;
      item.paymentHistory?.forEach((p) => {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text(p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A', 20, yPos);
        
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(9);
        doc.text(`${p.paymentMethod || 'Online'} Payment`, 50, yPos);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`ID: ${p.transactionId || 'N/A'}`, 50, yPos + 4);
        
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${p.amount?.toLocaleString() || item.amount.toLocaleString()}`, 160, yPos + 1);
        yPos += 15;
      });

      // Summary Box
      const summaryY = 220;
      doc.setFillColor(248, 250, 252);
      doc.rect(130, summaryY, 60, 25, 'F');
      
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL PAID:', 135, summaryY + 10);
      
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`LKR ${item.amount.toLocaleString()}`, 135, summaryY + 18);

      // Footer
      doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(20, 260, 190, 260);
      
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic');
      doc.text('This is a computer-generated document. No physical signature is required.', 105, 268, { align: 'center' });
      doc.text('Office of the Bursar • Eastern University Sri Lanka • lms.eusl.ac.lk', 105, 272, { align: 'center' });

      // Save
      doc.save(`Receipt_EUSL_${item._id.slice(-8)}.pdf`);
      toast.success('Official receipt generated successfully');
    } catch (error) {
      console.error('Receipt generation error:', error);
      toast.error('Failed to generate PDF. Print screen instead.');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-[0_4px_14px_rgba(16,185,129,0.15)]';
      case 'overdue': return 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse';
      case 'payment_submitted': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'partially_paid': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-12 bg-slate-50/30 min-h-screen font-outfit">
      <header className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2 italic">Student <span className="text-indigo-600">Finances</span></h1>
           <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] ml-1">Automated Bursary & Ledger Management</p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-white px-8 py-5 rounded-[2.5rem] shadow-2xl border border-slate-100 flex items-center gap-6">
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Outstanding</p>
                 <p className="text-3xl font-black text-slate-900 tracking-tighter">LKR {totalDue.toLocaleString()}</p>
              </div>
              <div className="h-10 w-[2px] bg-slate-100"></div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Records</p>
                 <p className="text-3xl font-black text-indigo-600 tracking-tighter">{finances.length}</p>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12">
        <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 -mr-32 -mt-32 rounded-full group-hover:scale-110 transition-transform duration-1000 opacity-50"></div>
          
          <div className="px-12 py-10 border-b border-slate-50 flex justify-between items-center relative z-10">
             <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                <FiFileText className="text-indigo-600 text-3xl" />
                Ledger Invoices
             </h3>
             <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95">
                <FiDownload size={16} /> Export Statement
             </button>
          </div>

          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Item & Desc</th>
                  <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeframe</th>
                  <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount (LKR)</th>
                  <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-12 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Control Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {finances.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 group/row transition-all duration-300">
                    <td className="px-12 py-10">
                       <p className="font-extrabold text-slate-800 text-lg leading-tight group-hover/row:text-indigo-600 transition-colors uppercase tracking-tight">{item.title.replace('_', ' ')}</p>
                       <p className="text-slate-400 text-[11px] mt-1.5 font-bold italic tracking-wide">{item.description || 'General Institutional Fee'}</p>
                    </td>
                    <td className="px-12 py-10">
                       <div className="flex flex-col gap-1.5">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit">Sem 0{item.semester} • {item.academicYear}</span>
                          <div className="flex items-center text-slate-400 text-[10px] font-bold gap-2 italic">
                             <FiClock size={12} className={new Date(item.dueDate) < new Date() && item.status !== 'paid' ? 'text-rose-500' : ''} />
                             Due: {new Date(item.dueDate).toLocaleDateString()}
                          </div>
                       </div>
                    </td>
                    <td className="px-12 py-10 text-right">
                       <p className="font-black text-slate-900 text-2xl tracking-tighter">LKR {item.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-12 py-10">
                       <div className="flex justify-center">
                          <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 border ${getStatusStyle(item.status)}`}>
                             {item.status === 'paid' ? <FiCheckCircle strokeWidth={3} /> : item.status === 'overdue' ? <FiAlertCircle /> : <FiClock strokeWidth={3} />}
                             {item.status.replace('_', ' ')}
                          </span>
                       </div>
                    </td>
                    <td className="px-12 py-10 text-right">
                       {item.status !== 'paid' && item.status !== 'payment_submitted' ? (
                          <button 
                            onClick={() => setPaymentModal({ open: true, item, method: 'online', transactionId: '', file: null })}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-all active:scale-95 shadow-xl shadow-indigo-100 hover:shadow-indigo-200 flex items-center gap-3 ml-auto"
                          >
                             <FiCreditCard size={14} /> Settle Fee
                          </button>
                       ) : item.status === 'payment_submitted' ? (
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center justify-end gap-2">
                             Verification Pending <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-ping"></div>
                          </p>
                       ) : (
                          <button 
                            onClick={() => handleDownloadReceipt(item)}
                            className="text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ml-auto transition-colors"
                          >
                             <FiDownload /> Download Receipt
                          </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enhanced Payment Modal */}
      <AnimatePresence>
        {paymentModal.open && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
             <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 40 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 40 }}
               className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-[0_50px_150px_rgba(0,0,0,0.6)] border-4 border-white"
             >
               <div className="p-10 bg-indigo-600 text-white relative h-48 flex flex-col justify-end">
                  <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
                     <FiShield size={300} className="absolute -left-20 -top-20 -rotate-12" />
                  </div>
                  <button 
                    onClick={() => setPaymentModal({ ...paymentModal, open: false })}
                    className="absolute top-10 right-10 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors z-20"
                  >
                    <FiX size={20} strokeWidth={4} />
                  </button>
                  <div className="relative z-10">
                     <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em] mb-2 italic">SECURE GATEWAY • PAYMENT AUTHORIZATION</p>
                     <h2 className="text-4xl font-black uppercase tracking-tighter italic scale-x-110 origin-left leading-none mb-1">{paymentModal.item.title.replace('_', ' ')}</h2>
                     <p className="text-indigo-100 font-bold tracking-tighter text-2xl uppercase">LKR {paymentModal.item.amount.toLocaleString()}</p>
                  </div>
               </div>

               <div className="p-10">
                  {/* Method Tabs */}
                  <div className="flex gap-4 mb-8 bg-slate-50 p-2 rounded-[1.5rem] border-2 border-slate-100">
                     <button 
                        onClick={() => setPaymentModal({ ...paymentModal, method: 'online' })}
                        className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${paymentModal.method === 'online' ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        <FiCreditCard /> Card / Online
                     </button>
                     <button 
                        onClick={() => setPaymentModal({ ...paymentModal, method: 'slip' })}
                        className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${paymentModal.method === 'slip' ? 'bg-white shadow-xl text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        <FiUpload /> Bank Deposit
                     </button>
                  </div>

                  {paymentModal.method === 'online' ? (
                    <div className="space-y-8 py-4">
                       <div className="p-10 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-200 text-center">
                          <FiShield size={48} className="mx-auto mb-6 text-indigo-400" />
                          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2 italic">Simulated Online Gateway</h4>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Proceeding will simulate a successful card transaction for testing purposes. Real-world implementation would redirect to Stripe/Payhere.</p>
                       </div>
                       <button
                          onClick={handleOnlinePayment}
                          disabled={submitting}
                          className="w-full py-5 rounded-[1.5rem] bg-indigo-600 text-white font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                       >
                          {submitting ? 'PROCESSING...' : 'AUTHORIZE PAYMENT'}
                          <FiCheckCircle size={18} strokeWidth={4} />
                       </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-2 block italic">Upload Bank Advice / Deposit Slip</label>
                          <div className="relative group">
                             <input 
                                type="file" 
                                className="hidden" 
                                id="slip-upload" 
                                accept="image/*,application/pdf"
                                onChange={(e) => setPaymentModal({ ...paymentModal, file: e.target.files[0] })}
                             />
                             <label 
                                htmlFor="slip-upload"
                                className="w-full h-32 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer group-hover:border-emerald-400 transition-all group-hover:bg-emerald-50/30"
                             >
                                {paymentModal.file ? (
                                   <div className="flex items-center gap-4 text-emerald-600 font-black text-sm px-6">
                                      <FiImage size={32} />
                                      <p className="truncate max-w-[200px]">{paymentModal.file.name}</p>
                                      <FiCheckCircle size={20} />
                                   </div>
                                ) : (
                                   <>
                                      <FiUpload size={32} className="text-slate-300 mb-4 group-hover:text-emerald-400 transition-colors" />
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic group-hover:text-emerald-600 transition-colors">Click to select file</p>
                                   </>
                                )}
                             </label>
                          </div>
                       </div>

                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-2 block italic">Reference Number (Optional)</label>
                          <input 
                             type="text"
                             className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl py-4 px-6 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                             placeholder="e.g. SLIP-X09231"
                             value={paymentModal.transactionId}
                             onChange={(e) => setPaymentModal({ ...paymentModal, transactionId: e.target.value })}
                          />
                       </div>

                       <button
                          onClick={handleSlipUpload}
                          disabled={submitting || !paymentModal.file}
                          className="w-full py-5 rounded-[1.5rem] bg-emerald-600 text-white font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                       >
                          {submitting ? 'UPLOADING...' : 'SUBMIT FOR VERIFICATION'}
                          <FiUpload size={18} strokeWidth={4} />
                       </button>
                    </div>
                  )}
               </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentFees;

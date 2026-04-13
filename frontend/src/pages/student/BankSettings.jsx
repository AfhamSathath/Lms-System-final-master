import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/Authcontext';
import Loader from '../../components/common/loader';
import { FiCreditCard, FiCheckCircle, FiSave, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const BankSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    branchName: '',
    accountHolderName: '',
    accountNumber: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/auth/me');
        if (res.data.user?.bankDetails) {
          setFormData(res.data.user.bankDetails);
        }
      } catch (err) {
        toast.error('Failed to load bank details');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/auth/update-profile', { bankDetails: formData });
      toast.success('Bank details updated successfully');
    } catch (err) {
      toast.error('Failed to update bank details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 p-12 text-white relative">
            <div className="absolute top-0 right-0 p-12 opacity-15">
              <FiCreditCard className="text-9xl rotate-12" />
            </div>
            <div className="relative z-10">
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Bank Account Settings</h1>
              <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs opacity-80">Used for bursary disbursements and claim refunds</p>
            </div>
          </div>

          <div className="p-12">
            <div className="flex items-center gap-4 p-6 bg-amber-50 border border-amber-100 rounded-3xl mb-10 text-amber-700">
              <FiAlertCircle className="text-2xl shrink-0" />
              <p className="text-sm font-bold leading-tight">
                Please ensure all details are accurate. Incorrect information may lead to significant delays in receiving payments.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputGroup 
                   label="Bank Name" 
                   name="bankName"
                   placeholder="e.g. Bank of Ceylon"
                   value={formData.bankName}
                   onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                />
                <InputGroup 
                   label="Branch Name" 
                   name="branchName"
                   placeholder="e.g. Colombo Fort"
                   value={formData.branchName}
                   onChange={(e) => setFormData({...formData, branchName: e.target.value})}
                />
                <InputGroup 
                   label="Account Holder Name" 
                   name="accountHolderName"
                   placeholder="Full Name as per Bank"
                   value={formData.accountHolderName}
                   onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                />
                <InputGroup 
                   label="Account Number" 
                   name="accountNumber"
                   placeholder="XXXXXXXXXX"
                   value={formData.accountNumber}
                   onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex items-center gap-2 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                >
                  {saving ? <Loader /> : <><FiSave /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
           <FiCheckCircle className="text-emerald-500" /> Secure Encryption Active
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ label, name, placeholder, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">{label}</label>
    <input
      type="text"
      name={name}
      placeholder={placeholder}
      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-bold transition-all outline-none"
      value={value}
      onChange={onChange}
      required
    />
  </div>
);

export default BankSettings;

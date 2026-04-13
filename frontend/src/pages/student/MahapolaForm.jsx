import React, { useState } from 'react';
import { FiSave, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/Authcontext';

const StudentMahapolaForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    registrationNumber: '',
    fullName: user?.name || '',
    nic: '',
    degreeProgram: '',
    academicYear: '',
    scholarshipType: 'Merit',
    installmentMonth: '',
    bankAccountNumber: '',
    bankName: '',
    branchName: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/mahapola/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success('Mahapola/Bursary Application submitted successfully!');
        setFormData({
          ...formData, // Keep name etc
          registrationNumber: '',
          degreeProgram: '',
          academicYear: '',
          installmentMonth: '',
          bankAccountNumber: '',
          bankName: '',
          branchName: '',
          nic: '',
        });
      } else {
        toast.error(result.message || 'Error submitting form');
      }
    } catch (error) {
      toast.error('Server error submitting application');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center gap-4">
          <FiDollarSign className="w-8 h-8 opacity-80" />
          <div>
            <h2 className="text-2xl font-bold">Mahapola / Bursary Application Form</h2>
            <p className="mt-1 text-emerald-100">Submit your details to claim scholarship installments</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Applicant Profile */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Section 1: Applicant Profile</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="e.g. IT20123456"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">NIC Number</label>
              <input
                type="text"
                name="nic"
                value={formData.nic}
                onChange={handleChange}
                placeholder="e.g. 199912345678 or 991234567V"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Degree Program</label>
              <input
                type="text"
                name="degreeProgram"
                value={formData.degreeProgram}
                onChange={handleChange}
                placeholder="e.g. BSc (Hons) in IT"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            {/* Scholarship Details */}
            <div className="col-span-1 md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Section 2: Scholarship Details</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Academic Year</label>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                required
              >
                <option value="">Select Year</option>
                <option value="Year 1">Year 1</option>
                <option value="Year 2">Year 2</option>
                <option value="Year 3">Year 3</option>
                <option value="Year 4">Year 4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Scholarship Type</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scholarshipType"
                    value="Merit"
                    checked={formData.scholarshipType === 'Merit'}
                    onChange={handleChange}
                    className="mr-2 text-emerald-600 focus:ring-emerald-500"
                  />
                  Mahapola Merit
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scholarshipType"
                    value="Ordinary"
                    checked={formData.scholarshipType === 'Ordinary'}
                    onChange={handleChange}
                    className="mr-2 text-emerald-600 focus:ring-emerald-500"
                  />
                  Mahapola Ordinary
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scholarshipType"
                    value="Bursary"
                    checked={formData.scholarshipType === 'Bursary'}
                    onChange={handleChange}
                    className="mr-2 text-emerald-600 focus:ring-emerald-500"
                  />
                  Bursary
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Installment Month/Term</label>
              <input
                type="month"
                name="installmentMonth"
                value={formData.installmentMonth}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            {/* Bank Details */}
            <div className="col-span-1 md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Section 3: Bank Information</h3>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Bank Account Number (Must be registered under student's name)</label>
              <input
                type="text"
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleChange}
                placeholder="Account No."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="e.g. Bank of Ceylon (BOC) / People's Bank"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Branch Name</label>
              <input
                type="text"
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                placeholder="e.g. Campus Branch / City"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors focus:ring-4 focus:ring-emerald-200 disabled:opacity-70"
            >
              {loading ? (
                <FiRefreshCw className="animate-spin mr-2 h-5 w-5" />
              ) : (
                <FiSave className="mr-2 h-5 w-5" />
              )}
              {loading ? 'Submitting Details...' : 'Submit Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentMahapolaForm;

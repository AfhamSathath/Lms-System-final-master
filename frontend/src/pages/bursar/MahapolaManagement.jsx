import React, { useState } from 'react';
import { FiDollarSign, FiCheck, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const BursarMahapolaManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/mahapola', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setApplications(result.data);
      }
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/mahapola/${id}/process`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setApplications(applications.map(m => m._id === id ? { ...m, status: 'Processed' } : m));
        toast.success('Payment marked as processed and sent to bank.');
      }
    } catch (error) {
      toast.error('Error processing payment');
    }
  };

  const handleProcessAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/mahapola/process-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setApplications(result.data); // Update with returned modified lists
        toast.success('All pending payments processed.');
      }
    } catch (error) {
      toast.error('Error processing all payments');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FiDollarSign className="text-emerald-600" />
            Mahapola / Bursary Management
          </h1>
          <p className="text-slate-600">Process scholarship installments and generate bank files</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleProcessAll} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
            <FiCheck />
            Process All Pending
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition">
            <FiDownload />
            Export Bank File
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm text-slate-600">Student Info</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Type & Month</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Bank Details</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Status</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{app.fullName}</div>
                    <div className="text-sm text-slate-500">{app.registrationNumber}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{app.scholarshipType}</div>
                    <div className="text-sm text-slate-500">{app.installmentMonth}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{app.bankAccountNumber}</div>
                    <div className="text-sm text-slate-500">{app.bankName}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium
                      ${app.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {app.status === 'Pending' && (
                      <button 
                        onClick={() => handleProcessPayment(app._id)} 
                        className="text-sm px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition font-medium"
                      >
                        Process
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    No active Mahapola/Bursary applications found.
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

export default BursarMahapolaManagement;

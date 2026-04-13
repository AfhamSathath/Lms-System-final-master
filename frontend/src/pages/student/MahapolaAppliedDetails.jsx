import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiClock, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Loader from '../../components/common/loader';

const StudentMahapolaDetails = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/mahapola/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setApplications(result.data);
      } else {
        toast.error('Failed to load your applications');
      }
    } catch (error) {
      toast.error('Server error while loading applications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FiDollarSign className="text-3xl text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-800">My Mahapola/Bursary Details</h1>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-slate-500">You have not submitted any applications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{app.scholarshipType} Application</h3>
                    <p className="text-sm text-slate-500">Submitted on: {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    app.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {app.status === 'Pending' ? <FiClock /> : <FiCheckCircle />}
                    {app.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Installment Month</p>
                    <p className="text-sm font-medium text-slate-800 mt-1">{app.installmentMonth}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Academic Year</p>
                    <p className="text-sm font-medium text-slate-800 mt-1">{app.academicYear}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Bank Name</p>
                    <p className="text-sm font-medium text-slate-800 mt-1">{app.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Account Number</p>
                    <p className="text-sm font-medium text-slate-800 mt-1">
                      ••••{app.bankAccountNumber.slice(-4) || app.bankAccountNumber}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentMahapolaDetails;

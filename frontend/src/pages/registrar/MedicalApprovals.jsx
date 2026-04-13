import React, { useState } from 'react';
import { FiCheckCircle, FiXCircle, FiEye, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminMedicalApprovals = () => {
  const [medicals, setMedicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});

  useEffect(() => {
    fetchMedicals();
  }, []);

  const fetchMedicals = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/medicals/admin/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await response.json();
      if (result.success) {
        setMedicals(result.data);
      }
    } catch (error) {
      toast.error('Failed to fetch medicals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const response = await fetch(`http://localhost:5001/api/medicals/admin/review/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, adminRemarks: remarks[id] || '' })
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Medical application ${action.toLowerCase()}d.`);
        fetchMedicals();
      } else {
        toast.error(result.message || 'Action failed');
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FiActivity className="text-blue-600" />
            Medical Approvals
          </h1>
          <p className="text-slate-600">Review and verify student medical certificates</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm text-slate-600">Student Info</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Illness & MC Info</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Leave Dates</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Admin Remarks</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : medicals.map((req) => (
                <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{req.fullName}</div>
                    <div className="text-sm text-slate-500">{req.registrationNumber} | {req.faculty}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{req.illness}</div>
                    <div className="text-sm text-slate-500">{req.mcNumber} • {req.doctorName}</div>
                    <div className="text-xs text-blue-600 mt-1 cursor-pointer" onClick={() => window.open(`http://localhost:5001${req.documentUrl}`, '_blank')}>View Document</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-800">{new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-500 mt-1">HOD Remarks: {req.hodRemarks || 'None'}</div>
                  </td>
                  <td className="p-4">
                    <input
                      type="text"
                      className="border border-slate-300 rounded p-1 text-sm w-full"
                      placeholder="Add remarks..."
                      value={remarks[req._id] || ''}
                      onChange={(e) => setRemarks({ ...remarks, [req._id]: e.target.value })}
                    />
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleAction(req._id, 'APPROVE')} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200" title="Approve">
                      Approve
                    </button>
                    <button onClick={() => handleAction(req._id, 'REJECT')} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200" title="Reject">
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && medicals.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    No medical applications pending admin review.
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

export default AdminMedicalApprovals;

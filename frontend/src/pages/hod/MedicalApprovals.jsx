import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const HodMedicalApprovals = () => {
  const [medicals, setMedicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});

  useEffect(() => {
    fetchMedicals();
  }, []);

  const fetchMedicals = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/medicals/hod/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setMedicals(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch medical forms');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const response = await axios.put(`http://localhost:5001/api/medicals/hod/review/${id}`, {
        action,
        hodRemarks: remarks[id] || ''
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        toast.success(`Medical application ${action.toLowerCase()}d successfully`);
        fetchMedicals();
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold border-l-4 border-blue-600 pl-3">Pending Medical Certificates</h1>
          <p className="text-gray-500 mt-1">Review student medical leaves before final admin processing</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : medicals.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-500 mb-4">
            <FiCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">All Caught Up!</h3>
          <p className="text-gray-500 mt-1">There are no pending medical forms to review.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {medicals.map(medical => (
            <div key={medical._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{medical.fullName} ({medical.registrationNumber})</h3>
                    <p className="text-sm text-gray-500 mt-1">{medical.faculty} • {medical.semester}</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">PENDING REVIEW</span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Diagnosis / Illness</p>
                    <p className="font-medium text-gray-800 mt-1">{medical.illness}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Leave Duration</p>
                    <p className="font-medium text-gray-800 mt-1">
                      {new Date(medical.startDate).toLocaleDateString()} - {new Date(medical.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Doctor Details</p>
                    <p className="text-sm text-gray-700 mt-1">{medical.doctorName} • {medical.hospital}</p>
                    <p className="text-xs text-gray-500">Ref: {medical.mcNumber}</p>
                  </div>
                  <div>
                     <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Medical Document</p>
                     <a href={`http://localhost:5001${medical.documentUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                       <FiFileText className="mr-2" /> View Certificate
                     </a>
                  </div>
                </div>

                <div className="mt-6 border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">HOD Remarks</label>
                  <input
                    type="text"
                    value={remarks[medical._id] || ''}
                    onChange={(e) => setRemarks({...remarks, [medical._id]: e.target.value})}
                    placeholder="Add optional remarks..."
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-4"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(medical._id, 'APPROVE')}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700"
                    >
                      <FiCheck className="mr-2" /> Approve & Forward
                    </button>
                    <button
                      onClick={() => handleAction(medical._id, 'REJECT')}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700"
                    >
                      <FiX className="mr-2" /> Reject
                    </button>
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

export default HodMedicalApprovals;

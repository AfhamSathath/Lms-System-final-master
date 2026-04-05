import React, { useState, useEffect } from 'react';
import { FiUserCheck, FiUserX, FiSearch, FiFilter, FiCheckCircle, FiClock, FiShield } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EnrollmentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchPendingStudents();
  }, [filter]);

  const fetchPendingStudents = async () => {
    setLoading(true);
    try {
      // In real-world, we'd have a specific endpoint for Registrar's enrollment queue
      const res = await api.get(`/api/auth/users?role=student${filter ? `&status=${filter}` : ''}`);
      setStudents(res.data.users);
    } catch (err) {
      toast.error('Failed to load enrollment queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, status) => {
    try {
      await api.put(`/api/auth/users/${id}/toggle-status`, { isActive: status });
      toast.success(`Student enrollment ${status ? 'Approved' : 'Suspended'}`);
      fetchPendingStudents();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase">Enrollment Verification</h1>
          <p className="text-gray-500 font-bold flex items-center gap-2">
             <FiShield className="text-cyan-600" /> Registrar's Official Registry Queue
          </p>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search Index / Name..." className="pl-12 pr-6 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-bold" />
           </div>
           <button className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-cyan-600 hover:bg-cyan-50 transition-all">
              <FiFilter />
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center gap-8">
           {['pending', 'active', 'inactive'].map((s) => (
             <button 
                key={s}
                onClick={() => setFilter(s === 'pending' ? 'inactive' : s)}
                className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                  (filter === s || (filter === 'inactive' && s === 'pending')) ? 'bg-cyan-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
             >
                {s} Applications
             </button>
           ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Scholar Identity</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Contact Node</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Academic Program</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Compliance Status</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Registry Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center font-black animate-pulse text-cyan-200 uppercase tracking-widest">Querying Global Registry...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center font-bold text-gray-300 uppercase tracking-tighter">No pending applications found in current scope.</td></tr>
              ) : students.map((stu) => (
                <tr key={stu._id} className="hover:bg-cyan-50/20 transition-all">
                  <td className="px-8 py-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-600 font-black shadow-sm">
                       {stu.name.charAt(0)}
                    </div>
                    <div>
                       <p className="font-black text-gray-800">{stu.name}</p>
                       <p className="text-xs font-black text-cyan-600">{stu.studentId}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <p className="text-sm font-bold text-gray-600 italic">{stu.email}</p>
                     <p className="text-xs font-bold text-gray-400">{stu.phone || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-6">
                     <p className="font-black text-gray-700">{stu.department || 'General Faculty'}</p>
                     <p className="text-xs font-bold text-gray-400">Year {stu.yearOfStudy} | Sem {stu.semester}</p>
                  </td>
                  <td className="px-8 py-6">
                     {stu.isActive ? (
                       <span className="flex items-center gap-1 text-emerald-600 font-black text-xs uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                          <FiCheckCircle /> Authorized
                       </span>
                     ) : (
                       <span className="flex items-center gap-1 text-amber-600 font-black text-xs uppercase tracking-widest bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                          <FiClock /> Pending
                       </span>
                     )}
                  </td>
                  <td className="px-8 py-6 flex gap-4">
                     {!stu.isActive ? (
                       <button onClick={() => handleApproval(stu._id, true)} className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all">
                          <FiUserCheck size={18} />
                       </button>
                     ) : (
                       <button onClick={() => handleApproval(stu._id, false)} className="p-3 bg-rose-600 text-white rounded-xl shadow-lg hover:bg-rose-700 transition-all">
                          <FiUserX size={18} />
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
  );
};

export default EnrollmentManagement;

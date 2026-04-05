import React, { useState, useEffect } from 'react';
import { FiUsers, FiFileText, FiAward, FiSettings, FiBriefcase, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';

const RegistrarDashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrarStats = async () => {
      try {
        const res = await api.get('/api/stats/dashboard');
        setStatsData(res.data.data);
      } catch (err) {
        console.error('Failed to pull registrar records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrarStats();
  }, []);

  if (loading) return <div className="p-20 text-center font-black text-cyan-500 animate-pulse uppercase tracking-[0.2em]">Synchronizing Academic Records...</div>;

  const stats = [
    { title: 'Active Enrollments', value: statsData?.activeEnrollments || 0, icon: FiUsers, color: 'bg-cyan-500' },
    { title: 'Registered Students', value: statsData?.totalStudents || 0, icon: FiAward, color: 'bg-blue-500' },
    { title: 'Pending Transcripts', value: statsData?.pendingTranscripts || 0, icon: FiFileText, color: 'bg-teal-500' },
    { title: 'Global Growth', value: statsData?.growth?.length || 0, icon: FiBriefcase, color: 'bg-indigo-500' },
  ];

  const recentRequests = [
    { name: 'Alice Smith', id: 'S1024', type: 'Official Transcript', status: 'In Review', date: '2026-04-03' },
    { name: 'Bob Johnson', id: 'S1045', type: 'Semester Result Correction', status: 'Pending Approval', date: '2026-04-02' },
    { name: 'Charlie Davis', id: 'S1067', type: 'Degree Certification', status: 'Approved', date: '2026-04-01' },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 leading-tight uppercase">Registrar's Portal</h1>
          <p className="text-gray-500 text-lg">Academic Records & Enrollment Operations Management</p>
        </div>
        <button className="bg-cyan-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-cyan-500/20 hover:bg-cyan-700 transition-all flex items-center gap-2">
           <FiRefreshCw className="animate-spin-slow" /> System Sync
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 items-center justify-between flex"
          >
            <div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">{stat.title}</p>
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            </div>
            <div className={`${stat.color} p-5 rounded-3xl text-white shadow-lg`}>
              <stat.icon size={28} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-wider">Pending Academic Petitions</h2>
          <FiSettings className="text-gray-400 cursor-pointer hover:rotate-90 transition-transform" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white">
              <tr>
                <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">Student Context</th>
                <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">Request Classification</th>
                <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">Application Status</th>
                <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">Received Date</th>
                <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentRequests.map((req, idx) => (
                <tr key={idx} className="hover:bg-cyan-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-black text-gray-800">{req.name}</p>
                    <p className="text-sm text-cyan-600 font-bold uppercase tracking-tighter">{req.id}</p>
                  </td>
                  <td className="px-8 py-6 font-bold text-gray-600">{req.type}</td>
                  <td className="px-8 py-6">
                     <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${
                       req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                     }`}>
                        {req.status}
                     </span>
                  </td>
                  <td className="px-8 py-6 font-medium text-gray-400">{req.date}</td>
                  <td className="px-8 py-6">
                     <button className="text-cyan-600 font-black hover:underline underline-offset-4">Process File</button>
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

export default RegistrarDashboard;

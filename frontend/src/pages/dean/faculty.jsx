import React, { useState, useEffect } from 'react';
import { FiUsers, FiBook, FiTrendingUp, FiActivity, FiMapPin, FiBarChart2, FiAward, FiSettings, FiUser, FiInfo } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FacultyOversight = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      // In a real-world MIS, we'd fetch staff by the Dean's faculty/department context
      const res = await api.get('/api/auth/users?role=lecturer');
      setStaff(res.data.users);
    } catch (err) {
      toast.error('Failed to aggregate Faculty Staff data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-12">
          <div className="max-w-2xl">
             <h1 className="text-5xl font-black text-gray-900 leading-tight uppercase tracking-tight mb-2">Faculty Human Capital</h1>
             <p className="text-rose-600 font-bold flex items-center gap-2 text-xl">
                <FiUsers size={24} /> Academic Personnel & Performance Auditing Hub
             </p>
          </div>
          <div className="flex gap-4">
             <button className="px-10 py-5 bg-rose-600 text-white font-black rounded-[40px] shadow-2xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center justify-center gap-3 tracking-widest uppercase text-xs">
                <FiBarChart2 /> Generate KPI Report
             </button>
             <button className="px-10 py-5 bg-white text-gray-800 font-black rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl transition-all flex items-center justify-center gap-3 tracking-widest uppercase text-xs">
                <FiSettings /> Faculty Policies
             </button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
             <div className="col-span-full p-40 text-center font-black animate-pulse text-rose-200 uppercase tracking-widest text-2xl">Aggregating Faculty Personnel data...</div>
          ) : staff.map((lecturer, i) => (
             <motion.div
               key={lecturer._id}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.05 }}
               className="bg-white p-10 rounded-[50px] shadow-sm border border-gray-100 relative group overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150 text-rose-600">
                   <FiAward size={100} />
                </div>
                
                <div className="flex items-center gap-6 mb-8 relative z-10">
                   <div className="w-20 h-20 rounded-[35px] bg-rose-600 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-rose-200">
                      {lecturer.name.charAt(0)}
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-gray-900 leading-tight">{lecturer.name}</h3>
                      <p className="text-rose-600 font-bold text-sm tracking-tighter uppercase">{lecturer.lecturerId || 'PROF-ID-PENDING'}</p>
                   </div>
                </div>

                <div className="space-y-4 mb-10 relative z-10">
                   <div className="flex items-center gap-3 text-gray-500">
                      <FiMapPin className="text-rose-400" />
                      <span className="font-bold text-sm">{lecturer.department || 'Department Global'}</span>
                   </div>
                   <div className="flex items-center gap-3 text-gray-500">
                      <FiAward className="text-rose-400" />
                      <span className="font-bold text-sm">{lecturer.qualifications || 'Academic Credentials Pending'}</span>
                   </div>
                </div>

                <div className="flex justify-between items-center relative z-10 pt-6 border-t border-gray-100">
                   <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-1 rounded-full uppercase tracking-tighter">Active</span>
                   </div>
                   <button className="p-4 bg-gray-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                      <FiInfo size={20} />
                   </button>
                </div>
             </motion.div>
          ))}
       </div>
    </div>
  );
};

export default FacultyOversight;

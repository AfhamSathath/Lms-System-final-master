import React, { useState, useEffect } from 'react';
import { FiUsers, FiBook, FiTrendingUp, FiActivity, FiMapPin, FiBarChart2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DeanDashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatsAndDepartments();
  }, []);

  const fetchStatsAndDepartments = async () => {
    try {
      const [statsRes, deptsRes] = await Promise.allSettled([
        api.get('/api/stats/dashboard'),
        api.get('/api/departments')
      ]);
      
      if (statsRes.status === 'fulfilled') {
        setStatsData(statsRes.value.data.data);
      }
      
      if (deptsRes.status === 'fulfilled') {
        setDepartments(deptsRes.value.data.departments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    toast.success(`Initiated: ${action}`);
  };

  if (loading) return <div className="p-8 text-center font-bold text-gray-400 animate-pulse uppercase tracking-widest">Hydrating Faculty Intelligence...</div>;

  const stats = [
    { title: 'Faculty Students', value: statsData?.totalStudents || 0, icon: FiUsers, color: 'bg-rose-500' },
    { title: 'Avg. Faculty GPA', value: statsData?.averageGPA || '0.00', icon: FiTrendingUp, color: 'bg-emerald-500' },
    { title: 'Courses Under Mgmt', value: statsData?.totalCourses || 0, icon: FiBook, color: 'bg-blue-500' },
    { title: 'Pending Repeat Approvals', value: statsData?.pendingRepeats || 0, icon: FiActivity, color: 'bg-amber-500' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Faculty Dean's Desk</h1>
        <p className="text-gray-500">Global Oversight & Faculty Performance Analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4"
          >
            <div className={`${stat.color} p-4 rounded-2xl text-white shadow-lg`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.title}</p>
              <p className="text-2xl font-black text-gray-800">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Departmental Progress */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Departmental KPI Rankings</h2>
            <FiBarChart2 className="text-gray-400" />
          </div>
          <div className="space-y-6">
            {departments.length > 0 ? (
              departments.map((dept, i) => (
                <div key={dept._id || i} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex justify-between mb-2">
                    <div>
                      <span className="font-bold text-gray-700">{dept.name}</span>
                      <span className="text-sm text-gray-400 ml-2">({dept.code})</span>
                    </div>
                    <span className="text-sm bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-full">{dept.stats?.students || 0} Students</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>Courses: {dept.stats?.courses || 0}</span>
                    <span>Staff: {dept.stats?.lecturers || 0}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">No departments found in this faculty</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-rose-600 to-rose-800 p-8 rounded-3xl text-white shadow-xl">
          <h2 className="text-xl font-bold mb-6">Dean's Quick Action</h2>
          <div className="space-y-4">
             <button onClick={() => handleQuickAction('Policy Update Broadcast')} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-left px-6 border border-white/10 transition-all font-bold">Faculty Policy Update</button>
             <button onClick={() => handleQuickAction('Budget Review Pipeline')} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-left px-6 border border-white/10 transition-all font-bold">Approve Departmental Budget</button>
             <button onClick={() => handleQuickAction('Quality Report Compilation')} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-left px-6 border border-white/10 transition-all font-bold">Annual Quality Assurance Report</button>
             <button onClick={() => handleQuickAction('Emergency Meeting Protocol')} className="w-full py-4 bg-rose-400 text-rose-900 rounded-2xl text-center px-6 font-black shadow-lg">Emergency Faculty meeting</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeanDashboard;

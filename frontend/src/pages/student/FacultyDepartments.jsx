import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiLayers, FiUsers, FiBook, FiHash, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

const FacultyDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/api/departments');
        // The endpoint might return { data: [...] } or { departments: [...] }
        setDepartments(res.data.data || res.data.departments || []);
      } catch (err) {
        console.error('Failed to fetch departments');
      } finally {
        setLoading(false);
      }
    };
    fetchDepts();
  }, []);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
           <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none mb-2">Faculty Departments</h1>
           <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">University organizational structure & departmental overview</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {departments.length === 0 ? (
             <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm text-center">No departmental information available at this time</p>
             </div>
           ) : (
             departments.map((dept, idx) => (
               <motion.div 
                 key={dept._id}
                 initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-indigo-50 transition-all group"
               >
                 <div className="p-10">
                   <div className="flex justify-between items-start mb-8">
                     <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                       <FiLayers />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-slate-100 rounded-full text-slate-500">
                       {dept.code}
                     </span>
                   </div>

                   <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4 group-hover:text-indigo-600 transition-colors">
                     {dept.name}
                   </h3>
                   
                   <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-10 leading-relaxed">
                     {dept.description || 'Specialized department focusing on cutting-edge research and high-quality academic instruction.'}
                   </p>

                   <div className="grid grid-cols-3 gap-4 pb-8 mb-8 border-b border-slate-50 text-center">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Students</p>
                         <p className="text-lg font-black text-slate-700">{dept.stats?.totalStudents || 0}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Faculty</p>
                         <p className="text-lg font-black text-slate-700">{dept.stats?.totalLecturers || 0}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Courses</p>
                         <p className="text-lg font-black text-slate-700">{dept.stats?.totalCourses || 0}</p>
                      </div>
                   </div>

                   <button className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-xs group-hover:gap-4 transition-all">
                      Visit Department Page <FiArrowRight />
                   </button>
                 </div>
               </motion.div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

export default FacultyDepartments;

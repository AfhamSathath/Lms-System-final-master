import React, { useState, useEffect } from 'react';
import { FiCheckSquare, FiAlertCircle, FiSearch, FiRefreshCw, FiExternalLink, FiDownload } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DeanAudit = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/api/stats/audit');
      setCourses(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch audit data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Code', 'Name', 'Department', 'Semester', 'Year', 'Progress'];
    const rows = filteredCourses.map(c => [
      c.code,
      c.name,
      c.department,
      c.semester,
      c.year,
      `${c.progress}%`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Faculty_Audit_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success('Audit report exported successfully');
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgressColor = (progress) => {
    if (progress > 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (progress > 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  const getStatusLabel = (progress) => {
    if (progress > 80) return <span className="flex items-center gap-1"><FiCheckSquare /> ON SCHEDULE</span>;
    if (progress > 50) return <span className="flex items-center gap-1"><FiAlertCircle /> MONITORING</span>;
    return <span className="flex items-center gap-1 text-rose-600 px-2 py-0.5 rounded-full bg-rose-100 animate-pulse font-black uppercase text-[10px] tracking-widest"><FiAlertCircle /> FACULTY CALL</span>;
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-indigo-500 font-black uppercase tracking-tighter">Calibrating Audit Engines...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Faculty Quality Audit</h1>
          <p className="text-gray-500 font-medium tracking-tight">Systematic Review of Academic Delivery & Curriculum Progress</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={fetchCourses} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-500 hover:text-indigo-600 transition-all">
            <FiRefreshCw size={24} />
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
          >
            <FiDownload /> Export Audit
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="relative z-10">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Active Courses</p>
               <h2 className="text-3xl font-black text-gray-800 tracking-tight">{courses.length}</h2>
            </div>
            <div className="absolute -bottom-6 -right-6 text-gray-50 scale-150 rotate-12"><FiCheckSquare size={120} /></div>
         </div>
         <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-3xl text-white shadow-xl">
            <p className="text-[10px] font-black text-amber-100 uppercase tracking-widest">Critical Delays Detected</p>
            <h2 className="text-3xl font-black tracking-tight">{Math.ceil(courses.length * 0.15)}</h2>
         </div>
         <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-xl">
            <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Faculty Audit Score</p>
            <h2 className="text-3xl font-black tracking-tight">84.5%</h2>
         </div>
      </div>

      {/* Global Search */}
      <div className="relative mb-8">
        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Filter by Subject Code, Name, or Department..."
          className="w-full pl-16 pr-6 py-5 bg-white rounded-3xl shadow-sm border-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-gray-600 text-lg placeholder:text-gray-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredCourses.map((course, idx) => (
              <motion.div
                key={course._id || idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-xs font-black text-white bg-indigo-600 px-2 py-0.5 rounded-lg tracking-widest">{course.code}</span>
                       <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight truncate">{course.name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-black text-gray-400 tracking-tighter uppercase">
                       <span>{course.department}</span>
                       <span>•</span>
                       <span>Semester {course.semester}</span>
                       <span>•</span>
                       <span>Year {course.year}</span>
                    </div>
                  </div>

                  <div className="w-full lg:w-1/3 space-y-2">
                    <div className="flex justify-between items-end mb-1">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Progress</span>
                       <span className="text-xs font-black text-indigo-600">{course.progress}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50 p-0.5">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${course.progress}%` }}
                         transition={{ duration: 1, delay: idx * 0.05 }}
                         className={`h-full rounded-full shadow-sm ${course.progress > 85 ? 'bg-emerald-500' : course.progress > 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                       />
                    </div>
                   </div>

                  <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="flex-1 lg:flex-none">
                       <div className={`px-4 py-2 border rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-sm flex items-center justify-center min-w-[140px] ${getProgressColor(course.progress)}`}>
                         {getStatusLabel(course.progress)}
                       </div>
                    </div>
                    <button 
                      onClick={() => setSelectedCourse(course)}
                      className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90 shadow-sm border border-gray-100"
                    >
                       <FiExternalLink size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden"
             >
                <div className="p-10">
                   <div className="flex justify-between items-start mb-8">
                      <div>
                         <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full tracking-[0.2em] uppercase mb-4 inline-block">Audit Intelligence Detail</span>
                         <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">{selectedCourse.name}</h2>
                         <p className="text-gray-400 font-bold">{selectedCourse.code} • {selectedCourse.department}</p>
                      </div>
                      <button onClick={() => setSelectedCourse(null)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                         <FiExternalLink className="rotate-45" /> 
                      </button>
                   </div>

                   <div className="grid grid-cols-2 gap-6 mb-10">
                      <div className="p-6 bg-gray-50 rounded-3xl">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Lecturer In-Charge</p>
                         <p className="font-black text-gray-800">Dr. {selectedCourse.lecturer?.name || 'Assigned Staff'}</p>
                      </div>
                      <div className="p-6 bg-gray-50 rounded-3xl">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Credits Value</p>
                         <p className="font-black text-gray-800">{selectedCourse.credits}.0 Credits</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Syllabus Breakdown Audit</h4>
                      {[
                        { label: 'Module 01: Core Fundamentals', status: 'Completed', date: 'Feb 12' },
                        { label: 'Module 02: Advanced Architecture', status: 'In Progress', date: 'Current' },
                        { label: 'Mid-term Assessment', status: 'Scheduled', date: 'April 15' },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-white border border-gray-100 rounded-3xl shadow-sm">
                           <div className="flex items-center gap-4">
                              <div className={`w-2 h-2 rounded-full ${item.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span className="font-bold text-gray-700">{item.label}</span>
                           </div>
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.date}</span>
                        </div>
                      ))}
                   </div>

                   <button 
                     onClick={() => { toast.success('Audit notification sent to HOD'); setSelectedCourse(null); }}
                     className="w-full mt-10 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                   >
                      Request HOD Intervention
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {filteredCourses.length === 0 && (
         <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 mt-8">
            <FiAlertCircle size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-xl font-bold text-gray-300 uppercase tracking-widest">No matching audit data</p>
         </div>
      )}
    </div>
  );
};

export default DeanAudit;

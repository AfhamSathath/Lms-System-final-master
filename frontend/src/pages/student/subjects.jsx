import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiBook, FiUser, FiClock, FiDownload, FiSearch, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const StudentSubjects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState(user?.semester || 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(user?.yearOfStudy || '1st Year');

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  useEffect(() => {
    fetchSubjects();
  }, [selectedSemester, selectedYear, user]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      // Use efficient year/semester endpoint
      const response = await api.get(`/api/subjects/year/${selectedYear}/semester/${selectedSemester}`);
      let all = (response?.data?.subjects && Array.isArray(response.data.subjects)) ? response.data.subjects : [];
      
      // Still apply department filter if necessary (though backend should handle it)
      if (user?.department) {
        all = all.filter(sub => sub.department === user.department);
      }
      
      setSubjects(all);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects. Please try again.');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };


  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const handleMaterialsClick = (subjectId) => {
    navigate(`/student/files?subject=${subjectId}`);
  };

  const handleSyllabusClick = (syllabusUrl) => {
    if (syllabusUrl) {
      window.open(syllabusUrl, '_blank');
    } else {
      toast.error('Syllabus not available for this subject');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center">
            My Subjects
            <span className="ml-3 px-3 py-1 bg-indigo-100 text-indigo-600 text-sm font-bold rounded-full">
              {filteredSubjects.length}
            </span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">View all subjects for each semester</p>
        </motion.div>

        {/* Filters and Selection - Styled exactly like the image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] p-8 border border-slate-100"
          >
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 italic">
               Select Academic Year
             </label>
             <div className="flex flex-wrap gap-4">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
                      selectedYear === y 
                        ? 'bg-[#1a1c23] text-white shadow-[0_10px_20px_-5px_rgba(26,28,35,0.4)] scale-105' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {y}
                  </button>
                ))}
             </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] p-8 border border-slate-100"
          >
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 italic">
               Select Semester
             </label>
             <div className="flex flex-wrap gap-4">
                {[1, 2].map(sem => (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className={`px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
                      selectedSemester === sem 
                        ? 'bg-indigo-600 text-white shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] scale-105' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    Semester {sem}
                  </button>
                ))}
             </div>
          </motion.div>
        </div>

        {/* Search Bar - Aesthetic Revision */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="relative group">
            <FiSearch className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xl" />
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-3xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all text-slate-700 placeholder-slate-300 font-medium"
            />
          </div>
        </motion.div>

        {/* Subjects Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredSubjects.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredSubjects.map(subject => (
                  <motion.div 
                    key={subject._id}
                    variants={itemVariants}
                    whileHover={{ y: -10 }}
                    layout
                    className="bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-50 flex flex-col group"
                  >
                    {/* Header with Gradient */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-8 py-7 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                      <h3 className="text-xl font-bold text-white relative z-10 leading-tight group-hover:scale-[1.02] transition-transform">
                        {subject.name}
                      </h3>
                      <p className="text-indigo-100 text-xs font-black tracking-widest mt-2 uppercase opacity-80">
                        {subject.code}
                      </p>
                    </div>

                    <div className="p-8 flex-1 flex flex-col">
                      <div className="space-y-5 mb-8">
                        <div className="flex items-center text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mr-4">
                            <FiBook className="text-blue-600 text-lg" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Credits</p>
                            <p className="text-sm font-bold text-slate-700">{subject.credits}</p>
                          </div>
                        </div>

                        <div className="flex items-center text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mr-4">
                            <FiUser className="text-emerald-600 text-lg" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Lecturer</p>
                            <p className="text-sm font-bold text-slate-700">{subject.lecturer?.name || 'Not Assigned'}</p>
                          </div>
                        </div>

                        {subject.description && (
                          <div className="mt-4">
                             <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                               {subject.description}
                             </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto flex flex-col gap-3">
                        <button 
                          onClick={() => handleMaterialsClick(subject._id)}
                          className="w-full bg-slate-900 text-white py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center hover:bg-slate-800 transition-all shadow-[0_10px_30px_-10px_rgba(26,28,35,0.3)] group/btn"
                        >
                          <FiDownload className="mr-2 text-lg group-hover/btn:translate-y-0.5 transition-transform" />
                          Study Materials
                        </button>
                        
                        <button 
                          onClick={() => handleSyllabusClick(subject.syllabus)}
                          className="w-full bg-white border-2 border-slate-100 text-slate-600 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center hover:border-indigo-100 hover:bg-indigo-50/30 hover:text-indigo-600 transition-all"
                        >
                          <FiBook className="mr-2" />
                          View Syllabus
                          <FiArrowRight className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-32 bg-white rounded-[3rem] shadow-[0_15px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiBook className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700">No subjects found</h3>
                <p className="text-slate-400 mt-2 max-w-xs mx-auto">
                  We couldn't find any subjects for Semester {selectedSemester} in {selectedYear}. Try adjusting your filters.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default StudentSubjects;
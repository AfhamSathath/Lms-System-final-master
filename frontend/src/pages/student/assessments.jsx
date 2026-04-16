import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiAward, FiBook, FiCheckCircle, FiInfo, FiTrendingUp, FiBarChart2, FiPieChart } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StudentAssessments = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null);
  const [selectedYear, setSelectedYear] = useState('1st Year');
  const [selectedSemester, setSelectedSemester] = useState(1);

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  useEffect(() => {
    fetchAssessments();
  }, [user]);

  useEffect(() => {
    const filtered = enrollments.filter(e => 
      e.yearOfStudy === selectedYear && e.semester === parseInt(selectedSemester)
    );
    setFilteredEnrollments(filtered);
    if (filtered.length > 0) {
      setActiveSubject(filtered[0]._id);
    } else {
      setActiveSubject(null);
    }
  }, [enrollments, selectedYear, selectedSemester]);

  const fetchAssessments = async () => {
    try {
      const studentId = user?.id || user?._id;
      const res = await api.get(`/api/enrollments/student/${studentId}`);
      if (res.data.success) {
        setEnrollments(res.data.enrollments || []);
      }
    } catch (err) {
      toast.error("Failed to load assessment marks");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const currentEnrollment = filteredEnrollments.find(e => e._id === activeSubject);

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase font-outfit">Continuous Evaluation</h1>
           <p className="text-slate-500 mt-2 font-medium italic">Detailed breakdown of internal assessment marks and CA progress.</p>
        </div>
        
        {/* Quick Stats Summary */}
        <div className="flex gap-4">
           <div className="bg-white px-6 py-4 rounded-3xl shadow-xl border border-slate-100 hidden sm:block">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Modules</p>
              <p className="text-xl font-black text-slate-800">{filteredEnrollments.length}</p>
           </div>
        </div>
      </div>

      {/* Modern Filter Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
         <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000">
               <FiBook className="h-32 w-32" />
            </div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 italic">Academic Year</label>
            <div className="flex flex-wrap gap-4 relative z-10">
               {years.map(y => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${
                       selectedYear === y 
                       ? 'bg-slate-900 text-white shadow-2xl scale-105' 
                       : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {y}
                  </button>
               ))}
            </div>
         </div>

         <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-indigo-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000">
               <FiAward className="h-32 w-32" />
            </div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 italic">Semester</label>
            <div className="flex flex-wrap gap-4 relative z-10">
               {[1, 2].map(sem => (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${
                       selectedSemester === sem 
                       ? 'bg-indigo-600 text-white shadow-2xl scale-105' 
                       : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    Semester {sem}
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Subject List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[2rem] shadow-xl p-6 border border-slate-100 sticky top-24">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Registered Modules</h3>
            <div className="space-y-3">
              {filteredEnrollments.map((e) => (
                <button
                  key={e._id}
                  onClick={() => setActiveSubject(e._id)}
                  className={`w-full text-left p-5 rounded-[1.5rem] transition-all duration-300 group relative overflow-hidden ${
                    activeSubject === e._id 
                    ? 'bg-slate-900 text-white shadow-2xl scale-[1.03] z-10' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-50'
                  }`}
                >
                  <div className="relative z-10">
                    <p className={`text-[10px] font-black uppercase mb-1 ${activeSubject === e._id ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {e.course?.code}
                    </p>
                    <p className="text-sm font-black truncate leading-tight uppercase tracking-tight">
                      {e.course?.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            
            {filteredEnrollments.length === 0 && (
              <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <FiInfo className="mx-auto h-8 w-8 text-slate-200 mb-3" />
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">No Modules Found</p>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {currentEnrollment ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Subject Header Card */}
              <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-100 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <FiAward className="h-64 w-64 -mr-16 -mt-16" />
                 </div>
                 
                 <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                       <div>
                          <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest mb-3 inline-block">
                             Semester {currentEnrollment.semester} • {currentEnrollment.yearOfStudy || currentEnrollment.academicYear}
                          </span>
                          <h2 className="text-3xl font-black text-slate-800 leading-tight uppercase tracking-tighter">
                            {currentEnrollment.course?.name}
                          </h2>
                          <p className="text-slate-400 font-bold text-sm tracking-widest mt-1">
                            {currentEnrollment.course?.code}
                          </p>
                       </div>
                       
                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Overall CA Mark</p>
                             <p className="text-5xl font-black text-slate-900 font-mono tracking-tighter">
                                {currentEnrollment.totalMarks?.toFixed(1) || '0.0'}<span className="text-xl text-slate-300">/35</span>
                             </p>
                          </div>
                          <div className="h-20 w-[1px] bg-slate-100 hidden md:block"></div>
                          <div className="hidden md:block">
                             <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                                <FiTrendingUp className="h-8 w-8" />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                          <div className="flex items-center gap-3 mb-4">
                             <FiBarChart2 className="text-indigo-600" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Components</span>
                          </div>
                          <p className="text-2xl font-black text-slate-800">{currentEnrollment.assessments?.length || 0}</p>
                          <p className="text-xs text-slate-400 font-medium">Evaluations published</p>
                       </div>

                       <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                          <div className="flex items-center gap-3 mb-4">
                             <FiPieChart className="text-emerald-600" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pass Status</span>
                          </div>
                          <p className="text-2xl font-black text-slate-800">{currentEnrollment.totalMarks >= 14 ? 'ON TRACK' : 'BELOW AVG'}</p>
                          <p className="text-xs text-slate-400 font-medium italic">Based on CA weightage</p>
                       </div>

                       <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                          <div className="flex items-center gap-3 mb-4">
                             <FiCheckCircle className="text-blue-600" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance</span>
                          </div>
                          <p className="text-2xl font-black text-slate-800">{currentEnrollment.attendancePercentage?.toFixed(1) || '0.0'}%</p>
                          <p className="text-xs text-slate-400 font-medium">Recorded eligibility</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Individual Marks Cards */}
              <div className="space-y-4">
                 <div className="flex items-center gap-3 mb-6 px-4">
                    <div className="h-6 w-1 bg-slate-900 rounded-full"></div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Assessment Detail</h3>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentEnrollment.assessments && currentEnrollment.assessments.length > 0 ? (
                      currentEnrollment.assessments.map((assess, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 group hover:scale-[1.02] transition-transform">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-widest inline-block mb-3">
                                    {assess.type}
                                 </span>
                                 <h4 className="text-xl font-black text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors uppercase tracking-tight">
                                    {assess.name}
                                 </h4>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Score</p>
                                 <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-lg">
                                    <span className="text-2xl font-black">{assess.marksObtained}</span>
                                    <span className="text-xs opacity-50 font-bold ml-1">/{assess.maxMarks}</span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <div className={`h-2 w-2 rounded-full ${assess.graded ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {assess.graded ? 'Graded & Published' : 'Processing'}
                                 </span>
                              </div>
                              {assess.remarks && (
                                <p className="text-xs text-slate-500 italic font-medium max-w-[60%] truncate">"{assess.remarks}"</p>
                              )}
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center">
                         <FiBook className="h-12 w-12 text-slate-100 mb-4" />
                         <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">No marks recorded yet</p>
                         <p className="text-slate-300 text-[10px] uppercase font-medium mt-2">Check back after HOD approval</p>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FiAward className="h-16 w-16 text-slate-100 mx-auto mb-6" />
                <h3 className="text-slate-400 font-bold uppercase tracking-widest">Select a module to view performance</h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAssessments;

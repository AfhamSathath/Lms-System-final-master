import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiTrendingUp, FiUser, FiBook, FiSearch, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

const HodProgress = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const departmentKey = user?.department;
      if (!departmentKey) {
        toast.error('Department not found in your profile');
        setLoading(false);
        return;
      }
      
      const res = await api.get(`/api/lecturer-assignments/department/${encodeURIComponent(departmentKey)}`);
      setAssignments(res.data.data || []);
    } catch (err) {
      console.error('Error fetching assignments', err);
      toast.error('Failed to load teaching progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user]);

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = 
      (a.subject?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.lecturer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.subject?.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = selectedYear === 'all' || a.academicYear === selectedYear;
    
    return matchesSearch && matchesYear;
  });

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-2">Department Teaching Progress</h1>
          <p className="text-slate-500 font-medium italic">Monitoring syllabus coverage across all subjects in <span className="text-indigo-600 font-bold">{user?.department}</span></p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-[2rem] border border-black p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search lecturer or subject..."
                className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 w-full transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 w-full transition-all appearance-none cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="all">All Academic Years</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end">
               <button 
                onClick={fetchAssignments}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
               >
                 Refresh Data
               </button>
            </div>
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-black p-20 text-center">
            <FiBook size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">No active assignments found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredAssignments.map((a, idx) => (
              <div 
                key={a._id} 
                className="bg-white rounded-[2.5rem] border border-black p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white border border-black rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        <FiBook size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter line-clamp-1">{a.subject?.name || 'N/A'}</h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{a.subject?.code} • {a.academicYear} • Sem {a.semester}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 mb-8 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-black flex items-center justify-center text-slate-400">
                      <FiUser />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest leading-none mb-1">Assigned Lecturer</p>
                      <p className="font-bold text-slate-700">{a.lecturer?.name || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Overall Coverage</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{a.curriculum?.progressPercentage || 0}%</p>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-4 border border-slate-200 p-1 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                          style={{ width: `${a.curriculum?.progressPercentage || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-white border border-black rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Lectures</p>
                        <p className="text-lg font-black text-indigo-600">
                          {a.curriculum?.lecturesCompleted}/{a.curriculum?.totalLectures}
                        </p>
                      </div>
                      <div className="p-4 bg-white border border-black rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Labs</p>
                        <p className="text-lg font-black text-emerald-600">
                          {a.curriculum?.practicalsCompleted}/{a.curriculum?.totalPracticals}
                        </p>
                      </div>
                      <div className="p-4 bg-white border border-black rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Assessments</p>
                        <p className="text-lg font-black text-amber-600">
                          {a.curriculum?.assignmentsCompleted}/{a.curriculum?.totalAssignments}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-black ${
                      a.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 
                      a.status === 'active' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {a.status}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 italic">Auto-updated via attendance logs</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HodProgress;

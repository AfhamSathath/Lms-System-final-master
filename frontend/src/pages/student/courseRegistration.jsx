import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiBookOpen, FiCheckCircle, FiPlus, FiAlertCircle, FiSearch, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StudentCourseRegistration = () => {
  const { user } = useAuth();
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [registeringId, setRegisteringId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(user?.yearOfStudy || '1st Year');
  const [selectedSemester, setSelectedSemester] = useState(user?.semester || 1);

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [1, 2];

  useEffect(() => {
    fetchData();
  }, [user, selectedYear, selectedSemester]);

  const fetchData = async () => {
    try {
      const [subjectsRes, enrollmentRes] = await Promise.all([
        api.get('/api/subjects'),
        api.get(`/api/enrollments/student/${user.id}`)
      ]);
      
      const allSubjects = subjectsRes.data.subjects || [];
      const userEnrollments = enrollmentRes.data.enrollments || [];
      
      // Filter for current department & selected period
      const filtered = allSubjects.filter(s => 
        s.department === user.department && 
        s.semester === selectedSemester &&
        s.year === selectedYear
      );
      
      setAvailableSubjects(filtered);
      setEnrolledSubjectIds(new Set(userEnrollments.map(e => e.course?._id)));
    } catch (error) {
      console.error('Error fetching registration data:', error);
      toast.error('Failed to load course list');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (subjectId) => {
    setRegisteringId(subjectId);
    try {
      const response = await api.post('/api/enrollments/register', {
        course: subjectId,
        academicYear: '2025-2026', 
        semester: selectedSemester,
        yearOfStudy: selectedYear
      });
      
      if (response.data.success) {
        toast.success('Course registration successful!');
        setEnrolledSubjectIds(prev => new Set([...prev, subjectId]));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegisteringId(null);
    }
  };

  const filtered = availableSubjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight font-outfit uppercase tracking-widest">Course Registration</h1>
          <p className="text-slate-500 mt-2 font-medium italic">{selectedYear} - Semester {selectedSemester} Academic Enrollment Portal</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
            <div className="flex bg-white p-1.5 rounded-2xl shadow-xl border border-slate-100">
               {years.map(y => (
                  <button 
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                      selectedYear === y ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {y.split(' ')[0]}
                  </button>
               ))}
            </div>

            <div className="flex bg-white p-1.5 rounded-2xl shadow-xl border border-slate-100">
               {semesters.map(s => (
                  <button 
                    key={s}
                    onClick={() => setSelectedSemester(s)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                      selectedSemester === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Sem {s}
                  </button>
               ))}
            </div>

            <div className="flex bg-white p-2 rounded-2xl shadow-xl border border-slate-100 relative min-w-[240px]">
               <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
               <input 
                 type="text"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Search code..."
                 className="w-full bg-slate-50 border-0 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-slate-700 placeholder-slate-400 focus:ring-0"
               />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((subject) => (
          <div key={subject._id} className={`bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 transition-all duration-500 group relative ${
            enrolledSubjectIds.has(subject._id) ? 'grayscale-[0.5] opacity-80 scale-95 shadow-lg' : 'hover:scale-[1.03] hover:shadow-indigo-100'
          }`}>
             
            <div className="p-10 relative z-10 flex flex-col h-full">
               <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-600 shadow-sm transition-transform duration-500 group-hover:rotate-12 group-hover:bg-indigo-600 group-hover:text-white">
                    <FiBookOpen className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Credits</p>
                    <p className="text-xl font-black text-slate-800">{subject.credits}</p>
                  </div>
               </div>

               <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mb-2">{subject.code}</p>
               <h3 className="text-2xl font-black text-slate-800 leading-tight mb-4 group-hover:text-indigo-600 transition-colors">{subject.name}</h3>
               
               <div className="flex items-center gap-2 mb-8 bg-slate-50 py-2 px-4 rounded-full self-start">
                  <FiInfo className="text-slate-400 h-3 w-3" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Core Curriculum</p>
               </div>

               <div className="mt-auto pt-8 border-t border-slate-100">
                  {enrolledSubjectIds.has(subject._id) ? (
                    <div className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-[2rem] font-black text-xs uppercase tracking-widest">
                       <FiCheckCircle className="h-5 w-5" /> Enrolled Successfully
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleRegister(subject._id)}
                      disabled={registeringId === subject._id}
                      className="w-full group/btn bg-slate-900 text-white rounded-[2rem] py-4 font-black text-xs uppercase tracking-widest transition-all duration-300 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-2xl shadow-indigo-100"
                    >
                      {registeringId === subject._id ? 'Synchronizing...' : 'Enroll Now'}
                      <FiPlus className="group-hover/btn:rotate-90 transition-transform h-5 w-5" />
                    </button>
                  )}
               </div>
            </div>

            {enrolledSubjectIds.has(subject._id) && (
              <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-sm pointer-events-none z-0"></div>
            )}
          </div>
        ))}
        
        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[4rem] border border-slate-100 shadow-xl border-dashed">
             <FiAlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-6" />
             <h3 className="text-3xl font-black text-slate-700 mb-2">No new courses available.</h3>
             <p className="text-slate-400 font-bold italic">Check back after your department releases next semester's updates.</p>
          </div>
        )}
      </div>

      <div className="mt-16 p-10 bg-gradient-to-r from-indigo-100 to-fuchsia-100 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex gap-6 items-center">
           <div className="h-20 w-20 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center text-indigo-600">
              <FiCheckCircle className="h-8 w-8" />
           </div>
           <div>
              <p className="text-xl font-black text-slate-800">Registration Requirement</p>
              <p className="text-slate-600 font-medium">Please ensure you meet all pre-requisites for core subjects.</p>
           </div>
        </div>
        <button className="bg-white text-indigo-600 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
          Contact Registrar Office
        </button>
      </div>
    </div>
  );
};

export default StudentCourseRegistration;

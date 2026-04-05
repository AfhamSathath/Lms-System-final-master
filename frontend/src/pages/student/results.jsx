import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiAward, FiAlertCircle, FiChevronDown, FiChevronUp, FiFilter, FiCheckCircle, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StudentResults = () => {
  const { user } = useAuth();
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedSemesters, setExpandedSemesters] = useState({});
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [error, setError] = useState(null);

  // Grade point mapping
  const calculateGradeFromMarks = (marks) => {
    const numMarks = parseFloat(marks) || 0;
    if (numMarks >= 85) return { grade: 'A+', gradePoint: 4.0, status: 'pass' };
    if (numMarks >= 80) return { grade: 'A',  gradePoint: 4.0, status: 'pass' };
    if (numMarks >= 75) return { grade: 'A-', gradePoint: 3.7, status: 'pass' };
    if (numMarks >= 70) return { grade: 'B+', gradePoint: 3.3, status: 'pass' };
    if (numMarks >= 65) return { grade: 'B',  gradePoint: 3.0, status: 'pass' };
    if (numMarks >= 60) return { grade: 'B-', gradePoint: 2.7, status: 'pass' };
    if (numMarks >= 55) return { grade: 'C+', gradePoint: 2.3, status: 'pass' };
    if (numMarks >= 50) return { grade: 'C',  gradePoint: 2.0, status: 'pass' };
    if (numMarks >= 45) return { grade: 'C-', gradePoint: 1.7, status: 'pass' };
    if (numMarks >= 40) return { grade: 'D+', gradePoint: 1.3, status: 'pass' };
    if (numMarks >= 35) return { grade: 'D',  gradePoint: 1.0, status: 'pass' };
    if (numMarks >= 30) return { grade: 'E',  gradePoint: 0.5, status: 'fail' };
    return { grade: 'F', gradePoint: 0.0, status: 'fail' };
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A+': 'bg-emerald-100 text-emerald-700',
      'A': 'bg-emerald-100 text-emerald-700',
      'A-': 'bg-emerald-100 text-emerald-700',
      'B+': 'bg-blue-100 text-blue-700',
      'B': 'bg-blue-100 text-blue-700',
      'B-': 'bg-blue-100 text-blue-700',
      'C+': 'bg-amber-100 text-amber-700',
      'C': 'bg-amber-100 text-amber-700',
      'C-': 'bg-orange-100 text-orange-700',
      'D+': 'bg-orange-100 text-orange-700',
      'D': 'bg-rose-100 text-rose-700',
      'F': 'bg-rose-100 text-rose-700',
    };
    return colors[grade] || 'bg-slate-100 text-slate-700';
  };

  useEffect(() => {
    if (user) fetchResults();
  }, [user]);

  const fetchResults = async () => {
    const studentId = user?.id || user?._id;
    if (!studentId) {
      setError('Unable to determine student identity');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/api/results/student/${studentId}`);
      let normalized = {};
      
      if (response?.data?.results) {
        if (Array.isArray(response.data.results)) {
          response.data.results.forEach(semObj => {
            if (semObj.year && semObj.semester != null) {
              const key = `${semObj.year}-S${semObj.semester}`;
              normalized[key] = semObj;
            }
          });
        } else {
          normalized = response.data.results;
        }
      }

      setResults(normalized);
      setSelectedSemesters(Object.keys(normalized));
      
      const expandAll = {};
      Object.keys(normalized).forEach(key => expandAll[key] = true);
      setExpandedSemesters(expandAll);
    } catch (error) {
      setError('Failed to securely fetch academic records');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGPAForSet = (semesterKeys) => {
    let totalCredits = 0;
    let totalGradePoints = 0;

    semesterKeys.forEach(key => {
      results[key]?.subjects?.forEach(item => {
        const credits = item.subject?.credits || 0;
        const gp = (item.gradePoints !== undefined && item.gradePoints !== null) 
          ? item.gradePoints 
          : (item.gradePoint !== undefined && item.gradePoint !== null)
            ? item.gradePoint
            : calculateGradeFromMarks(item.marks).gradePoint;
        totalCredits += credits;
        totalGradePoints += credits * gp;
      });
    });

    return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';
  };

  const getSemesterGPA = (key) => calculateGPAForSet([key]);
  const getCGPA = () => calculateGPAForSet(Object.keys(results));
  const getCustomGPA = () => calculateGPAForSet(selectedSemesters);

  const toggleSelect = (key) => {
    setSelectedSemesters(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getPoorGrades = () => {
    const list = [];
    Object.keys(results).forEach(key => {
      results[key]?.subjects?.forEach(item => {
        const grade = item.grade || calculateGradeFromMarks(item.marks).grade;
        if (['C-', 'D+', 'D', 'F'].includes(grade)) {
          list.push({ ...item, semester: key, grade });
        }
      });
    });
    return list;
  };

  if (loading) return <Loader fullScreen />;

  const poorGrades = getPoorGrades();
  const semesterKeys = Object.keys(results).sort((a, b) => b.localeCompare(a));

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight font-outfit uppercase">Academic Portfolio</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Verified results across all academic years.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-10 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
              <FiAward className="h-48 w-48 -mr-12 -mt-12" />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">Institutional Ranking</p>
              <h2 className="text-6xl font-black mb-10 tracking-tighter">CGPA {getCGPA()}</h2>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${(parseFloat(getCGPA()) / 4) * 100}%` }}
                ></div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-xl p-10 border border-slate-100 flex flex-col justify-center">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <FiFilter className="text-indigo-600" />
                 GPA Analytics Filter
              </h3>
              <div className="text-right">
                 <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Sectional GPA</p>
                 <span className="text-4xl font-black text-indigo-600 font-mono tracking-tighter">{getCustomGPA()}</span>
              </div>
           </div>
           
           <div className="flex flex-wrap gap-2 mb-6">
             {semesterKeys.map(key => (
               <button 
                 key={key}
                 onClick={() => toggleSelect(key)}
                 className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                   selectedSemesters.includes(key) 
                   ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' 
                   : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                 }`}
               >
                 {key}
               </button>
             ))}
           </div>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic flex items-center gap-2 bg-slate-50 p-4 rounded-2xl self-start">
              <FiInfo className="text-indigo-400" /> Multi-select semesters to calculate custom academic performance.
           </p>
        </div>
      </div>

      {poorGrades.length > 0 && (
        <div className="mb-10 p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 flex flex-col md:flex-row items-center gap-6">
           <div className="h-16 w-16 bg-white rounded-[1.5rem] flex items-center justify-center text-rose-500 shadow-xl shadow-rose-100 flex-shrink-0 animate-pulse">
              <FiAlertCircle className="h-8 w-8" />
           </div>
           <div className="flex-1">
              <h4 className="text-lg font-black text-rose-800 uppercase tracking-widest">Academic Warning</h4>
              <p className="text-sm text-rose-600 font-medium italic">You have {poorGrades.length} subject(s) with performance below standard. Considered for repeat? </p>
           </div>
           <div className="flex flex-wrap gap-2">
              {poorGrades.slice(0, 3).map((p, i) => (
                <span key={i} className="px-3 py-1 bg-white border border-rose-100 rounded-full text-[10px] font-bold text-rose-500 uppercase">{p.subject?.code} ({p.grade})</span>
              ))}
           </div>
        </div>
      )}

      <div className="space-y-8">
        {semesterKeys.map(key => (
          <div key={key} className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 group">
             <div 
               className="px-12 py-10 cursor-pointer hover:bg-slate-50 transition-all flex flex-col md:flex-row justify-between md:items-center gap-6"
               onClick={() => setExpandedSemesters({...expandedSemesters, [key]: !expandedSemesters[key]})}
             >
                <div className="flex items-center gap-6">
                   <div className="h-14 w-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                      <FiAward className="h-6 w-6" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-widest leading-none mb-2">{key.replace('-S', ' Semester ')}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{results[key].subjects?.length} Core Subjects Registered</p>
                   </div>
                </div>

                <div className="flex items-center gap-10">
                   <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Semester GPA</p>
                      <p className="text-3xl font-black text-indigo-600 font-mono tracking-tighter leading-none">{getSemesterGPA(key)}</p>
                   </div>
                   <div className={`p-4 rounded-2xl bg-slate-50 text-slate-300 transition-transform duration-500 ${expandedSemesters[key] ? 'rotate-180' : ''}`}>
                      <FiChevronDown className="h-6 w-6" />
                   </div>
                </div>
             </div>

             {expandedSemesters[key] && (
               <div className="px-12 pb-12 overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-slate-100">
                           <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descriptor</th>
                           <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight</th>
                           <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Marks</th>
                           <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Grade</th>
                           <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">GP</th>
                           <th className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Registry Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {results[key].subjects?.map((item, i) => {
                          const info = calculateGradeFromMarks(item.marks);
                          const grade = item.grade || info.grade;
                          const gp = (item.gradePoints !== undefined && item.gradePoints !== null) 
                            ? item.gradePoints 
                            : (item.gradePoint !== undefined && item.gradePoint !== null)
                              ? item.gradePoint
                              : info.gradePoint;
                          const status = item.status || info.status;

                          return (
                            <tr key={i} className="group-hover:bg-slate-50/50 transition-colors">
                               <td className="py-6">
                                  <p className="font-extrabold text-slate-700 text-md">{item.subject?.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{item.subject?.code}</p>
                               </td>
                               <td className="py-6 text-xs font-bold text-slate-500 uppercase">{item.subject?.credits} Credits</td>
                               <td className="py-6 text-center font-black text-slate-700">{item.marks}%</td>
                               <td className="py-6 text-center">
                                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getGradeColor(grade)}`}>
                                    {grade}
                                  </span>
                               </td>
                               <td className="py-6 text-center font-mono font-black text-slate-400">{gp.toFixed(1)}</td>
                               <td className="py-6 text-right">
                                  <div className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${status === 'pass' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                     <FiCheckCircle /> {status}
                                  </div>
                               </td>
                            </tr>
                          );
                        })}
                     </tbody>
                  </table>
               </div>
             )}
          </div>
        ))}

        {semesterKeys.length === 0 && (
          <div className="py-32 text-center bg-white rounded-[4rem] border border-slate-100 shadow-xl">
             <FiAward className="h-16 w-16 text-slate-200 mx-auto mb-6" />
             <h3 className="text-2xl font-black text-slate-700">No Academic Records Published.</h3>
             <p className="text-slate-400 font-medium italic">Contact the examination department for official transcript sync.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResults;
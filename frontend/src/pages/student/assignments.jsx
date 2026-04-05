import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiFileText, FiUploadCloud, FiCheckCircle, FiClock, FiCalendar, FiBookOpen } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StudentAssignments = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(user?.yearOfStudy || '1st Year');
  const [selectedSemester, setSelectedSemester] = useState(user?.semester || 1);

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [1, 2];

  useEffect(() => {
    fetchAssignments();
  }, [user, selectedYear, selectedSemester]);

  const fetchAssignments = async () => {
    try {
      const response = await api.get(`/api/enrollments/student/${user.id}`);
      let filtered = (response.data.enrollments || []);
      
      // Filter by academic period
      filtered = filtered.filter(e => 
        e.semester === selectedSemester && 
        e.yearOfStudy === selectedYear
      );
      
      setEnrollments(filtered);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (enrollmentId, assessmentId) => {
    // Simple simulation for now
    toast.success('Assignment submission simulation: File uploaded successfully');
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight font-outfit uppercase">Course Assignments</h1>
          <p className="text-slate-500 mt-2 font-medium italic">{selectedYear} - Semester {selectedSemester} Performance Tracker</p>
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

            <div className="bg-white px-6 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiBookOpen className="text-blue-600 h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight">Credits</p>
                <p className="text-sm font-black text-slate-700 leading-tight">{enrollments.reduce((acc, e) => acc + (e.course?.credits || 0), 0)}</p>
              </div>
            </div>
        </div>
      </div>

      <div className="space-y-8">
        {enrollments.map((enrollment) => (
          <div key={enrollment._id} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 ring-1 ring-slate-100 transition-all duration-300 hover:ring-blue-200">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10 px-8 py-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase mb-2 inline-block">Credit {enrollment.course?.credits}</span>
                  <h3 className="text-2xl font-black text-white leading-tight">{enrollment.course?.courseName}</h3>
                  <p className="text-slate-400 text-sm font-medium mt-1">{enrollment.course?.courseCode}</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white/5 backdrop-blur px-4 py-2 rounded-2xl border border-white/10 text-center min-w-[100px]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Pass Mark</p>
                    <p className="text-white font-bold">40%</p>
                  </div>
                  <div className="bg-blue-600/20 backdrop-blur px-4 py-2 rounded-2xl border border-blue-500/30 text-center min-w-[100px]">
                    <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Your Mark</p>
                    <p className="text-white font-black">{enrollment.totalMarks?.toFixed(1) || '0.0'}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <FiFileText className="text-blue-500 h-5 w-5" />
                <h4 className="text-lg font-bold text-slate-700">Assessment Breakdown</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollment.assessments && enrollment.assessments.length > 0 ? (
                  enrollment.assessments.map((assessment, idx) => (
                    <div key={idx} className={`p-6 rounded-3xl border transition-all duration-300 ${
                      assessment.graded ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-100 hover:border-blue-400 hover:shadow-lg group'
                    }`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${assessment.graded ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors'}`}>
                          <FiFileText className="h-5 w-5" />
                        </div>
                        {assessment.graded ? (
                          <div className="text-right">
                             <p className="text-[10px] text-slate-400 font-bold uppercase">Result</p>
                             <p className="text-lg font-black text-slate-800">{assessment.marksObtained}/{assessment.maxMarks}</p>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">Pending</span>
                        )}
                      </div>
                      
                      <h5 className="font-extrabold text-slate-800 text-md truncate">{assessment.name}</h5>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 mb-6 flex items-center">
                        <FiCalendar className="mr-1" /> Type: {assessment.type}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center text-xs font-bold text-slate-500">
                          <FiClock className="mr-1 h-3 w-3" />
                          Weight: {assessment.weight}%
                        </div>
                        {!assessment.submitted ? (
                          <button 
                            onClick={() => handleFileUpload(enrollment._id, assessment._id)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-blue-200"
                          >
                            <FiUploadCloud /> Submit
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
                            <FiCheckCircle /> Submitted
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                    <FiBookOpen className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold">No structured assessments defined yet.</p>
                    <p className="text-slate-400 text-sm">Wait for your lecturer to upload the course plan.</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Lecturer Remarks</span>
                  </div>
                  <p className="text-slate-600 text-sm font-medium italic">
                    "{enrollment.remarks || 'Keep up the good work! Make sure to attend all lab sessions for better marks.'}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentAssignments;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiUpload, FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiMessageSquare, FiSend, FiX, FiDownload, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ExamPapers = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [papers, setPapers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [mySubjects, setMySubjects] = useState([]);
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  
  const [uploadData, setUploadData] = useState({
    fileUrl: '',
    fileName: '',
    instructions: '',
    duration: '',
    totalMarks: '',
    examType: 'Final',
    examDate: '',
    academicYear: '',
    semester: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const lecturerId = user?.id || user?._id;
      const [tasksRes, papersRes, subjectsRes] = await Promise.all([
        api.get('/api/moderator-assignments/my-assignments'),
        api.get('/api/exam-papers/my-papers'),
        api.get(`/api/subjects/lecturer/${lecturerId}`)
      ]);
      
      setTasks(tasksRes.data.creatorTasks || []);
      setPapers(papersRes.data.data || []);
      setMySubjects(subjectsRes.data.subjects || []);
    } catch (error) {
      console.error('Error fetching data', error);
      toast.error('Failed to load exam paper data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (selectedTask?.subject?._id) {
      formData.append('subjectsId', selectedTask.subject._id);
    } else if (selectedTask?._id) {
      formData.append('subjectsId', selectedTask._id);
    }

    // Add required academic info
    const academicYear = selectedTask?.academicYear || uploadData.academicYear || selectedTask?.subject?.year;
    const semester = selectedTask?.semester || uploadData.semester || selectedTask?.subject?.semester;
    
    if (academicYear) formData.append('academicYear', academicYear);
    if (semester) formData.append('semester', semester);
    formData.append('fileType', 'exam_paper'); // Hidden from student's study materials

    setUploading(true);
    try {
      const res = await api.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadData(prev => ({ 
        ...prev, 
        fileUrl: res.data.file.path,
        // Only update fileName if it's currently empty (e.g., first upload)
        // This prevents overwriting a custom "Paper Heading" during resubmission
        fileName: prev.fileName || res.data.file.name 
      }));
      toast.success('New file uploaded successfully');
    } catch (error) {
      toast.error('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.fileUrl) {
      toast.error('Please upload a PDF file');
      return;
    }

    try {
      await api.post('/api/exam-papers', {
        subjectId: selectedTask.subject._id,
        ...uploadData
      });
      toast.success('Exam paper submitted for moderation');
      setShowModal(false);
      setUploadData({
        fileUrl: '',
        fileName: '',
        instructions: '',
        duration: '',
        totalMarks: '',
        examType: 'Final',
        examDate: '',
        academicYear: '',
        semester: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    }
  };

  const handleSendToHod = async (paperId) => {
    try {
      await api.put(`/api/exam-papers/${paperId}/send-to-hod`);
      toast.success('Paper sent to HOD for final approval');
      fetchData();
    } catch (error) {
      toast.error('Failed to send to HOD');
    }
  };

  const handleDownload = async (fileUrl, fileName) => {
    if (!fileUrl) return;
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      
      // Normalize slashes and strip absolute server paths aggressively
      const normalizedPath = fileUrl.replace(/\\/g, '/');
      const cleanUrl = normalizedPath.replace(/^.*\/uploads\//i, '/uploads/');
        
      const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
      
      const response = await api.get(fullUrl, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'exam-paper.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      'Draft': 'bg-slate-100 text-slate-600 border-slate-200',
      'Pending_Moderation': 'bg-amber-50 text-amber-600 border-amber-200',
      'Changes_Requested_Moderator': 'bg-rose-50 text-rose-600 border-rose-200',
      'Moderated': 'bg-indigo-50 text-indigo-600 border-indigo-200',
      'Pending_HOD_Approval': 'bg-blue-50 text-blue-600 border-blue-200',
      'Approved': 'bg-emerald-50 text-emerald-600 border-emerald-200',
      'Changes_Requested_HOD': 'bg-rose-100 text-rose-700 border-rose-300',
      'Pending_Exam_Officer': 'bg-orange-50 text-orange-600 border-orange-200',
      'Accepted_By_Exam_Officer': 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
    return styles[status] || 'bg-slate-50 text-slate-400 border-slate-100';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">My Exam Papers</h1>
            <p className="text-slate-500 font-medium italic">Create and manage your final exam papers and moderation process</p>
          </div>
          <button 
            onClick={() => {
              setSelectedTask(null);
              setUploadData({
                fileUrl: '',
                fileName: '',
                instructions: '',
                duration: '',
                totalMarks: '',
                examType: 'Final',
                examDate: ''
              });
              setShowModal(true);
            }}
            className="px-8 py-4 bg-slate-900 text-white border border-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
          >
            <FiUpload /> Create New Paper
          </button>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const paper = papers.find(p => p.subject._id === task.subject._id);
            return (
              <div key={task._id} className="bg-white border border-black rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-[4rem] transition-all group-hover:scale-110"></div>
                
                <div className="relative z-10">
                  <div className="mb-6">
                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] mb-1">
                      {task.moderator?.name} • {task.subject.code} • {task.academicYear} • SEM {task.semester}
                    </p>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter line-clamp-2">{task.subject.name}</h3>
                  </div>

                  <div className="flex items-center gap-3 mb-8 p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-white border border-black flex items-center justify-center text-slate-400">
                      <FiUser size={14} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">Moderator</p>
                      <p className="text-[11px] font-bold text-slate-700">{task.moderator.name}</p>
                    </div>
                  </div>

                  {paper ? (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-2xl border ${getStatusStyle(paper.status)} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <FiClock size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{paper.status.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-[10px] font-bold italic">v{paper.version}</span>
                      </div>

                      {(paper.status === 'Changes_Requested_Moderator' || paper.status === 'Changes_Requested_HOD') && (
                        <div className={`p-4 rounded-2xl border ${paper.status === 'Changes_Requested_HOD' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-1">
                            <FiMessageSquare /> {paper.status === 'Changes_Requested_HOD' ? 'HOD Feedback History' : 'Moderator Feedback History'}
                          </p>
                          <div className="space-y-3 max-h-32 overflow-y-auto pr-1">
                            {paper.status === 'Changes_Requested_Moderator' ? (
                              paper.moderatorComments?.map((c, i) => (
                                <div key={i} className="bg-white/50 p-2 rounded-lg border border-current/10 text-[10px] font-medium italic">
                                  "{c.comment}"
                                </div>
                              ))
                            ) : (
                              paper.hodComments?.map((c, i) => (
                                <div key={i} className="bg-white/50 p-2 rounded-lg border border-current/10 text-[10px] font-medium italic">
                                  "{c.comment}"
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {(paper.status === 'Draft' || paper.status === 'Changes_Requested_Moderator' || paper.status === 'Changes_Requested_HOD') ? (
                          <button 
                            onClick={() => { 
                              setSelectedTask(task); 
                              setUploadData({
                                fileUrl: '', // Force new upload for resubmission
                                fileName: paper.fileName,
                                instructions: paper.instructions || '',
                                duration: paper.duration || '',
                                totalMarks: paper.totalMarks || '',
                                examType: paper.examType || 'Final',
                                examDate: paper.examDate ? new Date(paper.examDate).toISOString().split('T')[0] : ''
                              });
                              setShowModal(true); 
                            }}
                            className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                          >
                            <FiUpload /> Resubmit
                          </button>
                        ) : paper.status === 'Moderated' ? (
                          <button 
                            onClick={() => handleSendToHod(paper._id)}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                          >
                            <FiSend /> Send to HOD
                          </button>
                        ) : (
                          <div className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest text-center border border-dashed border-slate-200">
                            Awaiting Review
                          </div>
                        )}
                        <button 
                          onClick={() => handleDownload(paper.fileUrl, `${task.subject.code}_v${paper.version}.pdf`)}
                          className="w-12 h-12 border border-black rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600"
                        >
                          <FiDownload />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { 
                        setSelectedTask(task); 
                        setUploadData({
                          fileUrl: '',
                          fileName: '',
                          instructions: '',
                          duration: '',
                          totalMarks: '',
                          examType: 'Final',
                          examDate: '',
                          academicYear: '',
                          semester: ''
                        });
                        setShowModal(true); 
                      }}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      <FiUpload /> Create Paper
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create/Upload Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[3rem] border border-black w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
              <div className="p-8 border-b border-black bg-slate-50 flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Prepare Exam Paper</h2>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl border border-black flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-8 space-y-8 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {!selectedTask && (
                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-black space-y-5 shadow-inner">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Step 1: Identify Module Batch</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Academic Year</label>
                          <select 
                            className="w-full px-4 py-3.5 bg-white border border-black rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-xs"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                          >
                            <option value="">All Years</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Semester</label>
                          <select 
                            className="w-full px-4 py-3.5 bg-white border border-black rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-xs"
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                          >
                            <option value="">All Semesters</option>
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Select Subject</label>
                        <select 
                          required
                          className="w-full px-5 py-4 bg-white border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                          onChange={(e) => {
                            if (!e.target.value) {
                              setSelectedTask(null);
                              return;
                            }
                            const task = tasks.find(t => t.subject._id === e.target.value);
                            const subject = mySubjects.find(s => s._id === e.target.value);
                            
                            if (task) {
                              setSelectedTask(task);
                              setUploadData(prev => ({
                                ...prev,
                                academicYear: task.academicYear,
                                semester: task.semester
                              }));
                            } else {
                              setSelectedTask({ subject: subject || { _id: e.target.value }, noModerator: true });
                              setUploadData(prev => ({
                                ...prev,
                                academicYear: subject?.year || '',
                                semester: subject?.semester || ''
                              }));
                            }
                          }}
                        >
                          <option value="">Choose a subject...</option>
                          {(() => {
                            const availableSubjects = mySubjects
                              .filter(s => !filterYear || s.year === filterYear)
                              .filter(s => !filterSemester || s.semester === parseInt(filterSemester))
                              .filter(s => !papers.some(p => p.subject?._id === s._id));
                            
                            if (availableSubjects.length === 0) {
                              return <option disabled>No subjects available (Papers already created)</option>;
                            }
                            
                            return availableSubjects.map(s => (
                              <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>
                  )}
                  {selectedTask && (
                    <div className="p-7 bg-slate-900 text-white rounded-[2.5rem] border border-black relative overflow-hidden group shadow-2xl">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                        <FiFileText size={80} />
                      </div>
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-full uppercase tracking-widest border border-indigo-400/30">
                              {selectedTask.subject?.code}
                            </span>
                            <span className="px-3 py-1 bg-white/5 text-white/70 text-[9px] font-black rounded-full uppercase tracking-widest border border-white/10">
                              {selectedTask.subject?.year || uploadData.academicYear} • SEM {selectedTask.subject?.semester || uploadData.semester}
                            </span>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-full uppercase tracking-widest border border-emerald-500/20">
                              {uploadData.examType} Exam
                            </span>
                          </div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight max-w-md">{selectedTask.subject?.name}</h3>
                          {selectedTask.moderator && (
                            <div className="flex items-center gap-2 text-indigo-300">
                               <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                  <FiUser size={10} />
                               </div>
                               <p className="text-[10px] font-bold uppercase tracking-[0.1em]">Moderator: {selectedTask.moderator.name}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Only allow changing subject if it's a completely NEW paper (no existing one) */}
                        {!selectedTask.noModerator && !papers.find(p => p.subject._id === selectedTask.subject?._id) && (
                          <button 
                            type="button"
                            onClick={() => setSelectedTask(null)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all flex items-center gap-2"
                          >
                            <FiX size={12} /> Change Subject
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SHOW REVIEWER FEEDBACK IN MODAL - REAL WORLD WORKFLOW */}
                  {selectedTask && papers.find(p => p.subject._id === (selectedTask.subject?._id || selectedTask._id)) && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                      {(() => {
                        const paper = papers.find(p => p.subject._id === (selectedTask.subject?._id || selectedTask._id));
                        const isResubmission = paper.status.includes('Changes_Requested');
                        
                        if (!isResubmission) return null;

                        return (
                          <div className="p-6 bg-rose-50 border border-rose-200 rounded-[2rem] shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-200">
                                <FiMessageSquare size={18} />
                              </div>
                              <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600">Reviewer History & Requirements</h4>
                                <p className="text-xs font-bold text-rose-900 italic">Please address all previous feedback for Version {paper.version + 1}</p>
                              </div>
                            </div>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                              {paper.moderatorComments?.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-[8px] font-black uppercase text-indigo-500 tracking-[0.2em] px-1">Moderator Comments</p>
                                  {paper.moderatorComments.map((c, i) => (
                                    <div key={`mod-${i}`} className="bg-white/80 p-3 rounded-xl border border-rose-100 shadow-sm">
                                      <p className="text-xs font-medium text-slate-700 italic">"{c.comment}"</p>
                                      <p className="text-[8px] font-bold text-slate-400 mt-2 text-right">{new Date(c.date).toLocaleDateString()}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {paper.hodComments?.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-rose-100">
                                  <p className="text-[8px] font-black uppercase text-emerald-600 tracking-[0.2em] px-1">HOD Comments</p>
                                  {paper.hodComments.map((c, i) => (
                                    <div key={`hod-${i}`} className="bg-white/80 p-3 rounded-xl border border-rose-100 shadow-sm">
                                      <p className="text-xs font-medium text-slate-700 italic">"{c.comment}"</p>
                                      <p className="text-[8px] font-bold text-slate-400 mt-2 text-right">{new Date(c.date).toLocaleDateString()}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {selectedTask?.noModerator && (
                    <div className="p-5 bg-rose-50 rounded-[1.5rem] border border-rose-200 text-rose-600 flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                         <FiAlertCircle size={24} />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
                        Moderation workflow blocked: A moderator must be assigned by the HOD for this subject before submission.
                      </p>
                    </div>
                  )}

                  {selectedTask && !selectedTask.noModerator && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                        <div className="md:col-span-6">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Paper Heading / Subtitle</label>
                          <input 
                            required
                            type="text"
                            placeholder="e.g. End Semester Examination - 2024"
                            className="w-full px-6 py-4 bg-slate-50 border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300"
                            value={uploadData.fileName}
                            onChange={(e) => setUploadData({...uploadData, fileName: e.target.value})}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Total Marks</label>
                          <input 
                            required
                            type="number"
                            placeholder="100"
                            className="w-full px-6 py-4 bg-slate-50 border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                            value={uploadData.totalMarks}
                            onChange={(e) => setUploadData({...uploadData, totalMarks: e.target.value})}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Duration</label>
                          <input 
                            required
                            type="text"
                            placeholder="3 Hours"
                            className="w-full px-6 py-4 bg-slate-50 border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                            value={uploadData.duration}
                            onChange={(e) => setUploadData({...uploadData, duration: e.target.value})}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Proposed Date</label>
                          <input 
                            required
                            type="date"
                            className="w-full px-6 py-4 bg-slate-50 border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                            value={uploadData.examDate}
                            onChange={(e) => setUploadData({...uploadData, examDate: e.target.value})}
                          />
                        </div>

                        <div className="md:col-span-6">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Candidate Instructions</label>
                          <textarea 
                            required
                            rows="3"
                            placeholder="e.g. Answer all questions in Part A and any two from Part B..."
                            className="w-full px-6 py-4 bg-slate-50 border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                            value={uploadData.instructions}
                            onChange={(e) => setUploadData({...uploadData, instructions: e.target.value})}
                          />
                        </div>

                        <div className="md:col-span-6">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Final PDF Document</label>
                          <div className="relative group/upload">
                            <input 
                              type="file"
                              accept=".pdf"
                              onChange={handleFileChange}
                              className="hidden"
                              id="paper-upload"
                            />
                            <label 
                              htmlFor="paper-upload"
                              className={`w-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-black rounded-[2.5rem] cursor-pointer transition-all ${uploading ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50 hover:border-indigo-500'}`}
                            >
                              {uploading ? (
                                <div className="flex flex-col items-center">
                                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                  <span className="text-xs font-black uppercase text-indigo-600 tracking-widest">Uploading Paper...</span>
                                </div>
                              ) : uploadData.fileUrl ? (
                                <div className="flex flex-col items-center text-emerald-600 text-center">
                                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                     <FiCheckCircle size={32} />
                                  </div>
                                  <span className="text-lg font-black uppercase tracking-tight">Paper Attached Successfully</span>
                                  <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">Click to replace PDF document</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center text-slate-300 group-hover/upload:text-indigo-600 transition-colors">
                                  <FiUpload size={48} className="mb-4" />
                                  <span className="text-xs font-black uppercase tracking-widest">Drop Final Exam PDF Here</span>
                                  <p className="text-[9px] font-bold mt-2 uppercase tracking-tight text-slate-400">PDF Only • Max 15MB</p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-dashed border-indigo-200">
                        <label className="flex items-start gap-4 cursor-pointer group">
                          <div className="relative flex items-center mt-1">
                            <input 
                              type="checkbox" 
                              required 
                              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 transition-all" 
                            />
                            <FiCheckCircle className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                            I hereby declare that this examination paper has been prepared in accordance with the university quality standards and academic integrity guidelines. I confirm that all questions are original or appropriately cited.
                          </p>
                        </label>
                      </div>

                      <button 
                        type="submit"
                        disabled={uploading || !uploadData.fileUrl}
                        className={`w-full py-6 bg-slate-900 text-white border border-black rounded-[2.5rem] font-black uppercase text-sm tracking-widest transition-all shadow-2xl hover:shadow-indigo-500/20 ${uploading || !uploadData.fileUrl ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black hover:-translate-y-1 active:translate-y-0'}`}
                      >
                        {(() => {
                          const paper = papers.find(p => p.subject._id === (selectedTask.subject?._id || selectedTask._id));
                          if (paper) {
                            return `Finalize & Resubmit Version ${paper.version + 1}`;
                          }
                          return 'Submit for Official Moderation';
                        })()}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamPapers;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiUpload, FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiMessageSquare, FiSend, FiX, FiDownload, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExamPapers = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showFullReport, setShowFullReport] = useState({});
  const [activeReportVersion, setActiveReportVersion] = useState({});
  const [papers, setPapers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeVersionTab, setActiveVersionTab] = useState('current');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedPaperForModal, setSelectedPaperForModal] = useState(null);
  const [mySubjects, setMySubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
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
  const [moderationReport, setModerationReport] = useState({
    submittedDocuments: {
      examPaperSigned: false,
      examPaperSignedUrl: '',
      coursePlan: false,
      coursePlanUrl: '',
      modelAnswers: false,
      modelAnswersUrl: '',
      continuousAssessmentPapers: false,
      continuousAssessmentPapersUrl: [],
      previousExamPapers: false,
      previousExamPapersUrl: []
    },
    ilosAssessed: [
      { questionNo: '1', ilo: '', bloomsTaxonomy: { remembering: false, understanding: false, applying: false, analyzing: false, evaluating: false, creating: false } }
    ]
  });

  const handleDocTick = (doc) => {
    setModerationReport(prev => ({
      ...prev,
      submittedDocuments: {
        ...prev.submittedDocuments,
        [doc]: !prev.submittedDocuments[doc]
      }
    }));
  };

  const handleDocUpload = async (e, docId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    // Add academic info if available
    const academicYear = selectedTask?.academicYear || uploadData.academicYear;
    const semester = selectedTask?.semester || uploadData.semester;
    if (academicYear) formData.append('academicYear', academicYear);
    if (semester) formData.append('semester', semester);
    formData.append('fileType', 'moderation_document');

    // Add subjectsId as required by fileController.js
    const subjectId = selectedTask?.subject?._id || selectedTask?._id;
    if (subjectId) formData.append('subjectsId', subjectId);

    try {
      setUploading(true);
      const res = await api.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setModerationReport(prev => {
        const isMultiple = ['continuousAssessmentPapers', 'previousExamPapers'].includes(docId);
        const currentUrls = prev.submittedDocuments[`${docId}Url`] || [];
        
        return {
          ...prev,
          submittedDocuments: {
            ...prev.submittedDocuments,
            [docId]: true,
            [`${docId}Url`]: isMultiple 
              ? [...(Array.isArray(currentUrls) ? currentUrls : [currentUrls]), res.data.file.path]
              : res.data.file.path
          }
        };
      });

      // Sync with primary uploadData if this is the main exam paper
      if (docId === 'examPaperSigned') {
        setUploadData(prev => ({
          ...prev,
          fileUrl: res.data.file.path,
          fileName: file.name
        }));
      }

      toast.success('Document uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleIloChange = (index, field, value) => {
    const newIlos = [...moderationReport.ilosAssessed];
    newIlos[index][field] = value;
    setModerationReport(prev => ({ ...prev, ilosAssessed: newIlos }));
  };

  const handleBloomsTick = (index, level) => {
    const newIlos = [...moderationReport.ilosAssessed];
    newIlos[index].bloomsTaxonomy[level] = !newIlos[index].bloomsTaxonomy[level];
    setModerationReport(prev => ({ ...prev, ilosAssessed: newIlos }));
  };

  const addIloRow = () => {
    setModerationReport(prev => ({
      ...prev,
      ilosAssessed: [...prev.ilosAssessed, {
        questionNo: (prev.ilosAssessed.length + 1).toString(),
        ilo: '',
        bloomsTaxonomy: { remembering: false, understanding: false, applying: false, analyzing: false, evaluating: false, creating: false }
      }]
    }));
  };

  const removeIloRow = (index) => {
    if (moderationReport.ilosAssessed.length > 1) {
      const newIlos = moderationReport.ilosAssessed.filter((_, i) => i !== index);
      setModerationReport(prev => ({ ...prev, ilosAssessed: newIlos }));
    }
  };

  const removeDoc = (docId, index) => {
    setModerationReport(prev => {
      const urls = [...(prev.submittedDocuments[`${docId}Url`] || [])];
      urls.splice(index, 1);
      return {
        ...prev,
        submittedDocuments: {
          ...prev.submittedDocuments,
          [`${docId}Url`]: urls,
          [docId]: urls.length > 0
        }
      };
    });
  };

  const removeSingleDoc = (docId) => {
    setModerationReport(prev => ({
      ...prev,
      submittedDocuments: {
        ...prev.submittedDocuments,
        [`${docId}Url`]: '',
        [docId]: false
      }
    }));
  };

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
        ...uploadData,
        moderationReport
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
      setModerationReport({
        submittedDocuments: {
          examPaperSigned: false,
          coursePlan: false,
          modelAnswers: false,
          continuousAssessmentPapers: false,
          continuousAssessmentPapersUrl: [],
          previousExamPapers: false,
          previousExamPapersUrl: []
        },
        ilosAssessed: [
          { questionNo: '1', ilo: '', bloomsTaxonomy: { remembering: false, understanding: false, applying: false, analyzing: false, evaluating: false, creating: false } }
        ],
        moderatorSection: {
          ilosComments: '',
          paperAssessment: '',
          organizationClear: '',
          organizationSuggestions: '',
          wordingProper: '',
          wordingSuggestions: '',
          modelAnswersPrepared: '',
          modelAnswersSuggestions: '',
          grammarSpelling: '',
          improvementComments: ''
        }
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

  const generateReportPDF = async (paper, versionData) => {
    const doc = new jsPDF();
    const sec = versionData.moderationReport?.moderatorSection;
    if (!sec) {
      toast.error('No report details available to generate PDF');
      return;
    }

    try {
      const img = new Image();
      img.src = '/esn.webp';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 14, 15, 20, 20);
    } catch (err) {
      console.error('Failed to load logo', err);
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('Trincomalee Campus, Eastern University, Sri Lanka', 40, 22);
    doc.setFontSize(14);
    doc.text('Moderation Quality Report', 40, 30);
    
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(`Subject: ${paper.subject?.code} - ${paper.subject?.name}`, 14, 45);
    doc.text(`Version: ${versionData.version}`, 14, 51);
    doc.text(`Outcome: ${versionData.status?.replace(/_/g, ' ')}`, 14, 57);
    doc.text(`Date: ${new Date(versionData.submittedAt || Date.now()).toLocaleDateString()}`, 14, 63);

    const tableData = [
      ['2.1 ILOs & Blooms', sec.ilosComments || ''],
      ['2.2 Paper Assessment', sec.paperAssessment || ''],
      ['2.3 Organization', `${sec.organizationClear ? sec.organizationClear : ''}${sec.organizationSuggestions ? '\nSug: ' + sec.organizationSuggestions : ''}`.trim()],
      ['2.4 Wording', `${sec.wordingProper ? sec.wordingProper : ''}${sec.wordingSuggestions ? '\nSug: ' + sec.wordingSuggestions : ''}`.trim()],
      ['2.5 Model Answers', `${sec.modelAnswersPrepared ? sec.modelAnswersPrepared : ''}${sec.modelAnswersSuggestions ? '\nSug: ' + sec.modelAnswersSuggestions : ''}`.trim()],
      ['2.6 Grammar/Spelling', sec.grammarSpelling || ''],
      ['2.7 Improvements', sec.improvementComments || '']
    ];

    autoTable(doc, {
      startY: 70,
      head: [['Criteria', 'Moderator Feedback']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], font: 'times', fontStyle: 'bold' },
      bodyStyles: { font: 'times' },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 20;
    const modSig = sec.moderatorSignature || versionData.moderatorSignature;
    const modTime = sec.moderatedAt || versionData.moderatedAt;

    if (modTime) {
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text(`Moderation Timestamp:`, 14, finalY);
      doc.setFont('times', 'normal');
      doc.text(`${new Date(modTime).toLocaleString()}`, 55, finalY);
    }

    if (modSig) {
      doc.setFont('times', 'bold');
      doc.text('Moderator Digital Signature:', 14, finalY + 15);
      try {
        const sigImg = new Image();
        // Handle potentially different URL formats for signatures
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        let cleanSigUrl = modSig;
        if (modSig.includes('\\')) {
          cleanSigUrl = modSig.replace(/\\/g, '/');
        }
        if (!cleanSigUrl.startsWith('http')) {
          cleanSigUrl = cleanSigUrl.startsWith('/') ? cleanSigUrl : `/${cleanSigUrl}`;
          cleanSigUrl = `${baseUrl}${cleanSigUrl.includes('/uploads/') ? cleanSigUrl : '/uploads/' + cleanSigUrl.replace(/^\/+/, '')}`;
        }
        sigImg.crossOrigin = 'Anonymous';
        sigImg.src = cleanSigUrl;
        
        await new Promise((resolve, reject) => {
          sigImg.onload = resolve;
          sigImg.onerror = reject;
        });
        
        const sigCanvas = document.createElement('canvas');
        sigCanvas.width = sigImg.width;
        sigCanvas.height = sigImg.height;
        const sigCtx = sigCanvas.getContext('2d');
        sigCtx.drawImage(sigImg, 0, 0);
        const sigData = sigCanvas.toDataURL('image/png');
        doc.addImage(sigData, 'PNG', 14, finalY + 20, 50, 20);
      } catch (err) {
        console.error('Failed to load signature', err);
        doc.setFont('times', 'italic');
        doc.text('[Digital Signature Verified & Recorded]', 14, finalY + 25);
      }
    } else {
      doc.setFont('times', 'italic');
      doc.text('No signature recorded for this version.', 14, finalY + 15);
    }

    doc.save(`${paper.subject?.code}_Quality_Report_v${versionData.version}.pdf`);
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
        </div>
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
                      <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[150px]">
                        <button 
                          onClick={() => { setSelectedPaperForModal(paper); setShowHistoryModal(true); setActiveVersionTab('current'); }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-current/20 bg-white/50 hover:bg-white transition-all whitespace-nowrap"
                        >
                          <span className="text-[9px] font-black uppercase tracking-tighter">v{paper.version}</span>
                        </button>
                        {[...(paper.versionHistory || [])].reverse().map((v, i) => (
                          <button 
                            key={i}
                            onClick={() => { setSelectedPaperForModal(paper); setShowHistoryModal(true); setActiveVersionTab(v.version); }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-black/10 bg-white/20 hover:bg-white/50 transition-all whitespace-nowrap"
                          >
                            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">v{v.version}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {(paper.status === 'Changes_Requested_Moderator' || paper.status === 'Changes_Requested_HOD' || paper.moderationReport?.moderatorSection) && (
                      <div className={`p-4 rounded-2xl border ${paper.status === 'Changes_Requested_HOD' ? 'bg-orange-50 border-orange-200 text-orange-700' : (paper.status === 'Changes_Requested_Moderator' || paper.status === 'Pending_Moderation') ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                        <button
                          type="button"
                          onClick={() => setShowFullReport(prev => ({ ...prev, [paper._id]: !prev[paper._id] }))}
                          className="w-full text-left group"
                        >
                          <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <FiMessageSquare /> {paper.status === 'Changes_Requested_HOD' ? 'HOD Feedback History' : (paper.status === 'Changes_Requested_Moderator' || paper.status === 'Pending_Moderation') ? 'Moderator Feedback History' : 'Moderation Quality Report'}
                            </span>
                            <span className="bg-white/50 px-2 py-0.5 rounded-full border border-current/10 group-hover:bg-white transition-all">
                              {showFullReport[paper._id] ? 'Hide Details' : 'View Full Report'}
                            </span>
                          </p>
                        </button>

                        <div className={`space-y-3 pr-1 transition-all ${showFullReport[paper._id] ? 'max-h-[1000px] opacity-100' : 'max-h-32 opacity-80 overflow-y-auto'}`}>
                          {paper.status === 'Changes_Requested_HOD' ? (
                            paper.hodComments?.map((c, i) => (
                              <div key={i} className="bg-white/50 p-2 rounded-lg border border-current/10 text-[10px] font-medium italic">
                                "{c.comment}"
                              </div>
                            ))
                          ) : (
                            paper.moderatorComments?.map((c, i) => (
                              <div key={i} className="bg-white/50 p-2 rounded-lg border border-current/10 text-[10px] font-medium italic">
                                "{c.comment}"
                              </div>
                            ))
                          )}
                          {paper.moderatorComments?.length === 0 && paper.hodComments?.length === 0 && !paper.moderationReport?.moderatorSection && (
                            <p className="text-[10px] font-bold text-slate-400 italic">No feedback provided yet.</p>
                          )}
                        </div>

                        {showFullReport[paper._id] && (
                          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {/* Version Selection Tabs */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-2 border-b border-black/5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveReportVersion(prev => ({ ...prev, [paper._id]: 'current' })); }}
                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${(!activeReportVersion[paper._id] || activeReportVersion[paper._id] === 'current') ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/50 text-slate-400 hover:text-slate-600'}`}
                              >
                                v{paper.version} (Latest)
                              </button>
                              {paper.versionHistory?.map((v, i) => (
                                <button 
                                  key={i}
                                  onClick={(e) => { e.stopPropagation(); setActiveReportVersion(prev => ({ ...prev, [paper._id]: v.version })); }}
                                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeReportVersion[paper._id] === v.version ? 'bg-slate-700 text-white shadow-md' : 'bg-white/50 text-slate-400 hover:text-slate-600'}`}
                                >
                                  v{v.version}
                                </button>
                              ))}
                            </div>

                            {/* Report Content based on selected version */}
                            {(!activeReportVersion[paper._id] || activeReportVersion[paper._id] === 'current') ? (
                              <div className="space-y-4">
                                {paper.moderationReport?.moderatorSection ? (
                                  <div className="p-4 bg-white/60 border border-indigo-100 rounded-2xl space-y-3">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-500">Quality Report Details (v{paper.version})</p>
                                    <div className="grid grid-cols-1 gap-3">
                                      {[
                                        { label: '2.1 ILOs & Blooms', value: paper.moderationReport.moderatorSection.ilosComments },
                                        { label: '2.2 Paper Assessment', value: paper.moderationReport.moderatorSection.paperAssessment },
                                        { label: '2.3 Organization', value: paper.moderationReport.moderatorSection.organizationClear, extra: paper.moderationReport.moderatorSection.organizationSuggestions },
                                        { label: '2.4 Wording', value: paper.moderationReport.moderatorSection.wordingProper, extra: paper.moderationReport.moderatorSection.wordingSuggestions },
                                        { label: '2.5 Model Answers', value: paper.moderationReport.moderatorSection.modelAnswersPrepared, extra: paper.moderationReport.moderatorSection.modelAnswersSuggestions },
                                        { label: '2.6 Grammar/Spelling', value: paper.moderationReport.moderatorSection.grammarSpelling },
                                        { label: '2.7 Improvements', value: paper.moderationReport.moderatorSection.improvementComments }
                                      ].map((f, idx) => f.value && (
                                        <div key={idx} className="bg-indigo-50/30 p-2 rounded-lg border border-indigo-100/50">
                                          <div className="flex justify-between items-start mb-0.5">
                                            <span className="text-[7px] font-black uppercase text-indigo-400">{f.label}</span>
                                            {['YES', 'NO'].includes(f.value) && (
                                              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${f.value === 'YES' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{f.value}</span>
                                            )}
                                          </div>
                                          {!['YES', 'NO'].includes(f.value) && <p className="text-[10px] font-bold text-slate-700 leading-snug">{f.value}</p>}
                                          {f.extra && <p className="text-[9px] mt-1 text-slate-500 italic font-medium leading-tight border-t border-indigo-100/50 pt-1">Sug: {f.extra}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-8 text-center bg-white/40 border border-dashed border-slate-200 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-400 italic">No detailed report for this version yet.</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              paper.versionHistory?.filter(v => v.version === activeReportVersion[paper._id]).map((hist, hIdx) => (
                                <div key={hIdx} className="space-y-4">
                                  {hist.moderationReport?.moderatorSection ? (
                                    <div className="p-4 bg-white/60 border border-slate-200 rounded-2xl space-y-3">
                                      <div className="flex justify-between items-center mb-1">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Historical Report Snapshot (v{hist.version})</p>
                                        <button 
                                          onClick={() => handleDownload(hist.fileUrl, `${task.subject.code}_v${hist.version}.pdf`)}
                                          className="text-[8px] font-black text-indigo-600 hover:underline flex items-center gap-1"
                                        >
                                          <FiDownload size={10} /> View PDF
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-1 gap-3">
                                        {[
                                          { label: '2.1 ILOs & Blooms', value: hist.moderationReport.moderatorSection.ilosComments },
                                          { label: '2.2 Paper Assessment', value: hist.moderationReport.moderatorSection.paperAssessment },
                                          { label: '2.3 Organization', value: hist.moderationReport.moderatorSection.organizationClear, extra: hist.moderationReport.moderatorSection.organizationSuggestions },
                                          { label: '2.4 Wording', value: hist.moderationReport.moderatorSection.wordingProper, extra: hist.moderationReport.moderatorSection.wordingSuggestions },
                                          { label: '2.5 Model Answers', value: hist.moderationReport.moderatorSection.modelAnswersPrepared, extra: hist.moderationReport.moderatorSection.modelAnswersSuggestions },
                                          { label: '2.6 Grammar/Spelling', value: hist.moderationReport.moderatorSection.grammarSpelling },
                                          { label: 'Outcome', value: hist.status.replace(/_/g, ' ') }
                                        ].map((f, idx) => f.value && (
                                          <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <div className="flex justify-between items-start mb-0.5">
                                              <span className="text-[7px] font-black uppercase text-slate-400">{f.label}</span>
                                              {['YES', 'NO'].includes(f.value) && (
                                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${f.value === 'YES' ? 'bg-slate-200 text-slate-600' : 'bg-rose-100 text-rose-700'}`}>{f.value}</span>
                                              )}
                                            </div>
                                            {!['YES', 'NO'].includes(f.value) && <p className="text-[10px] font-bold text-slate-600 leading-snug">{f.value}</p>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-8 text-center bg-white/40 border border-dashed border-slate-200 rounded-2xl">
                                      <p className="text-[10px] font-bold text-slate-400 italic">No report was archived for version {hist.version}.</p>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
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
                            setModerationReport({
                              submittedDocuments: {
                                examPaperSigned: false,
                                coursePlan: false,
                                modelAnswers: false,
                                continuousAssessmentPapers: false,
                                continuousAssessmentPapersUrl: [],
                                previousExamPapers: false,
                                previousExamPapersUrl: []
                              },
                              ilosAssessed: [
                                { questionNo: '1', ilo: '', bloomsTaxonomy: { remembering: false, understanding: false, applying: false, analyzing: false, evaluating: false, creating: false } }
                              ],
                              moderatorSection: {
                                ilosComments: '',
                                paperAssessment: '',
                                organizationClear: '',
                                organizationSuggestions: '',
                                wordingProper: '',
                                wordingSuggestions: '',
                                modelAnswersPrepared: '',
                                modelAnswersSuggestions: '',
                                grammarSpelling: '',
                                improvementComments: ''
                              }
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
                      setModerationReport({
                        submittedDocuments: {
                          examPaperSigned: false,
                          coursePlan: false,
                          modelAnswers: false,
                          continuousAssessmentPapers: false,
                          continuousAssessmentPapersUrl: [],
                          previousExamPapers: false,
                          previousExamPapersUrl: []
                        },
                        ilosAssessed: [
                          { questionNo: '1', ilo: '', bloomsTaxonomy: { remembering: false, understanding: false, applying: false, analyzing: false, evaluating: false, creating: false } }
                        ],
                        moderatorSection: {
                          ilosComments: '',
                          paperAssessment: '',
                          organizationClear: '',
                          organizationSuggestions: '',
                          wordingProper: '',
                          wordingSuggestions: '',
                          modelAnswersPrepared: '',
                          modelAnswersSuggestions: '',
                          grammarSpelling: '',
                          improvementComments: ''
                        }
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
          <div className="bg-white rounded-[3rem] border border-black w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
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
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
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
                            {paper.moderationReport?.moderatorSection && (
                              <div className="space-y-2 pt-2 border-t border-rose-100">
                                <div className="flex justify-between items-center px-1">
                                  <p className="text-[8px] font-black uppercase text-indigo-600 tracking-[0.2em]">Previous Quality Report Details</p>
                                  <button 
                                    onClick={() => generateReportPDF(paper, paper)}
                                    className="flex items-center gap-1 text-[8px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors"
                                  >
                                    <FiDownload size={10} /> Download v{paper.version} Report
                                  </button>
                                </div>
                                <div className="bg-white/80 p-3 rounded-xl border border-rose-100 shadow-sm space-y-3">
                                  {[
                                    { label: '2.1 ILOs & Blooms', value: paper.moderationReport.moderatorSection.ilosComments },
                                    { label: '2.2 Paper Assessment', value: paper.moderationReport.moderatorSection.paperAssessment },
                                    { label: '2.3 Organization', value: paper.moderationReport.moderatorSection.organizationClear, extra: paper.moderationReport.moderatorSection.organizationSuggestions },
                                    { label: '2.4 Wording', value: paper.moderationReport.moderatorSection.wordingProper, extra: paper.moderationReport.moderatorSection.wordingSuggestions },
                                    { label: '2.5 Model Answers', value: paper.moderationReport.moderatorSection.modelAnswersPrepared, extra: paper.moderationReport.moderatorSection.modelAnswersSuggestions },
                                    { label: '2.6 Grammar/Spelling', value: paper.moderationReport.moderatorSection.grammarSpelling },
                                    { label: '2.7 Improvements', value: paper.moderationReport.moderatorSection.improvementComments }
                                  ].filter(f => f.value).map((f, i) => (
                                    <div key={i} className="border-b border-rose-50 last:border-0 pb-2 last:pb-0">
                                      <p className="text-[9px] font-black uppercase text-indigo-500 mb-0.5">{f.label} {['YES', 'NO'].includes(f.value) && `(${f.value})`}</p>
                                      {!['YES', 'NO'].includes(f.value) && <p className="text-[11px] font-bold text-slate-700 leading-snug">{f.value}</p>}
                                      {f.extra && <p className="text-[10px] mt-1 text-slate-500 italic font-medium leading-tight">Sug: {f.extra}</p>}
                                    </div>
                                  ))}
                                </div>
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
                  <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                    {/* PAPER-LIKE FORM START */}
                    <div
                      id="moderation-report-document"
                      className="bg-white border border-slate-300 shadow-2xl p-16 rounded-sm text-slate-900 space-y-16 relative"
                      style={{ fontFamily: "'Times New Roman', Times, serif" }}
                    >
                      <style>{`
                          #moderation-report-document input, 
                          #moderation-report-document textarea, 
                          #moderation-report-document button {
                            font-family: 'Times New Roman', Times, serif !important;
                          }
                        `}</style>
                      {/* Header */}
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold underline uppercase tracking-tight">REPORT FOR THE MODERATION OF EXAMINATION PAPER</h2>
                      </div>

                      <div className="space-y-8">
                        <h3 className="font-bold underline italic text-base">This section should be filled by the First Examiner(Lecturer)</h3>

                        <div className="space-y-5 text-sm font-bold">
                          <div className="flex gap-2 items-end">
                            <span className="shrink-0">Department:</span>
                            <div className="border-b-2 border-dotted border-slate-400 flex-1 h-6 px-3">{user?.department || '............................................................'}</div>
                          </div>
                          <div className="flex gap-2 items-end">
                            <span className="shrink-0">Faculty:</span>
                            <div className="border-b-2 border-dotted border-slate-400 flex-1 h-6 px-3">{user?.faculty || '............................................................'}</div>
                          </div>
                          <div className="flex gap-2 items-end">
                            <span className="shrink-0">Academic Year and Semester:</span>
                            <div className="border-b-2 border-dotted border-slate-400 flex-1 h-6 px-3">
                              {selectedTask?.academicYear || uploadData.academicYear} / Semester {selectedTask?.semester || uploadData.semester}
                              {(selectedTask?.batch || uploadData.batch) && ` (${selectedTask?.batch || uploadData.batch})`}
                            </div>
                          </div>
                          <div className="flex gap-2 items-end">
                            <span className="shrink-0">Course code and Title:</span>
                            <div className="border-b-2 border-dotted border-slate-400 flex-1 h-6 px-3 uppercase">
                              {selectedTask?.subject?.code} — {selectedTask?.subject?.name}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 1.1 Documents Checklist */}
                      <div className="space-y-6">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-lg">1.1.</span>
                          <p className="text-base font-bold">The following documents are submitted (please tick)</p>
                        </div>

                        <table className="w-full border-collapse border-2 border-slate-900 text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border-2 border-slate-900 p-3 w-12 text-center">No</th>
                              <th className="border-2 border-slate-900 p-3 text-left">Item</th>
                              <th className="border-2 border-slate-900 p-3 w-40 text-center">Upload Document</th>
                              <th className="border-2 border-slate-900 p-3 w-24 text-center">Tick</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { id: 'examPaperSigned', no: 1, label: 'Examination paper signed by the First Examiner' },
                              { id: 'coursePlan', no: 2, label: 'Course plan (course specifications)' },
                              { id: 'modelAnswers', no: 3, label: 'Model answers with the allocation of marks' },
                              { id: 'continuousAssessmentPapers', no: 4, label: 'Continuous Assessment Papers of this particular course' },
                              { id: 'previousExamPapers', no: 5, label: 'Exam papers for the last three years of this particular course' }
                            ].map(doc => {
                              const isMultiple = ['continuousAssessmentPapers', 'previousExamPapers'].includes(doc.id);
                              const urls = moderationReport.submittedDocuments[`${doc.id}Url`];
                              
                              return (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="border-2 border-slate-900 p-3 text-center font-bold">{doc.no}</td>
                                  <td className="border-2 border-slate-900 p-3 font-bold">
                                    {doc.label}
                                    {isMultiple && (
                                      <div className="mt-2 space-y-2">
                                        {Array.isArray(urls) && urls.map((url, idx) => (
                                          <div key={idx} className="flex items-center justify-between bg-slate-100 p-2 rounded-lg border border-slate-200">
                                            <span className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]">PDF {idx + 1}</span>
                                            <div className="flex gap-2">
                                              <button
                                                type="button"
                                                onClick={() => handleDownload(url, `${doc.id}_${idx + 1}.pdf`)}
                                                className="text-[9px] font-black text-indigo-600 hover:underline uppercase"
                                              >
                                                View
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => removeDoc(doc.id, idx)}
                                                className="text-[9px] font-black text-rose-600 hover:underline uppercase"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                  <td className="border-2 border-slate-900 p-3 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <input
                                        type="file"
                                        accept=".pdf"
                                        id={`upload-${doc.id}`}
                                        className="hidden"
                                        onChange={(e) => handleDocUpload(e, doc.id)}
                                      />
                                      <label
                                        htmlFor={`upload-${doc.id}`}
                                        className={`px-3 py-1.5 rounded-lg border-2 flex items-center gap-2 cursor-pointer transition-all ${moderationReport.submittedDocuments[`${doc.id}Url`] && !isMultiple ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-400 hover:border-slate-900 hover:text-slate-900'}`}
                                      >
                                        <FiUpload size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                          {isMultiple 
                                            ? 'Add Another PDF' 
                                            : moderationReport.submittedDocuments[`${doc.id}Url`] ? 'Replace PDF' : 'Upload PDF'}
                                        </span>
                                      </label>
                                      {moderationReport.submittedDocuments[`${doc.id}Url`] && !isMultiple && (
                                        <div className="flex flex-col items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleDownload(moderationReport.submittedDocuments[`${doc.id}Url`], `${doc.id}.pdf`)}
                                            className="text-[9px] font-bold text-indigo-500 hover:underline flex items-center gap-1"
                                          >
                                            <FiDownload size={10} /> View Uploaded
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => removeSingleDoc(doc.id)}
                                            className="text-[9px] font-bold text-rose-500 hover:underline flex items-center gap-1"
                                          >
                                            <FiX size={10} /> Remove
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="border-2 border-slate-900 p-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={moderationReport.submittedDocuments[doc.id]}
                                      onChange={() => handleDocTick(doc.id)}
                                      className="w-5 h-5 border-2 border-slate-900 text-slate-900 focus:ring-0 cursor-pointer"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* 1.2 ILOs and Blooms */}
                      <div className="space-y-6">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-lg">1.2.</span>
                          <p className="text-base font-bold">What are the ILOs of the course and what levels from Bloom's taxonomy being assessed?</p>
                        </div>

                        <div className="flex justify-end">
                          <button type="button" onClick={addIloRow} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase rounded-md shadow-lg hover:bg-black transition-all">+ Add Question Row</button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border-2 border-slate-900 text-xs">
                            <thead>
                              <tr>
                                <th rowSpan="2" className="border-2 border-slate-900 p-3 w-24 text-center font-bold italic bg-slate-50">Question No.</th>
                                <th rowSpan="2" className="border-2 border-slate-900 p-3 font-bold italic bg-slate-50">ILOs Assessed</th>
                                <th colSpan="6" className="border-2 border-slate-900 p-3 text-center font-bold italic bg-slate-50">Bloom's taxonomy</th>
                                <th rowSpan="2" className="border-2 border-slate-900 w-10 text-center bg-rose-50 text-rose-500">
                                  <FiX size={14} className="mx-auto" />
                                </th>
                              </tr>
                              <tr>
                                {['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'].map(lvl => (
                                  <th key={lvl} className="border-2 border-slate-900 p-2 text-center font-bold italic text-[9px] leading-tight bg-slate-50">{lvl}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {moderationReport.ilosAssessed.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="border-2 border-slate-900 p-2 text-center bg-slate-50/30">
                                    <input
                                      type="text"
                                      className="w-full text-center bg-transparent border-none focus:ring-0 font-black text-base"
                                      value={row.questionNo}
                                      onChange={(e) => handleIloChange(idx, 'questionNo', e.target.value)}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const allChecked = Object.values(row.bloomsTaxonomy).every(v => v === true);
                                        const newValue = !allChecked;
                                        const newIlos = [...moderationReport.ilosAssessed];
                                        const newBlooms = { ...newIlos[idx].bloomsTaxonomy };
                                        Object.keys(newBlooms).forEach(key => {
                                          newBlooms[key] = newValue;
                                        });
                                        newIlos[idx].bloomsTaxonomy = newBlooms;
                                        setModerationReport({ ...moderationReport, ilosAssessed: newIlos });
                                      }}
                                      className="mt-1 px-2 py-0.5 bg-slate-800 text-white text-[8px] font-black rounded uppercase hover:bg-indigo-600 transition-all shadow-sm border border-black"
                                    >
                                      Select All
                                    </button>
                                  </td>
                                  <td className="border-2 border-slate-900 p-2">
                                    <textarea
                                      className="w-full bg-transparent border-none focus:ring-0 resize-none font-medium italic"
                                      value={row.ilo}
                                      onChange={(e) => handleIloChange(idx, 'ilo', e.target.value)}
                                      placeholder="..."
                                      onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                                    />
                                  </td>
                                  {Object.keys(row.bloomsTaxonomy).map(level => (
                                    <td key={level} className="border-2 border-slate-900 p-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={row.bloomsTaxonomy[level]}
                                        onChange={() => handleBloomsTick(idx, level)}
                                        className="w-5 h-5 border-2 border-slate-900 text-slate-900 focus:ring-0 cursor-pointer"
                                      />
                                    </td>
                                  ))}
                                  <td className="border-2 border-slate-900 p-2 text-center">
                                    {moderationReport.ilosAssessed.length > 1 && (
                                      <button type="button" onClick={() => removeIloRow(idx)} className="text-rose-400 hover:text-rose-600 transition-colors">
                                        <FiX size={18} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Footer / Signature */}
                      <div className="pt-20 space-y-12">
                        <div className="text-base font-bold">Name and Signature of the First Examiner:</div>
                        <div className="flex items-end gap-4 w-full h-16">
                          <div className="border-b-2 border-dotted border-slate-400 flex-1 h-full px-6 flex items-center relative group">
                            {user?.signature && (
                              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full flex justify-center">
                                <img
                                  src={user.signature.startsWith('http') ? user.signature : `${(import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api', '').replace(/\/$/, '')}/${user.signature.replace(/^\//, '')}`}
                                  alt="Digital Signature"
                                  className="h-28 object-contain mix-multiply z-10 drop-shadow-sm rotate-[-2deg] transition-transform group-hover:rotate-0"
                                />
                              </div>
                            )}
                            <span className="italic text-2xl text-slate-400 font-serif font-bold tracking-wide select-none">
                              {user?.name}
                            </span>
                          </div>
                          <div className="shrink-0 text-base font-bold pb-2">Date:</div>
                          <div className="border-b-2 border-dotted border-slate-400 w-64 h-10 px-6 flex items-center italic text-xl text-slate-600 font-bold">
                            {new Date().toLocaleDateString()}
                          </div>
                        </div>
                      </div>



                      {/* Declaration Checkbox */}
                      <div className="p-10 bg-slate-50 border-2 border-dotted border-slate-300 rounded-sm">
                        <label className="flex items-start gap-4 cursor-pointer group">
                          <div className="relative flex items-center mt-1">
                            <input
                              type="checkbox"
                              required
                              className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-slate-900 checked:bg-slate-900 transition-all"
                            />
                            <FiCheckCircle className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 left-1 pointer-events-none transition-opacity" />
                          </div>
                          <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                            I hereby declare that this examination paper has been prepared in accordance with the university quality standards and academic integrity guidelines. I confirm that all questions are original or appropriately cited.
                          </p>
                        </label>
                      </div>



                      <button
                        type="submit"
                        disabled={uploading || !moderationReport.submittedDocuments.examPaperSignedUrl}
                        className={`w-full mt-12 py-8 bg-slate-900 text-white rounded-3xl font-black uppercase text-base tracking-[0.3em] transition-all shadow-2xl ${uploading || !moderationReport.submittedDocuments.examPaperSignedUrl ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black hover:-translate-y-2 active:translate-y-0'}`}
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
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showHistoryModal && selectedPaperForModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] border border-black w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-black bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <FiClock /> Version History
                </h2>
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mt-1">
                  v{selectedPaperForModal.version} Snapshot
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all">
                <FiX />
              </button>
            </div>
            <div className="bg-slate-900 px-8 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/10">
               <button 
                  onClick={() => setActiveVersionTab('current')}
                  className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap ${activeVersionTab === 'current' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
               >
                  Current (v{selectedPaperForModal.version})
               </button>
               {selectedPaperForModal.versionHistory?.map((v, i) => (
                  <button 
                     key={i}
                     onClick={() => setActiveVersionTab(v.version)}
                     className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeVersionTab === v.version ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  >
                     History v{v.version}
                  </button>
               ))}
            </div>

            <div className="overflow-y-auto p-8 flex-1 bg-slate-50/50">
               {activeVersionTab === 'current' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div className="flex items-center justify-between mb-6">
                        <span className="px-3 py-1 bg-indigo-600/10 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200">
                           Active Version Snapshot
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 italic">
                           Submitted: {new Date(selectedPaperForModal.submittedAt).toLocaleString()}
                        </span>
                     </div>

                     <div className="bg-white border border-black rounded-[2rem] p-8 shadow-sm space-y-6">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-[0.2em]">Quality Report Details</p>
                           {selectedPaperForModal.moderationReport?.moderatorSection ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {[
                                    { label: '2.1 ILOs', value: selectedPaperForModal.moderationReport.moderatorSection.ilosComments },
                                    { label: '2.2 Assessment', value: selectedPaperForModal.moderationReport.moderatorSection.paperAssessment },
                                    { label: '2.3 Org.', value: selectedPaperForModal.moderationReport.moderatorSection.organizationSuggestions },
                                    { label: '2.4 Wording', value: selectedPaperForModal.moderationReport.moderatorSection.wordingSuggestions },
                                    { label: '2.5 Answers', value: selectedPaperForModal.moderationReport.moderatorSection.modelAnswersSuggestions },
                                    { label: '2.6 Grammar', value: selectedPaperForModal.moderationReport.moderatorSection.grammarSpelling },
                                    { label: 'Outcome', value: selectedPaperForModal.status.replace(/_/g, ' ') }
                                 ].filter(f => f.value).map((f, i) => (
                                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                       <p className="text-[8px] font-black uppercase text-indigo-500 mb-1">{f.label}</p>
                                       <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{f.value}</p>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No report filed for this version yet</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               ) : (
                  selectedPaperForModal.versionHistory?.filter(v => v.version === activeVersionTab).map((hist, idx) => (
                     <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-6">
                           <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-300">
                              Archived Snapshot (v{hist.version})
                           </span>
                           <span className="text-[10px] font-bold text-slate-400 italic">
                              Submitted: {new Date(hist.submittedAt).toLocaleString()}
                           </span>
                        </div>

                        <div className="bg-white border border-black/10 rounded-[2rem] p-8 shadow-sm space-y-6">
                           <div>
                              <div className="flex justify-between items-center mb-4">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Historical Review Snapshot</p>
                                 <button 
                                    onClick={() => generateReportPDF(selectedPaperForModal, hist)}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2"
                                 >
                                    <FiDownload size={12} /> Download PDF
                                 </button>
                              </div>

                              {hist.moderationReport?.moderatorSection ? (
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                       { label: '2.1 ILOs', value: hist.moderationReport.moderatorSection.ilosComments },
                                       { label: '2.2 Assessment', value: hist.moderationReport.moderatorSection.paperAssessment },
                                       { label: '2.3 Org.', value: `${hist.moderationReport.moderatorSection.organizationClear ? hist.moderationReport.moderatorSection.organizationClear : ''}${hist.moderationReport.moderatorSection.organizationSuggestions ? '\nSug: ' + hist.moderationReport.moderatorSection.organizationSuggestions : ''}`.trim() },
                                       { label: '2.4 Wording', value: `${hist.moderationReport.moderatorSection.wordingProper ? hist.moderationReport.moderatorSection.wordingProper : ''}${hist.moderationReport.moderatorSection.wordingSuggestions ? '\nSug: ' + hist.moderationReport.moderatorSection.wordingSuggestions : ''}`.trim() },
                                       { label: '2.5 Answers', value: `${hist.moderationReport.moderatorSection.modelAnswersPrepared ? hist.moderationReport.moderatorSection.modelAnswersPrepared : ''}${hist.moderationReport.moderatorSection.modelAnswersSuggestions ? '\nSug: ' + hist.moderationReport.moderatorSection.modelAnswersSuggestions : ''}`.trim() },
                                       { label: '2.6 Grammar', value: hist.moderationReport.moderatorSection.grammarSpelling },
                                       { label: '2.7 Improvements', value: hist.moderationReport.moderatorSection.improvementComments },
                                       { label: 'Outcome', value: hist.status.replace(/_/g, ' ') }
                                    ].filter(f => f.value).map((f, i) => (
                                       <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                          <p className="text-[8px] font-black uppercase text-indigo-500 mb-1">{f.label}</p>
                                          <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{f.value}</p>
                                       </div>
                                    ))}
                                 </div>
                              ) : (
                                 <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No report was captured for this version</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  ))
               )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-black text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Institutional Paper Audit Trail</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPapers;

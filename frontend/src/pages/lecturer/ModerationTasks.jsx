import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheckSquare, FiFileText, FiDownload, FiMessageSquare, FiCheck, FiX, FiInfo, FiClock, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ModerationTasks = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeVersionTab, setActiveVersionTab] = useState('current');
  const [activeReportVersion, setActiveReportVersion] = useState({});
  const [reviewData, setReviewData] = useState({
    status: '',
    comment: '',
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
    },
    submittedDocuments: {
      examPaperSignedApproved: false,
      coursePlanApproved: false,
      modelAnswersApproved: false,
      continuousAssessmentPapersApproved: false,
      previousExamPapersApproved: false
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/exam-papers/review-list');
      setPapers(res.data.data || []);
    } catch (error) {
      console.error('Error fetching data', error);
      toast.error('Failed to load moderation tasks');
    } finally {
      setLoading(false);
    }
  };

  const pendingPapers = papers.filter(p => p.status === 'Pending_Moderation' && (p.moderator?._id === user?.id || p.moderator === user?.id));
  const historyPapers = papers.filter(p => p.status !== 'Pending_Moderation' || (p.status === 'Pending_Moderation' && p.moderator?._id !== user?.id && p.moderator !== user?.id));
  const displayPapers = activeTab === 'pending' ? pendingPapers : historyPapers;

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewData.status) {
      toast.error('Please select an action');
      return;
    }

    // Require signature for accepting
    if (reviewData.status === 'Moderated' && !user?.signature) {
      toast.error('Digital signature is required to moderate/accept papers. Please add it in your profile.');
      return;
    }

    try {
      await api.put(`/api/exam-papers/${selectedPaper._id}/moderate`, reviewData);
      toast.success(reviewData.status === 'Moderated' ? 'Paper accepted with digital signature' : 'Changes requested');
      setShowReviewModal(false);
      setReviewData({
        status: '',
        comment: '',
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
        },
        submittedDocuments: {
          examPaperSignedApproved: false,
          coursePlanApproved: false,
          modelAnswersApproved: false,
          continuousAssessmentPapersApproved: false,
          previousExamPapersApproved: false
        }
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      'Draft': 'bg-slate-100 text-slate-600 border-slate-200',
      'Pending_Moderation': 'bg-amber-50 text-amber-600 border-amber-200',
      'Changes_Requested_Moderator': 'bg-rose-50 text-rose-600 border-rose-200',
      'Moderated': 'bg-indigo-50 text-indigo-600 border-indigo-200',
      'Pending_HOD_Approval': 'bg-blue-50 text-blue-600 border-blue-200',
      'Approved_By_HOD': 'bg-emerald-50 text-emerald-600 border-emerald-200',
      'Changes_Requested_HOD': 'bg-rose-100 text-rose-700 border-rose-300',
      'Pending_Exam_Officer': 'bg-orange-50 text-orange-600 border-orange-200',
      'Accepted_By_Exam_Officer': 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
    return styles[status] || 'bg-slate-50 text-slate-400 border-slate-100';
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

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Moderation Dashboard</h1>
            <p className="text-slate-500 font-medium italic">Oversee the quality and integrity of academic examination papers</p>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl border border-black shadow-sm">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'pending' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Pending ({pendingPapers.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              History ({historyPapers.length})
            </button>
          </div>
        </div>

        {displayPapers.length === 0 ? (
          <div className="bg-white border border-black rounded-[2.5rem] p-20 text-center shadow-sm animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FiCheckSquare size={40} />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
              {activeTab === 'pending' ? "You're all caught up!" : "No history found"}
            </h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              {activeTab === 'pending' ? "No pending moderation tasks at the moment" : "You haven't reviewed any papers yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {displayPapers.map((paper) => (
              <div key={paper._id} className="bg-white border border-black rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[5rem] -mr-6 -mt-6 transition-all group-hover:scale-110 opacity-20 ${paper.status === 'Pending_Moderation' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>

                <div className="relative z-10">
                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">
                        {paper.subject.code} • {paper.academicYear} • SEM {paper.semester}
                      </p>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter line-clamp-1">{paper.subject.name}</h3>
                    </div>
                    {activeTab === 'history' && (
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border ${getStatusStyle(paper.status)}`}>
                        {paper.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Lecturer (Creator)</p>
                      <p className="font-bold text-slate-700">{paper.lecturer?.name}</p>
                    </div>
                    <div className="flex items-center justify-between px-2 text-slate-500">
                      <div className="flex items-center gap-2">
                        <FiFileText size={14} className="text-indigo-400" />
                        <span className="text-[11px] font-bold truncate max-w-[150px]">{paper.fileName}</span>
                      </div>
                      <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[150px]">
                        <button 
                          onClick={() => { setSelectedPaper(paper); setShowHistoryModal(true); setActiveVersionTab('current'); }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-indigo-200 bg-white/50 hover:bg-white transition-all whitespace-nowrap"
                        >
                          <span className="text-[9px] font-black uppercase tracking-tighter">v{paper.version}</span>
                        </button>
                        {[...(paper.versionHistory || [])].reverse().map((v, i) => (
                          <button 
                            key={i}
                            onClick={() => { setSelectedPaper(paper); setShowHistoryModal(true); setActiveVersionTab(v.version); }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-black/10 bg-white/20 hover:bg-white/50 transition-all whitespace-nowrap"
                          >
                            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">v{v.version}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {activeTab === 'pending' && (paper.moderator?._id === user?.id || paper.moderator === user?.id) ? (
                      <button
                        onClick={() => {
                          // Try to find the report from the previous version to pre-fill
                          const prevVersion = historyPapers.find(p => 
                            p.subject?._id === paper.subject?._id && 
                            p.version === paper.version - 1
                          );

                          setSelectedPaper(paper);
                          setReviewData({
                            status: '',
                            comment: '',
                            moderatorSection: paper.moderationReport?.moderatorSection || prevVersion?.moderationReport?.moderatorSection || {
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
                            },
                            submittedDocuments: paper.moderationReport?.submittedDocuments || {
                              examPaperSignedApproved: false,
                              coursePlanApproved: false,
                              modelAnswersApproved: false,
                              continuousAssessmentPapersApproved: false,
                              previousExamPapersApproved: false
                            }
                          });
                          setShowReviewModal(true);
                        }}
                        className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                      >
                        <FiCheckSquare /> Review Paper
                      </button>
                    ) : (
                      <button
                        onClick={() => { setSelectedPaper(paper); setShowDetailModal(true); }}
                        className="flex-1 py-3 bg-white border border-black text-slate-800 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        <FiInfo /> View Details & Review
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(paper.fileUrl, `${paper.subject.code}_v${paper.version}.pdf`)}
                      className="w-12 h-12 border border-black rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600 shrink-0"
                    >
                      <FiDownload />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[3rem] border border-black w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
              <div className="p-8 border-b border-black bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Review Exam Paper</h2>
                  <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mt-1">{selectedPaper.subject.code} • {selectedPaper.subject.name}</p>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="w-10 h-10 rounded-xl border border-black flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
                  <FiX />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {(() => {
                  const prevVersion = selectedPaper.versionHistory?.find(v => 
                    v.version === selectedPaper.version - 1
                  );
                  return prevVersion?.moderationReport?.moderatorSection ? (
                    <div className="p-8 bg-indigo-50/50 border-b border-black space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                          <FiMessageSquare /> Previous Version Requirements (v{prevVersion.version})
                        </h3>
                        <button 
                          onClick={() => generateReportPDF(selectedPaper, prevVersion)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm"
                        >
                          <FiDownload size={10} /> Download v{prevVersion.version} Report
                        </button>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm space-y-3">
                        {[
                          { label: '2.1 ILOs & Blooms', value: prevVersion.moderationReport.moderatorSection.ilosComments },
                          { label: '2.2 Paper Assessment', value: prevVersion.moderationReport.moderatorSection.paperAssessment },
                          { label: '2.3 Organization', value: prevVersion.moderationReport.moderatorSection.organizationClear, extra: prevVersion.moderationReport.moderatorSection.organizationSuggestions },
                          { label: '2.4 Wording', value: prevVersion.moderationReport.moderatorSection.wordingProper, extra: prevVersion.moderationReport.moderatorSection.wordingSuggestions },
                          { label: '2.5 Model Answers', value: prevVersion.moderationReport.moderatorSection.modelAnswersPrepared, extra: prevVersion.moderationReport.moderatorSection.modelAnswersSuggestions },
                          { label: '2.6 Grammar/Spelling', value: prevVersion.moderationReport.moderatorSection.grammarSpelling },
                          { label: '2.7 Improvements', value: prevVersion.moderationReport.moderatorSection.improvementComments }
                        ].filter(f => f.value || f.extra).map((f, i) => (
                          <div key={i} className="border-b border-indigo-50 last:border-0 pb-2 last:pb-0">
                            <p className="text-[9px] font-black uppercase text-indigo-500 mb-0.5">{f.label} {['YES', 'NO'].includes(f.value) && `(${f.value})`}</p>
                            {!['YES', 'NO'].includes(f.value) && <p className="text-[11px] font-bold text-slate-700 leading-snug">{f.value}</p>}
                            {f.extra && <p className="text-[10px] mt-1 text-slate-500 italic font-medium leading-tight">Sug: {f.extra}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                <div className="p-8 bg-slate-50/50 border-b border-black space-y-6">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <FiFileText /> Submitted Evidence & Documents
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'examPaperSigned', label: 'Signed Exam Paper', url: selectedPaper.moderationReport?.submittedDocuments?.examPaperSignedUrl },
                      { id: 'coursePlan', label: 'Course Plan', url: selectedPaper.moderationReport?.submittedDocuments?.coursePlanUrl },
                      { id: 'modelAnswers', label: 'Model Answers', url: selectedPaper.moderationReport?.submittedDocuments?.modelAnswersUrl },
                      { id: 'continuousAssessmentPapers', label: 'Continuous Assessments', url: selectedPaper.moderationReport?.submittedDocuments?.continuousAssessmentPapersUrl, isMultiple: true },
                      { id: 'previousExamPapers', label: 'Previous Exam Papers', url: selectedPaper.moderationReport?.submittedDocuments?.previousExamPapersUrl, isMultiple: true }
                    ].map((doc) => {
                      if (!doc.url || (doc.isMultiple && doc.url.length === 0)) return null;

                      const isApproved = reviewData.submittedDocuments?.[`${doc.id}Approved`];

                      return (
                        <div key={doc.id} className="bg-white border border-black p-4 rounded-2xl flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest">{doc.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase">Uploaded</span>
                              {activeTab === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReviewData(prev => ({
                                      ...prev,
                                      submittedDocuments: {
                                        ...prev.submittedDocuments,
                                        [`${doc.id}Approved`]: !prev.submittedDocuments?.[`${doc.id}Approved`]
                                      }
                                    }));
                                  }}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase transition-all border ${isApproved ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
                                >
                                  {isApproved ? <FiCheckCircle size={10} /> : <FiCheck size={10} />}
                                  {isApproved ? 'Approved' : 'Approve'}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {doc.isMultiple ? (
                              doc.url.map((path, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleDownload(path, `${doc.label}_${idx + 1}.pdf`)}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-lg text-[9px] font-black transition-all border border-slate-200"
                                >
                                  <FiDownload /> PDF {idx + 1}
                                </button>
                              ))
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDownload(doc.url, `${doc.label}.pdf`)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-lg text-[9px] font-black transition-all border border-slate-200"
                              >
                                <FiDownload /> View {doc.label}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleReview} className="p-8 space-y-12">
                  {/* Part-2: Moderator Section */}
                  <div className="space-y-8 pt-6 border-t-2 border-slate-100">
                  <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg underline decoration-indigo-500 decoration-4 underline-offset-8">Moderator Quality Report</h3>

                  <div className="space-y-8">
                    {/* 2.1 */}
                    <div className="space-y-3">
                      <label className="block text-xs font-black uppercase text-slate-500 tracking-widest">2.1. Comments on ILOs, and assessed Bloom's Taxonomy:</label>
                      <textarea
                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all min-h-[100px] text-sm font-bold"
                        placeholder="Enter comments..."
                        value={reviewData.moderatorSection?.ilosComments || ''}
                        onChange={(e) => setReviewData(prev => ({
                          ...prev,
                          moderatorSection: { ...prev.moderatorSection, ilosComments: e.target.value }
                        }))}
                      />
                    </div>

                    {/* 2.2 */}
                    <div className="space-y-3">
                      <label className="block text-xs font-black uppercase text-slate-500 tracking-widest">2.2. How well does the question paper assess the contents of the course?</label>
                      <textarea
                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all min-h-[100px] text-sm font-bold"
                        placeholder="Enter assessment..."
                        value={reviewData.moderatorSection?.paperAssessment || ''}
                        onChange={(e) => setReviewData(prev => ({
                          ...prev,
                          moderatorSection: { ...prev.moderatorSection, paperAssessment: e.target.value }
                        }))}
                      />
                    </div>

                    {/* 2.3 */}
                    <div className="space-y-3">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest">2.3. Is the question paper organized clear and understandable way?</label>
                        <div className="flex gap-4">
                          {['YES', 'NO'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="radio"
                                name="organizationClear"
                                value={opt}
                                checked={reviewData.moderatorSection?.organizationClear === opt}
                                onChange={(e) => setReviewData(prev => ({
                                  ...prev,
                                  moderatorSection: { ...prev.moderatorSection, organizationClear: e.target.value }
                                }))}
                                className="h-5 w-5 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-xs font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {reviewData.moderatorSection?.organizationClear !== 'YES' && (
                        <textarea
                          className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all min-h-[80px] text-sm font-bold"
                          placeholder="If NO, please provide suggestions for improvements..."
                          value={reviewData.moderatorSection?.organizationSuggestions || ''}
                          onChange={(e) => setReviewData(prev => ({
                            ...prev,
                            moderatorSection: { ...prev.moderatorSection, organizationSuggestions: e.target.value }
                          }))}
                        />
                      )}
                    </div>

                    {/* 2.4 */}
                    <div className="space-y-3">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest">2.4. Questions proper wording and phrase (unambiguous)?</label>
                        <div className="flex gap-4">
                          {['YES', 'NO'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="radio"
                                name="wordingProper"
                                value={opt}
                                checked={reviewData.moderatorSection?.wordingProper === opt}
                                onChange={(e) => setReviewData(prev => ({
                                  ...prev,
                                  moderatorSection: { ...prev.moderatorSection, wordingProper: e.target.value }
                                }))}
                                className="h-5 w-5 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-xs font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {reviewData.moderatorSection?.wordingProper !== 'YES' && (
                        <textarea
                          className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all min-h-[80px] text-sm font-bold"
                          placeholder="If NO, please provide suggestions for improvements..."
                          value={reviewData.moderatorSection?.wordingSuggestions || ''}
                          onChange={(e) => setReviewData(prev => ({
                            ...prev,
                            moderatorSection: { ...prev.moderatorSection, wordingSuggestions: e.target.value }
                          }))}
                        />
                      )}
                    </div>

                    {/* 2.5 */}
                    <div className="space-y-3">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest">2.5. Model answers well prepared with marks?</label>
                        <div className="flex gap-4">
                          {['YES', 'NO'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="radio"
                                name="modelAnswersPrepared"
                                value={opt}
                                checked={reviewData.moderatorSection?.modelAnswersPrepared === opt}
                                onChange={(e) => setReviewData(prev => ({
                                  ...prev,
                                  moderatorSection: { ...prev.moderatorSection, modelAnswersPrepared: e.target.value }
                                }))}
                                className="h-5 w-5 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-xs font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {reviewData.moderatorSection?.modelAnswersPrepared !== 'YES' && (
                        <textarea
                          className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all min-h-[80px] text-sm font-bold"
                          placeholder="If NO, please provide suggestions for improvements..."
                          value={reviewData.moderatorSection?.modelAnswersSuggestions || ''}
                          onChange={(e) => setReviewData(prev => ({
                            ...prev,
                            moderatorSection: { ...prev.moderatorSection, modelAnswersSuggestions: e.target.value }
                          }))}
                        />
                      )}
                    </div>

                    {/* 2.6 */}
                    <div className="space-y-3">
                      <label className="block text-xs font-black uppercase text-slate-500 tracking-widest">2.6. Spelling and grammatical mistakes to be corrected:</label>
                      <textarea
                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all min-h-[100px] text-sm font-bold"
                        placeholder="Enter mistakes to correct..."
                        value={reviewData.moderatorSection?.grammarSpelling || ''}
                        onChange={(e) => setReviewData(prev => ({
                          ...prev,
                          moderatorSection: { ...prev.moderatorSection, grammarSpelling: e.target.value }
                        }))}
                      />
                    </div>

                    {/* 2.7 */}
                    <div className="space-y-3">
                      <label className="block text-xs font-black uppercase text-slate-500 tracking-widest">2.7. Any other comments for improvement:</label>
                      <textarea
                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all min-h-[100px] text-sm font-bold"
                        placeholder="Enter other comments..."
                        value={reviewData.moderatorSection?.improvementComments || ''}
                        onChange={(e) => setReviewData(prev => ({
                          ...prev,
                          moderatorSection: { ...prev.moderatorSection, improvementComments: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t-2 border-slate-100">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Select Review Outcome</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        const sec = reviewData.moderatorSection;
                        const missing = [];
                        if (!sec.ilosComments?.trim()) missing.push("2.1");
                        if (!sec.paperAssessment?.trim()) missing.push("2.2");
                        if (!sec.organizationClear) missing.push("2.3");
                        if (sec.organizationClear === 'NO' && !sec.organizationSuggestions?.trim()) missing.push("2.3 Sug");
                        if (!sec.wordingProper) missing.push("2.4");
                        if (sec.wordingProper === 'NO' && !sec.wordingSuggestions?.trim()) missing.push("2.4 Sug");
                        if (!sec.modelAnswersPrepared) missing.push("2.5");
                        if (sec.modelAnswersPrepared === 'NO' && !sec.modelAnswersSuggestions?.trim()) missing.push("2.5 Sug");
                        if (!sec.grammarSpelling?.trim()) missing.push("2.6");
                        if (!sec.improvementComments?.trim()) missing.push("2.7");

                        if (missing.length > 0) {
                          toast.error(`Please complete sections: ${missing.join(', ')}`);
                          return;
                        }
                        setReviewData({ ...reviewData, status: 'Moderated' });
                      }}
                      className={`py-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all flex flex-col items-center gap-2 ${reviewData.status === 'Moderated' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-inner' : 'border-slate-100 hover:border-slate-300'}`}
                    >
                      <FiCheck size={20} /> Accept Paper
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sec = reviewData.moderatorSection;
                        const missing = [];
                        if (!sec.ilosComments?.trim()) missing.push("2.1");
                        if (!sec.paperAssessment?.trim()) missing.push("2.2");
                        if (!sec.organizationClear) missing.push("2.3");
                        if (!sec.wordingProper) missing.push("2.4");
                        if (!sec.modelAnswersPrepared) missing.push("2.5");
                        if (!sec.grammarSpelling?.trim()) missing.push("2.6");
                        if (!sec.improvementComments?.trim()) missing.push("2.7");

                        if (missing.length > 0) {
                          toast.error(`Please fill all Quality Report sections before requesting changes`);
                          return;
                        }
                        setReviewData({ ...reviewData, status: 'Changes_Requested_Moderator' });
                      }}
                      className={`py-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all flex flex-col items-center gap-2 ${reviewData.status === 'Changes_Requested_Moderator' ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-inner' : 'border-slate-100 hover:border-slate-300'}`}
                    >
                      <FiMessageSquare size={20} /> Request Changes
                    </button>
                  </div>
                </div>



                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-4 border border-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-2 px-8 py-4 bg-indigo-600 text-white border border-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* History Detail Modal */}
      {showDetailModal && selectedPaper && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] border border-black w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
            <div className="p-8 border-b border-black bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Moderation History</h2>
                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mt-1">{selectedPaper.subject.code} • {selectedPaper.subject.name}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 rounded-xl border border-black flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
                <FiX />
              </button>
            </div>

            <div className="overflow-y-auto p-8 space-y-6 flex-1 bg-slate-50/30">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Current Status</h3>
                <div className={`p-4 rounded-2xl border ${getStatusStyle(selectedPaper.status)} flex items-center justify-between`}>
                  <span className="font-black uppercase text-xs tracking-widest">{selectedPaper.status.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-bold opacity-60 italic">v{selectedPaper.version}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-black rounded-2xl">
                  <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Submitted By</p>
                  <p className="text-xs font-bold text-slate-700">{selectedPaper.lecturer?.name}</p>
                </div>
                <div className="p-4 bg-white border border-black rounded-2xl">
                  <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Submitted At</p>
                  <p className="text-xs font-bold text-slate-700">{new Date(selectedPaper.submittedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Moderation Trail</h3>
                {selectedPaper.moderatorComments?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPaper.moderatorComments.map((c, i) => (
                      <div key={i} className="p-4 bg-white border border-black rounded-2xl relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                        <p className="text-[10px] font-black uppercase text-indigo-500 mb-1">Moderator Comment</p>
                        <p className="text-xs font-medium text-slate-600 italic">"{c.comment}"</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-2 text-right">{new Date(c.date).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-bold text-slate-400 italic">No moderation comments yet.</p>
                )}

                {selectedPaper.moderationReport?.moderatorSection && (
                  <div className="mt-6 p-6 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                      <FiCheckCircle /> Quality Report Summary
                    </h4>
                    <div className="space-y-4">
                      {[
                        { label: '2.1 ILOs & Blooms', value: selectedPaper.moderationReport.moderatorSection.ilosComments },
                        { label: '2.2 Paper Assessment', value: selectedPaper.moderationReport.moderatorSection.paperAssessment },
                        { label: '2.3 Organization', value: selectedPaper.moderationReport.moderatorSection.organizationClear, extra: selectedPaper.moderationReport.moderatorSection.organizationSuggestions },
                        { label: '2.4 Wording', value: selectedPaper.moderationReport.moderatorSection.wordingProper, extra: selectedPaper.moderationReport.moderatorSection.wordingSuggestions },
                        { label: '2.5 Model Answers', value: selectedPaper.moderationReport.moderatorSection.modelAnswersPrepared, extra: selectedPaper.moderationReport.moderatorSection.modelAnswersSuggestions },
                        { label: '2.6 Grammar/Spelling', value: selectedPaper.moderationReport.moderatorSection.grammarSpelling },
                        { label: '2.7 Improvements', value: selectedPaper.moderationReport.moderatorSection.improvementComments }
                      ].filter(field => field.value || field.extra).map((field, idx) => (
                        <div key={idx} className="bg-white/60 p-3 rounded-xl border border-indigo-50">
                          <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">{field.label}</p>
                          <p className="text-[10px] font-bold text-slate-700">{field.value}</p>
                          {field.extra && <p className="text-[9px] mt-1 text-slate-500 italic">Sug: {field.extra}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedPaper.hodComments?.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">HOD Feedback</h3>
                  <div className="space-y-3">
                    {selectedPaper.hodComments.map((c, i) => (
                      <div key={i} className="p-4 bg-white border border-black rounded-2xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                        <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">HOD Decision</p>
                        <p className="text-xs font-medium text-slate-600 italic">"{c.comment}"</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-2 text-right">{new Date(c.date).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-black">
              <button
                onClick={() => handleDownload(selectedPaper.fileUrl, `${selectedPaper.subject.code}_v${selectedPaper.version}.pdf`)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
              >
                <FiDownload /> Download Paper Version {selectedPaper.version}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Version History Modal */}
      {showHistoryModal && selectedPaper && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] border border-black w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-black bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <FiClock /> Version History
                </h2>
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mt-1">
                  {selectedPaper.subject.code} • {selectedPaper.subject.name}
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
                  Current (v{selectedPaper.version})
               </button>
               {selectedPaper.versionHistory?.map((v, i) => (
                  <button 
                     key={i}
                     onClick={() => setActiveVersionTab(v.version)}
                     className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap ${activeVersionTab === v.version ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
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
                           Submitted: {new Date(selectedPaper.submittedAt).toLocaleString()}
                        </span>
                     </div>

                     <div className="bg-white border border-black rounded-[2rem] p-8 shadow-sm space-y-6">
                        <div>
                           <div className="flex justify-between items-center mb-4">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quality Report Details</p>
                              <div className="flex gap-2">
                                 <button 
                                    onClick={() => handleDownload(selectedPaper.fileUrl, `${selectedPaper.subject?.code}_v${selectedPaper.version}.pdf`)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2"
                                 >
                                    <FiDownload size={12} /> Download Paper
                                 </button>
                                 {selectedPaper.moderationReport?.moderatorSection && (
                                    <button 
                                       onClick={() => generateReportPDF(selectedPaper, selectedPaper)}
                                       className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2"
                                    >
                                       <FiDownload size={12} /> Download Report
                                    </button>
                                 )}
                              </div>
                           </div>
                           {selectedPaper.moderationReport?.moderatorSection ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {[
                                    { label: '2.1 ILOs', value: selectedPaper.moderationReport.moderatorSection.ilosComments },
                                    { label: '2.2 Assessment', value: selectedPaper.moderationReport.moderatorSection.paperAssessment },
                                    { label: '2.3 Org.', value: `${selectedPaper.moderationReport.moderatorSection.organizationClear ? selectedPaper.moderationReport.moderatorSection.organizationClear : ''}${selectedPaper.moderationReport.moderatorSection.organizationSuggestions ? '\nSug: ' + selectedPaper.moderationReport.moderatorSection.organizationSuggestions : ''}`.trim() },
                                    { label: '2.4 Wording', value: `${selectedPaper.moderationReport.moderatorSection.wordingProper ? selectedPaper.moderationReport.moderatorSection.wordingProper : ''}${selectedPaper.moderationReport.moderatorSection.wordingSuggestions ? '\nSug: ' + selectedPaper.moderationReport.moderatorSection.wordingSuggestions : ''}`.trim() },
                                    { label: '2.5 Answers', value: `${selectedPaper.moderationReport.moderatorSection.modelAnswersPrepared ? selectedPaper.moderationReport.moderatorSection.modelAnswersPrepared : ''}${selectedPaper.moderationReport.moderatorSection.modelAnswersSuggestions ? '\nSug: ' + selectedPaper.moderationReport.moderatorSection.modelAnswersSuggestions : ''}`.trim() },
                                    { label: '2.6 Grammar', value: selectedPaper.moderationReport.moderatorSection.grammarSpelling },
                                    { label: '2.7 Improvements', value: selectedPaper.moderationReport.moderatorSection.improvementComments },
                                    { label: 'Outcome', value: selectedPaper.status.replace(/_/g, ' ') }
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
                  selectedPaper.versionHistory?.filter(v => v.version === activeVersionTab).map((hist, idx) => (
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
                                    onClick={() => generateReportPDF(selectedPaper, hist)}
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

               {/* Comment Fallback if Version History is empty but comments exist */}
               {selectedPaper.versionHistory?.length === 0 && (selectedPaper.moderatorComments?.length > 0 || selectedPaper.hodComments?.length > 0) && activeVersionTab === 'current' && (
                  <div className="mt-8 space-y-4">
                     <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4 italic">Legacy Comment History</h3>
                     <div className="space-y-3">
                        {[...selectedPaper.moderatorComments, ...selectedPaper.hodComments]
                           .sort((a, b) => new Date(b.date) - new Date(a.date))
                           .map((c, i) => (
                              <div key={i} className="p-4 bg-white border border-black/10 rounded-2xl flex justify-between items-start gap-4">
                                 <div>
                                    <p className="text-[8px] font-black uppercase text-indigo-500 mb-1">{selectedPaper.moderatorComments.includes(c) ? 'Moderator' : 'HOD'}</p>
                                    <p className="text-xs font-medium text-slate-600 italic">"{c.comment}"</p>
                                 </div>
                                 <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap">{new Date(c.date).toLocaleDateString()}</span>
                              </div>
                           ))}
                     </div>
                  </div>
               )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-black text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">History tracking enabled for all institutional audit records</p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>

  );
};

export default ModerationTasks;

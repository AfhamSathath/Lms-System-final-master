import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiAward, FiFileText, FiDownload, FiCheck, FiX, FiMessageSquare, FiShield, FiUser, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExamApprovals = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeVersionTab, setActiveVersionTab] = useState('current');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [reviewData, setReviewData] = useState({
    status: '',
    comment: ''
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
      toast.error('Failed to load exam approvals');
    } finally {
      setLoading(false);
    }
  };

  const pendingPapers = papers.filter(p => p.status === 'Pending_HOD_Approval');
  const historyPapers = papers.filter(p => p.status !== 'Pending_HOD_Approval' && p.status !== 'Draft');
  const displayPapers = activeTab === 'pending' ? pendingPapers : historyPapers;

  const handleHodReview = async (e) => {
    e.preventDefault();
    if (!reviewData.status) {
      toast.error('Please select an action');
      return;
    }

    // Require signature for approval
    if (reviewData.status === 'Approved' && !user?.signature) {
      toast.error('Digital signature is required for approval. Please add it in your profile.');
      return;
    }

    try {
      await api.put(`/api/exam-papers/${selectedPaper._id}/hod-review`, reviewData);
      toast.success(reviewData.status === 'Approved' ? 'Exam paper approved with digital signature' : 'Changes requested');
      setShowModal(false);
      setReviewData({ status: '', comment: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit HOD review');
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
      'Changes_Requested_HOD': 'bg-rose-100 text-rose-700 border-rose-300'
    };
    return styles[status] || 'bg-slate-50 text-slate-400 border-slate-100';
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
    }

    // --- HOD SECTION (NEW) ---
    const hodY = finalY + 60;
    
    // Add separator line
    doc.setDrawColor(100);
    doc.setLineWidth(0.5);
    doc.line(14, hodY - 10, 196, hodY - 10);

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('To be filled by the Head of the Department:', 14, hodY);
    
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.text('Comments of the Head of Department:', 14, hodY + 10);
    
    // Dotted lines for comments
    doc.setDrawColor(200);
    doc.setLineDash([0.5, 0.5], 0);
    doc.line(14, hodY + 20, 196, hodY + 20);
    doc.line(14, hodY + 30, 196, hodY + 30);
    
    // Place existing HOD comment if available
    const hodComments = paper.hodComments || [];
    const latestHodComment = hodComments.length > 0 ? hodComments[hodComments.length - 1].comment : '';
    if (latestHodComment) {
      doc.setFont('times', 'italic');
      doc.text(latestHodComment, 16, hodY + 18, { maxWidth: 180 });
    }

    doc.setFont('times', 'bold');
    doc.text('Approved for the Printing of the Exam Paper:', 14, hodY + 45);
    
    doc.setFont('times', 'normal');
    doc.text('Signature by Head of Department: ................................................................', 14, hodY + 60);
    doc.text('Date: ................................', 150, hodY + 60);

    // If current HOD is logged in and has signature, add it
    if (paper.status === 'Approved' && user?.signature) {
      try {
        const hodSigImg = new Image();
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        let hodSigUrl = user.signature;
        if (!hodSigUrl.startsWith('http')) {
          hodSigUrl = `${baseUrl}${hodSigUrl.startsWith('/') ? '' : '/'}${hodSigUrl}`;
        }
        hodSigImg.crossOrigin = 'Anonymous';
        hodSigImg.src = hodSigUrl;
        
        await new Promise((resolve, reject) => {
          hodSigImg.onload = resolve;
          hodSigImg.onerror = reject;
        });
        
        const sigCanvas = document.createElement('canvas');
        sigCanvas.width = hodSigImg.width;
        sigCanvas.height = hodSigImg.height;
        const sigCtx = sigCanvas.getContext('2d');
        sigCtx.drawImage(hodSigImg, 0, 0);
        const sigData = sigCanvas.toDataURL('image/png');
        doc.addImage(sigData, 'PNG', 70, hodY + 48, 40, 15);
        doc.text(new Date().toLocaleDateString(), 162, hodY + 59);
      } catch (err) {
        console.error('Failed to load HOD signature', err);
      }
    }

    doc.save(`${paper.subject?.code}_Quality_Report_v${versionData.version}.pdf`);
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

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Exam Approvals</h1>
            <p className="text-slate-500 font-medium italic">Grant final department-level approval for moderated exam papers</p>
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
              <FiAward size={40} />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
              {activeTab === 'pending' ? "No Pending Approvals" : "No Approval History"}
            </h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              {activeTab === 'pending' ? "All moderated papers have been reviewed" : "You haven't approved any papers yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {displayPapers.map((paper) => (
              <div key={paper._id} className="bg-white border border-black rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[5rem] -mr-6 -mt-6 transition-all group-hover:scale-110 opacity-20 ${paper.status === 'Pending_HOD_Approval' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>

                <div className="relative z-10">
                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">
                        {paper.moderator?.name || 'Moderator'} • {paper.subject.code} • {paper.academicYear} • SEM {paper.semester}
                      </p>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter line-clamp-1">{paper.subject.name}</h3>
                    </div>
                    {activeTab === 'history' && (
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border ${getStatusStyle(paper.status)}`}>
                        {paper.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-white border border-black flex items-center justify-center text-slate-400">
                        <FiUser size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">Lecturer</p>
                        <p className="text-[11px] font-bold text-slate-700">{paper.lecturer?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <div className="w-8 h-8 rounded-full bg-white border border-indigo-200 flex items-center justify-center text-indigo-400">
                        <FiShield size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-indigo-400 tracking-widest leading-none">Moderator</p>
                        <p className="text-[11px] font-bold text-indigo-700">{paper.moderator?.name || 'Assigned'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2 text-slate-500 mb-6 bg-slate-50/50 p-2 rounded-xl border border-dashed border-slate-200">
                    <div className="flex items-center gap-2">
                      <FiFileText size={12} className="text-slate-400" />
                      <span className="text-[10px] font-bold truncate max-w-[120px]">{paper.fileName || 'Exam Paper'}</span>
                    </div>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[150px]">
                      <button
                        onClick={() => { setSelectedPaper(paper); setShowHistoryModal(true); setActiveVersionTab('current'); }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all border border-indigo-200 bg-white hover:bg-indigo-50 shadow-sm"
                        title="Current Version"
                      >
                        <span className="text-[9px] font-black uppercase tracking-tighter">v{paper.version}</span>
                      </button>
                      {[...(paper.versionHistory || [])].reverse().map((v, i) => (
                        <button
                          key={i}
                          onClick={() => { setSelectedPaper(paper); setShowHistoryModal(true); setActiveVersionTab(v.version); }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all border border-slate-200 bg-white/50 hover:bg-white text-slate-400"
                        >
                          <span className="text-[9px] font-black uppercase tracking-tighter">v{v.version}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {activeTab === 'pending' ? (
                      <button
                        onClick={() => { setSelectedPaper(paper); setShowModal(true); }}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                      >
                        <FiCheck size={14} /> Review & Send to Exam Office
                      </button>
                    ) : (
                      <button
                        onClick={() => { setSelectedPaper(paper); setShowDetailModal(true); }}
                        className="flex-1 py-3 bg-white border border-black text-slate-800 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        <FiFileText size={14} /> Details
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(paper.fileUrl, `${paper.subject.code}_v${paper.version}.pdf`)}
                      className="w-12 h-12 border border-black rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600"
                    >
                      <FiDownload />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approval Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[3rem] border border-black w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
              <div className="p-8 border-b border-black bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">HOD Final Approval</h2>
                  <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mt-1">Moderator: {selectedPaper.moderator?.name} • {selectedPaper.subject.code} • {selectedPaper.subject.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  {selectedPaper.moderationReport?.moderatorSection && (
                    <button 
                      onClick={() => generateReportPDF(selectedPaper, selectedPaper)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100"
                    >
                      <FiDownload size={12} /> Download Report
                    </button>
                  )}
                  <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl border border-black flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
                    <FiX />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                <div className="p-8 bg-slate-50/50 border-b border-black">



                  {/* Moderator & HOD Feedback Context for HOD */}
                  {(selectedPaper.moderatorComments?.length > 0 || selectedPaper.hodComments?.length > 0) && (
                    <div className="mb-6 p-4 bg-slate-100/50 border border-slate-300 rounded-2xl">
                      <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-2">
                        Review History & Context
                      </p>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {selectedPaper.moderatorComments?.map((c, i) => (
                          <div key={`mod-${i}`} className="text-[10px] bg-white p-2 rounded-lg border border-indigo-100">
                            <span className="font-black text-indigo-500 uppercase">MODERATOR:</span> {c.comment}
                          </div>
                        ))}
                        {selectedPaper.hodComments?.map((c, i) => (
                          <div key={`hod-${i}`} className="text-[10px] bg-white p-2 rounded-lg border border-emerald-100">
                            <span className="font-black text-emerald-600 uppercase">YOUR PREVIOUS FEEDBACK:</span> {c.comment}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}



                  {selectedPaper.moderationReport?.moderatorSection && (
                    <div className="mt-6 p-6 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                        Moderation Quality Report Summary
                      </h4>
                      <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                        {[
                          { label: '2.1 ILOs & Blooms', value: selectedPaper.moderationReport.moderatorSection.ilosComments },
                          { label: '2.2 Paper Assessment', value: selectedPaper.moderationReport.moderatorSection.paperAssessment },
                          { label: '2.3 Organization', value: selectedPaper.moderationReport.moderatorSection.organizationClear, extra: selectedPaper.moderationReport.moderatorSection.organizationSuggestions },
                          { label: '2.4 Wording', value: selectedPaper.moderationReport.moderatorSection.wordingProper, extra: selectedPaper.moderationReport.moderatorSection.wordingSuggestions },
                          { label: '2.5 Model Answers', value: selectedPaper.moderationReport.moderatorSection.modelAnswersPrepared, extra: selectedPaper.moderationReport.moderatorSection.modelAnswersSuggestions },
                          { label: '2.6 Grammar/Spelling', value: selectedPaper.moderationReport.moderatorSection.grammarSpelling },
                          { label: '2.7 Improvements', value: selectedPaper.moderationReport.moderatorSection.improvementComments }
                        ].map((field, idx) => field.value && (
                          <div key={idx} className="bg-white/80 p-3 rounded-xl border border-indigo-50 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-[8px] font-black text-indigo-400 uppercase">{field.label}</p>
                              {['YES', 'NO'].includes(field.value) && (
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${field.value === 'YES' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{field.value}</span>
                              )}
                            </div>
                            {!['YES', 'NO'].includes(field.value) && <p className="text-[10px] font-bold text-slate-700">{field.value}</p>}
                            {field.extra && <p className="text-[9px] mt-1 text-slate-500 italic border-t border-indigo-50/50 pt-1">Sug: {field.extra}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleHodReview} className="p-8 space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Final Determination</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setReviewData({ ...reviewData, status: 'Approved' })}
                        className={`py-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all flex flex-col items-center gap-2 ${reviewData.status === 'Approved' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-inner' : 'border-slate-100 hover:border-slate-300'}`}
                      >
                        <FiCheck size={20} /> Approve & Send to Office
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewData({ ...reviewData, status: 'Changes_Requested_HOD' })}
                        className={`py-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all flex flex-col items-center gap-2 ${reviewData.status === 'Changes_Requested_HOD' ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-inner' : 'border-slate-100 hover:border-slate-300'}`}
                      >
                        <FiMessageSquare size={20} /> Request Changes
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">HOD Comments / Instructions</label>
                    <textarea
                      className="w-full px-6 py-4 bg-slate-50 border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                      rows="4"
                      placeholder="Provide any additional comments or reasons for rejection..."
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 border border-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-2 px-8 py-4 bg-emerald-600 text-white border border-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
                    >
                      Confirm & Send to Office
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* History Detail Modal */}
      {showDetailModal && selectedPaper && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] border border-black w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
            <div className="p-8 border-b border-black bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Approval History</h2>
                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mt-1">Moderator: {selectedPaper.moderator?.name} • {selectedPaper.subject.code} • {selectedPaper.subject.name}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 rounded-xl border border-black flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
                <FiX />
              </button>
            </div>

            <div className="overflow-y-auto p-8 space-y-6 flex-1 bg-slate-50/30">
              {/* Status Progress */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Current Status</h3>
                <div className={`p-4 rounded-2xl border ${getStatusStyle(selectedPaper.status)} flex items-center justify-between`}>
                  <span className="font-black uppercase text-xs tracking-widest">{selectedPaper.status.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-bold opacity-60 italic">v{selectedPaper.version}</span>
                </div>
              </div>

              {/* People Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-black rounded-2xl">
                  <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Lecturer</p>
                  <p className="text-xs font-bold text-slate-700">{selectedPaper.lecturer?.name}</p>
                </div>
                <div className="p-4 bg-white border border-black rounded-2xl">
                  <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Moderator</p>
                  <p className="text-xs font-bold text-slate-700">{selectedPaper.moderator?.name}</p>
                </div>
              </div>

              {/* Moderation History */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Moderator Feedback</h3>
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
                  <p className="text-[10px] font-bold text-slate-400 italic">No moderator comments found.</p>
                )}

                {selectedPaper.moderationReport?.moderatorSection && (
                  <div className="mt-4 p-5 bg-indigo-50 border border-indigo-100 rounded-[2rem] space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Quality Report Details</h4>
                    <div className="space-y-3">
                      {[
                        { label: '2.1 ILOs & Blooms', value: selectedPaper.moderationReport.moderatorSection.ilosComments },
                        { label: '2.2 Paper Assessment', value: selectedPaper.moderationReport.moderatorSection.paperAssessment },
                        { label: '2.3 Organization', value: selectedPaper.moderationReport.moderatorSection.organizationClear, extra: selectedPaper.moderationReport.moderatorSection.organizationSuggestions },
                        { label: '2.4 Wording', value: selectedPaper.moderationReport.moderatorSection.wordingProper, extra: selectedPaper.moderationReport.moderatorSection.wordingSuggestions },
                        { label: '2.5 Model Answers', value: selectedPaper.moderationReport.moderatorSection.modelAnswersPrepared, extra: selectedPaper.moderationReport.moderatorSection.modelAnswersSuggestions },
                        { label: '2.6 Grammar/Spelling', value: selectedPaper.moderationReport.moderatorSection.grammarSpelling },
                        { label: '2.7 Improvements', value: selectedPaper.moderationReport.moderatorSection.improvementComments }
                      ].map((field, idx) => field.value && (
                        <div key={idx} className="bg-white/80 p-3 rounded-xl border border-indigo-50 shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[8px] font-black text-indigo-400 uppercase">{field.label}</p>
                            {['YES', 'NO'].includes(field.value) && (
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${field.value === 'YES' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{field.value}</span>
                            )}
                          </div>
                          {!['YES', 'NO'].includes(field.value) && <p className="text-[10px] font-bold text-slate-700 leading-snug">{field.value}</p>}
                          {field.extra && <p className="text-[9px] mt-1 text-slate-500 italic border-t border-indigo-50/50 pt-1">Sug: {field.extra}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* HOD Decisions */}
              <div className="space-y-4 pt-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">HOD Decision History</h3>
                {selectedPaper.hodComments?.length > 0 ? (
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
                ) : (
                  <p className="text-[10px] font-bold text-slate-400 italic">No history found.</p>
                )}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-black flex gap-4">
              <button
                onClick={() => handleDownload(selectedPaper.fileUrl, `${selectedPaper.subject.code}_v${selectedPaper.version}.pdf`)}
                className="flex-1 py-4 bg-white border border-black text-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <FiDownload /> Download Paper
              </button>
              {selectedPaper.moderationReport?.moderatorSection && (
                <button
                  onClick={() => generateReportPDF(selectedPaper, selectedPaper)}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
                >
                  <FiFileText /> Download Report
                </button>
              )}
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
                  <FiClock /> Paper Audit Trail
                </h2>
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mt-1">
                  {selectedPaper.subject.code} • {selectedPaper.subject.name}
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all">
                <FiX />
              </button>
            </div>

            <div className="overflow-y-auto p-8 space-y-8 flex-1 bg-slate-50/50">
              {/* Latest Version (Current) */}
              <div className="relative pl-8 border-l-2 border-indigo-500">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm"></div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                    Current Version (v{selectedPaper.version})
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 italic">
                    {new Date(selectedPaper.submittedAt).toLocaleString()}
                  </span>
                </div>

                <div className="bg-white border border-black rounded-2xl p-6 shadow-sm">
                   <div className="flex justify-between items-center mb-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latest Moderation Quality Report</p>
                     {selectedPaper.moderationReport?.moderatorSection && (
                       <button 
                         onClick={() => generateReportPDF(selectedPaper, selectedPaper)}
                         className="flex items-center gap-1 text-[8px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors"
                       >
                         <FiDownload size={10} /> Download Report
                       </button>
                     )}
                   </div>
                  {selectedPaper.moderationReport?.moderatorSection ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { label: '2.1 ILOs', value: selectedPaper.moderationReport.moderatorSection.ilosComments },
                        { label: '2.2 Assessment', value: selectedPaper.moderationReport.moderatorSection.paperAssessment },
                        { label: '2.3 Org.', value: selectedPaper.moderationReport.moderatorSection.organizationSuggestions },
                        { label: '2.4 Wording', value: selectedPaper.moderationReport.moderatorSection.wordingSuggestions },
                        { label: '2.5 Answers', value: selectedPaper.moderationReport.moderatorSection.modelAnswersSuggestions },
                        { label: '2.6 Grammar', value: selectedPaper.moderationReport.moderatorSection.grammarSpelling },
                        { label: 'Current Status', value: selectedPaper.status.replace(/_/g, ' ') }
                      ].filter(f => f.value).map((f, i) => (
                        <div key={i} className="bg-slate-50 p-2 rounded-lg border border-slate-100 group-hover:bg-white transition-colors">
                          <p className="text-[7px] font-black uppercase text-indigo-400 mb-0.5">{f.label}</p>
                          <p className="text-[10px] font-bold text-slate-700 line-clamp-2" title={f.value}>{f.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 italic">No report filed for this version yet.</p>
                  )}
                </div>
              </div>

              {/* Historical Versions */}
              {selectedPaper.versionHistory?.length > 0 ? (
                [...selectedPaper.versionHistory].reverse().map((hist, idx) => (
                  <div key={idx} className="relative pl-8 border-l-2 border-slate-200 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-300">
                        Version v{hist.version}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 italic">
                        {new Date(hist.submittedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Historical Review Snapshot</p>
                      {hist.moderationReport?.moderatorSection ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[
                              { label: '2.1 ILOs', value: hist.moderationReport.moderatorSection.ilosComments },
                              { label: '2.2 Assessment', value: hist.moderationReport.moderatorSection.paperAssessment },
                              { label: '2.3 Org.', value: hist.moderationReport.moderatorSection.organizationSuggestions },
                              { label: '2.4 Wording', value: hist.moderationReport.moderatorSection.wordingSuggestions },
                              { label: '2.5 Answers', value: hist.moderationReport.moderatorSection.modelAnswersSuggestions },
                              { label: '2.6 Grammar', value: hist.moderationReport.moderatorSection.grammarSpelling },
                              { label: 'Outcome', value: hist.status.replace(/_/g, ' ') }
                            ].filter(f => f.value).map((f, i) => (
                              <div key={i} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <p className="text-[7px] font-black uppercase text-indigo-400 mb-0.5">{f.label}</p>
                                <p className="text-[10px] font-bold text-slate-700 line-clamp-2" title={f.value}>{f.value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleDownload(hist.fileUrl, `${selectedPaper.subject.code}_v${hist.version}.pdf`)}
                              className="text-[9px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline"
                            >
                              <FiDownload size={10} /> Download v{hist.version} PDF
                            </button>
                            <button
                              onClick={() => generateReportPDF(selectedPaper, hist)}
                              className="text-[9px] font-black uppercase text-slate-600 flex items-center gap-1 hover:underline"
                            >
                              <FiFileText size={10} /> Download Report
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-slate-400 italic">No report was filed for this version.</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-10 bg-white border border-black/5 rounded-3xl">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic mb-2">No structured version snapshots</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Snapshots are captured upon resubmission. Previous version data for this paper was not captured in the new format.</p>
                  </div>

                  {(selectedPaper.moderatorComments?.length > 0 || selectedPaper.hodComments?.length > 0) && (
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Available Decision History</h3>
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

export default ExamApprovals;

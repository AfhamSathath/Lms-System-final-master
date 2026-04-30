import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiFileText, FiDownload, FiCheck, FiX, FiShield, FiUser, FiInfo, FiClock, FiArchive, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ExamTasks = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
      toast.error('Failed to load exam papers');
    } finally {
      setLoading(false);
    }
  };

  const pendingPapers = papers.filter(p => p.status === 'Pending_Exam_Officer');
  const historyPapers = papers.filter(p => p.status === 'Accepted_By_Exam_Officer');
  const displayPapers = activeTab === 'pending' ? pendingPapers : historyPapers;

  const handleAccept = async (id) => {
    try {
      await api.put(`/api/exam-papers/${id}/exam-officer-accept`);
      toast.success('Exam paper accepted for final processing');
      fetchData();
    } catch (error) {
      toast.error('Failed to accept paper');
    }
  };

  const handleDownload = async (fileUrl, fileName) => {
    if (!fileUrl) return;
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const normalizedPath = fileUrl.replace(/\\/g, '/');
      const cleanUrl = normalizedPath.replace(/^.*\/uploads\//i, '/uploads/');
      const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
      
      const response = await api.get(fullUrl, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'exam-paper.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <FiArchive className="text-indigo-600" /> Exam Submissions
            </h1>
            <p className="text-slate-500 font-medium italic">Final acceptance and archiving of HOD-approved exam papers</p>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl border border-black shadow-sm">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'pending' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Ready ({pendingPapers.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Archived ({historyPapers.length})
            </button>
          </div>
        </div>

        {displayPapers.length === 0 ? (
          <div className="bg-white border border-black rounded-[2.5rem] p-20 text-center shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FiFileText size={40} />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
              {activeTab === 'pending' ? "No Papers Awaiting Acceptance" : "No Archived Papers"}
            </h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              {activeTab === 'pending' ? "All approved papers have been processed" : "Start accepting papers to see them here"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {displayPapers.map((paper) => (
              <div key={paper._id} className="bg-white border border-black rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[5rem] -mr-6 -mt-6 transition-all group-hover:scale-110 opacity-20 ${paper.status === 'Pending_Exam_Officer' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                
                <div className="relative z-10">
                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">
                        {paper.subject.code} • {paper.academicYear} • SEM {paper.semester}
                      </p>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter line-clamp-1">{paper.subject.name}</h3>
                    </div>
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
                        <p className="text-[8px] font-black uppercase text-indigo-400 tracking-widest leading-none">HOD Approved</p>
                        <p className="text-[11px] font-bold text-indigo-700">Ready for Archive</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {activeTab === 'pending' ? (
                      <button 
                        onClick={() => handleAccept(paper._id)}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                      >
                        <FiCheck /> Final Accept
                      </button>
                    ) : (
                      <div className="flex-1 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-emerald-100">
                        <FiCheck /> Accepted
                      </div>
                    )}
                    <button 
                      onClick={() => handleDownload(paper.fileUrl, `${paper.subject.code}_final.pdf`)}
                      className="w-12 h-12 border border-black rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600"
                    >
                      <FiDownload />
                    </button>
                    <button 
                      onClick={() => { setSelectedPaper(paper); setShowDetailModal(true); }}
                      className="w-12 h-12 border border-black rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600"
                    >
                      <FiInfo />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedPaper && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[3rem] border border-black w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
              <div className="p-8 border-b border-black bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Paper Submission Detail</h2>
                  <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mt-1">{selectedPaper.subject.code} • {selectedPaper.subject.name}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 rounded-xl border border-black flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
                  <FiX />
                </button>
              </div>

              <div className="overflow-y-auto p-8 space-y-6 flex-1 bg-slate-50/30">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-black rounded-2xl shadow-sm">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Status</p>
                    <p className="text-[10px] font-black text-indigo-600 uppercase">{selectedPaper.status.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="p-4 bg-white border border-black rounded-2xl shadow-sm">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Version</p>
                    <p className="text-[10px] font-black text-slate-700 uppercase">v{selectedPaper.version}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <FiMessageSquare /> Review History
                  </h3>
                  <div className="space-y-3">
                    {selectedPaper.moderatorComments?.map((c, i) => (
                      <div key={`mod-${i}`} className="p-4 bg-white border border-black rounded-2xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                        <p className="text-[10px] font-black uppercase text-indigo-500 mb-1">Moderator</p>
                        <p className="text-xs font-medium text-slate-600 italic">"{c.comment}"</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-2 text-right">{new Date(c.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {selectedPaper.hodComments?.map((c, i) => (
                      <div key={`hod-${i}`} className="p-4 bg-white border border-black rounded-2xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                        <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">HOD Decision</p>
                        <p className="text-xs font-medium text-slate-600 italic">"{c.comment}"</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-2 text-right">{new Date(c.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-black">
                <button
                  onClick={() => handleDownload(selectedPaper.fileUrl, `${selectedPaper.subject.code}_FINAL.pdf`)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
                >
                  <FiDownload /> Download Final Archived Version
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamTasks;

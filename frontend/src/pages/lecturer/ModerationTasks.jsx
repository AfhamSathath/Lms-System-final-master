import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheckSquare, FiFileText, FiDownload, FiMessageSquare, FiCheck, FiX, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ModerationTasks = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
      toast.error('Failed to load moderation tasks');
    } finally {
      setLoading(false);
    }
  };

  const pendingPapers = papers.filter(p => p.status === 'Pending_Moderation');
  const historyPapers = papers.filter(p => p.status !== 'Pending_Moderation');
  const displayPapers = activeTab === 'pending' ? pendingPapers : historyPapers;

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewData.status) {
      toast.error('Please select an action');
      return;
    }

    try {
      await api.put(`/api/exam-papers/${selectedPaper._id}/moderate`, reviewData);
      toast.success(reviewData.status === 'Moderated' ? 'Paper accepted' : 'Changes requested');
      setShowReviewModal(false);
      setReviewData({ status: '', comment: '' });
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
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-lg">
                        <span className="text-[9px] font-black">v{paper.version}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {activeTab === 'pending' ? (
                      <button
                        onClick={() => { setSelectedPaper(paper); setShowReviewModal(true); }}
                        className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                      >
                        <FiCheckSquare /> Review Paper
                      </button>
                    ) : (
                      <button
                        onClick={() => { setSelectedPaper(paper); setShowDetailModal(true); }}
                        className="flex-1 py-3 bg-white border border-black text-slate-800 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        <FiInfo /> View Details
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
                <div className="p-8 bg-slate-50/50 border-b border-black">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-3 bg-white border border-black rounded-2xl">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Marks</p>
                      <p className="text-sm font-black text-slate-700">{selectedPaper.totalMarks || '--'}</p>
                    </div>
                    <div className="p-3 bg-white border border-black rounded-2xl">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Duration</p>
                      <p className="text-sm font-black text-slate-700">{selectedPaper.duration || '--'}</p>
                    </div>
                    <div className="p-3 bg-white border border-black rounded-2xl">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Type</p>
                      <p className="text-sm font-black text-indigo-600">{selectedPaper.examType || 'Final'}</p>
                    </div>
                  </div>

                  {/* Previous Feedback Context */}
                  {(selectedPaper.moderatorComments?.length > 0 || selectedPaper.hodComments?.length > 0) && (
                    <div className="mb-6 p-4 bg-amber-50/50 border border-amber-200 rounded-2xl">
                      <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest mb-3 flex items-center gap-2">
                        <FiMessageSquare /> Previous Review Context
                      </p>
                      <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                        {selectedPaper.moderatorComments?.map((c, i) => (
                          <div key={`mod-${i}`} className="text-[10px] bg-white p-2 rounded-lg border border-amber-100">
                            <span className="font-black text-indigo-500 uppercase">MODERATOR:</span> {c.comment}
                          </div>
                        ))}
                        {selectedPaper.hodComments?.map((c, i) => (
                          <div key={`hod-${i}`} className="text-[10px] bg-white p-2 rounded-lg border border-emerald-100">
                            <span className="font-black text-emerald-600 uppercase">HOD:</span> {c.comment}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Paper Instructions</p>
                    <p className="text-xs font-bold text-slate-600 italic bg-white p-4 rounded-2xl border border-dashed border-slate-300">
                      {selectedPaper.instructions || 'No instructions provided.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleReview} className="p-8 space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Select Review Outcome</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setReviewData({ ...reviewData, status: 'Moderated' })}
                        className={`py-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all flex flex-col items-center gap-2 ${reviewData.status === 'Moderated' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-inner' : 'border-slate-100 hover:border-slate-300'}`}
                      >
                        <FiCheck size={20} /> Accept Paper
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewData({ ...reviewData, status: 'Changes_Requested_Moderator' })}
                        className={`py-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all flex flex-col items-center gap-2 ${reviewData.status === 'Changes_Requested_Moderator' ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-inner' : 'border-slate-100 hover:border-slate-300'}`}
                      >
                        <FiMessageSquare size={20} /> Request Changes
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Review Comments (Required if changes requested)</label>
                    <textarea
                      className="w-full px-6 py-4 bg-slate-50 border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                      rows="4"
                      placeholder="Provide specific feedback on improvements or corrections..."
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    ></textarea>
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
      </div>
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
    </div>

  );
};

export default ModerationTasks;

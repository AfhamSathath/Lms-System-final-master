import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiAward, FiFileText, FiDownload, FiCheck, FiX, FiMessageSquare, FiShield, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ExamApprovals = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showModal, setShowModal] = useState(false);
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

    try {
      await api.put(`/api/exam-papers/${selectedPaper._id}/hod-review`, reviewData);
      toast.success(reviewData.status === 'Approved' ? 'Exam paper approved' : 'Changes requested');
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
                  <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mt-1">{selectedPaper.subject.code} • {selectedPaper.subject.name}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl border border-black flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
                  <FiX />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                <div className="p-8 bg-slate-50/50 border-b border-black">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-3 bg-white border border-black rounded-2xl shadow-sm">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Marks</p>
                      <p className="text-sm font-black text-slate-700">{selectedPaper.totalMarks || '--'}</p>
                    </div>
                    <div className="p-3 bg-white border border-black rounded-2xl shadow-sm">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Duration</p>
                      <p className="text-sm font-black text-slate-700">{selectedPaper.duration || '--'}</p>
                    </div>
                    <div className="p-3 bg-white border border-black rounded-2xl shadow-sm">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Type</p>
                      <p className="text-sm font-black text-indigo-600">{selectedPaper.examType || 'Final'}</p>
                    </div>
                  </div>


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

                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Paper Instructions</p>
                    <p className="text-xs font-bold text-slate-600 italic bg-white p-4 rounded-2xl border border-dashed border-slate-300">
                      {selectedPaper.instructions || 'No instructions provided.'}
                    </p>
                  </div>
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
                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mt-1">{selectedPaper.subject.code} • {selectedPaper.subject.name}</p>
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

            <div className="p-6 bg-white border-t border-black">
              <button
                onClick={() => handleDownload(selectedPaper.fileUrl, `${selectedPaper.subject.code}_v${selectedPaper.version}.pdf`)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
              >
                <FiDownload /> Download Approved Version {selectedPaper.version}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>


  );
};

export default ExamApprovals;

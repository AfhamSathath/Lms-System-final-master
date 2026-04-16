import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiArrowLeft, FiSearch, FiBarChart2, FiBookOpen, FiUser, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const LecturerResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const subjectId = location.state?.subjectId || '';
  const subjectName = location.state?.subjectName || '';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjectId);
  const [selectedBatch, setSelectedBatch] = useState('All');

  const batches = ['2024/2025', '2023/2024', '2022/2023', '2021/2022', 'Repeat Batch (All)'];

  useEffect(() => {
    fetchResults();
  }, [selectedSubjectId]);

  const fetchResults = async () => {
    try {
      const endpoint = selectedSubjectId ? `/api/results?subjectId=${selectedSubjectId}` : '/api/results';
      const response = await api.get(endpoint);
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Error loading results:', error);
      toast.error('Unable to load results at this time');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((result) => {
    const matchesSubject = selectedSubjectId ? result.subject?._id === selectedSubjectId : true;
    const matchesBatch = selectedBatch === 'All' ? true : (result.student?.batch === selectedBatch || result.academicYear === selectedBatch);
    const matchesSearch = searchTerm
      ? result.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.subject?.code?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesSubject && matchesBatch && matchesSearch;
  });

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest mb-3 transition-colors"
          >
            <FiArrowLeft className="mr-2" /> Back to Dashboard
          </button>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Student Results</h1>
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500 mt-2">{subjectName || 'All published results for your courses'}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full sm:w-auto">
          <div className="bg-white rounded-3xl p-4 shadow-lg border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Published results</p>
            <p className="text-3xl font-black text-slate-900">{filteredResults.length}</p>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-lg border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subjects covered</p>
            <p className="text-3xl font-black text-slate-900">{new Set(filteredResults.map(r => r.subject?._id)).size}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Results Ledger</h2>
              <p className="text-sm text-slate-500">Review student scorecards and published outcomes</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search student, subject, or code"
                  className="w-full md:w-[260px] pl-12 pr-4 py-3 rounded-3xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full sm:w-[180px] rounded-3xl border border-slate-200 px-6 py-3 bg-white text-slate-700 font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all appearance-none"
              >
                <option value="All">All Batches</option>
                {batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-[0.28em] text-slate-400">
                <tr>
                  <th className="px-6 py-5">Student</th>
                  <th className="px-6 py-5">Subject</th>
                  <th className="px-6 py-5">Exam Type</th>
                  <th className="px-6 py-5">Marks</th>
                  <th className="px-6 py-5">Grade</th>
                  <th className="px-6 py-5">Year / Sem</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-slate-400">
                      No results found. Try selecting a subject or clearing the search.
                    </td>
                  </tr>
                ) : filteredResults.map((result) => (
                  <tr key={result._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-900">{result.student?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{result.student?.studentId}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-900">{result.subject?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{result.subject?.code}</p>
                    </td>
                    <td className="px-6 py-5 uppercase text-slate-500">{result.examType}</td>
                    <td className="px-6 py-5 font-bold text-slate-900">{result.marks ?? 'N/A'}</td>
                    <td className="px-6 py-5 font-black text-slate-900">{result.grade}</td>
                    <td className="px-6 py-5 text-sm text-slate-500">{result.year} / S{result.semester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Quick actions</h3>
            <button
              onClick={() => navigate('/lecturer/dashboard')}
              className="w-full text-left bg-slate-900 text-white py-4 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors flex items-center justify-between gap-3"
            >
              <span>Back to dashboard</span>
              <FiChevronRight />
            </button>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] p-8 text-white shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white/10 p-3 rounded-2xl">
                <FiBookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] opacity-80">Current focus</p>
                <p className="text-xl font-black">Result Validation</p>
              </div>
            </div>
            <p className="text-sm leading-7 text-white/80">
              Use this page to review all grades published for your students, confirm correctness, and spot any failing performance before final submission.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Subject filter</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
            <label className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black">Selected Subject</label>
            <div className="mt-3 text-slate-900 text-base font-semibold">{subjectName || 'All subjects'}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 p-5">
            <label className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black">Results loaded</label>
            <div className="mt-3 text-slate-900 text-base font-semibold">{results.length}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
            <label className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black">Search term</label>
            <div className="mt-3 text-slate-900 text-base font-semibold">{searchTerm || 'None'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerResults;

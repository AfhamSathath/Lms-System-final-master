import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiArrowLeft, FiSearch, FiBarChart2, FiBookOpen, FiUser, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const HodResults = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentResults, setStudentResults] = useState({});
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, [user.department]);

  useEffect(() => {
    fetchResults();
  }, [selectedSubjectId]);

  const fetchStudentResults = async (student) => {
    if (!student?._id) return;
    setStudentError('');
    setStudentLoading(true);
    try {
      const response = await api.get(`/api/results/student/${student._id}`);
      setSelectedStudent(student);
      setStudentResults(response.data.results || {});
    } catch (error) {
      console.error('Failed to load student detail results:', error);
      setStudentError('Unable to load student results.');
    } finally {
      setStudentLoading(false);
    }
  };

  const getStudentCards = (resultsData) => {
    const studentsMap = new Map();
    resultsData.forEach((result) => {
      if (result.student?._id) {
        studentsMap.set(result.student._id, result.student);
      }
    });
    return Array.from(studentsMap.values());
  };

  const getBatches = () => {
    return ['2024/2025', '2023/2024', '2022/2023', '2021/2022', 'Repeat Batch (All)'];
  };

  const calculateOverallGPA = (groupedResults) => {
    const semesters = Object.values(groupedResults);
    const totalCredits = semesters.reduce((sum, sem) => sum + (sem.totalCredits || 0), 0);
    const totalGradePoints = semesters.reduce((sum, sem) => sum + (sem.totalGradePoints || 0), 0);
    return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';
  };

  const getSemesterRows = () => {
    return Object.values(studentResults)
      .sort((a, b) => {
        if (a.year === b.year) return a.semester - b.semester;
        return a.year.localeCompare(b.year, undefined, { numeric: true });
      });
  };

  const getSelectedStudentName = () => selectedStudent?.name || 'Select a student';

  const fetchSubjects = async () => {
    if (!user?.department) return;
    try {
      const res = await api.get(`/api/departments/${encodeURIComponent(user.department)}/courses`);
      setSubjects(res.data.courses || []);
    } catch (error) {
      console.error('Failed to load HOD subjects:', error);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const endpoint = selectedSubjectId ? `/api/results?subjectId=${selectedSubjectId}` : '/api/results';
      const response = await api.get(endpoint);
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Failed to load HOD results:', error);
      toast.error('Unable to load results at this time');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((result) => {
    const matchesSearch = searchTerm
      ? result.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.subject?.code?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesBatch = selectedBatch 
      ? result.year === selectedBatch || result.academicYear === selectedBatch // Try both
      : true;

    return matchesSearch && matchesBatch;
  });

  const studentCards = getStudentCards(filteredResults);
  const filteredStudentCards = studentCards.filter((student) => {
    const matchesSearch = !searchTerm || (
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return matchesSearch;
  });

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <button
            onClick={() => navigate('/hod/subjects')}
            className="flex items-center text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest mb-3 transition-colors"
          >
            <FiArrowLeft className="mr-2" /> Back to Subjects
          </button>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Student Results</h1>
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500 mt-2">Review published results for your department students</p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full sm:w-auto">
          <div className="bg-white rounded-3xl p-4 shadow-lg border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Published results</p>
            <p className="text-3xl font-black text-slate-900">{filteredResults.length}</p>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-lg border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subjects in dept.</p>
            <p className="text-3xl font-black text-slate-900">{subjects.length}</p>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-lg border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Students with results</p>
            <p className="text-3xl font-black text-slate-900">{studentCards.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Results Ledger</h2>
              <p className="text-sm text-slate-500">Filter by student or subject to view departmental results.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 w-full sm:w-auto">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search student, subject, or code"
                  className="w-full md:w-[320px] pl-12 pr-4 py-3 rounded-3xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>
              <div>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full md:w-[320px] rounded-3xl border border-slate-200 px-4 py-3 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                >
                  <option value="">All subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.code ? `${subject.code} - ${subject.name}` : subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full md:w-[320px] rounded-3xl border border-slate-200 px-4 py-3 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                >
                  <option value="">All Batches</option>
                  {getBatches().map((batch) => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>
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
                      No results found. Adjust subject filter or search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((result) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Quick actions</h3>
            <button
              onClick={() => navigate('/hod/subjects')}
              className="w-full text-left bg-slate-900 text-white py-4 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors flex items-center justify-between gap-3"
            >
              <span>Back to subject board</span>
              <FiChevronRight />
            </button>
          </div>
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Student roster</h3>
            <p className="text-sm text-slate-500 mb-4">Click a student to load year and semester GPA details.</p>
            <div className="space-y-3">
              {filteredStudentCards.length === 0 ? (
                <div className="text-sm text-slate-400">No student cards found.</div>
              ) : (
                filteredStudentCards.map((student) => (
                  <button
                    key={student._id}
                    onClick={() => fetchStudentResults(student)}
                    className={`w-full text-left border rounded-3xl px-4 py-3 transition-colors ${selectedStudent?._id === student._id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <p className="font-semibold text-slate-900">{student.name}</p>
                    <p className="text-sm text-slate-500">{student.studentId || 'No ID available'}</p>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] p-8 text-white shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white/10 p-3 rounded-2xl">
                <FiBookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] opacity-80">Department insight</p>
                <p className="text-xl font-black">Student Performance</p>
              </div>
            </div>
            <p className="text-sm leading-7 text-white/80">
              Monitor published student results across your department, spot trends early, and jump back to course management when you need to review subject performance.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{selectedStudent ? `${selectedStudent.name} - Result Details` : 'Select a Student'}</h2>
            <p className="text-sm text-slate-500">
              {selectedStudent ? `Viewing results for ${selectedStudent.name} (${selectedStudent.studentId || 'No ID'})` : 'Choose a student from the roster to see year and semester GPA details.'}
            </p>
          </div>
          {selectedStudent && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 w-full sm:w-auto">
              <div className="rounded-3xl bg-slate-50 p-4 text-center">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Semesters</p>
                <p className="text-3xl font-black text-slate-900">{getSemesterRows().length}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-center">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Total credits</p>
                <p className="text-3xl font-black text-slate-900">{getSemesterRows().reduce((sum, sem) => sum + (sem.totalCredits || 0), 0)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-center">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Overall GPA</p>
                <p className="text-3xl font-black text-slate-900">{calculateOverallGPA(studentResults)}</p>
              </div>
            </div>
          )}
        </div>
        {selectedStudent ? (
          studentLoading ? (
            <div className="text-center py-10 text-slate-500">Loading student results...</div>
          ) : studentError ? (
            <div className="text-center py-10 text-red-500">{studentError}</div>
          ) : (
            getSemesterRows().map((sem) => (
              <div key={`${sem.year}-${sem.semester}`} className="mb-6 rounded-3xl border border-slate-200 p-6 bg-slate-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">{sem.displayName}</p>
                    <h3 className="text-xl font-bold text-slate-900">Semester GPA {sem.gpa?.toFixed(2)}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Subjects</p>
                    <p className="text-lg font-semibold text-slate-900">{sem.subjects.length}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-white text-[10px] uppercase tracking-[0.28em] text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Exam Type</th>
                        <th className="px-4 py-3">Marks</th>
                        <th className="px-4 py-3">Grade</th>
                        <th className="px-4 py-3">Credits</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {sem.subjects.map((subjectResult) => (
                        <tr key={subjectResult._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-700">{subjectResult.subject?.code || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{subjectResult.subject?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm uppercase text-slate-500">{subjectResult.examType}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{subjectResult.marks ?? 'N/A'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">{subjectResult.grade}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{subjectResult.subject?.credits || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )
        ) : (
          <div className="text-center py-10 text-slate-500">No student selected yet. Click any student card on the right to view detailed results.</div>
        )}
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Department overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
            <label className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black">Department</label>
            <div className="mt-3 text-slate-900 text-base font-semibold">{user.department || 'Not assigned'}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 p-5">
            <label className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black">Subjects loaded</label>
            <div className="mt-3 text-slate-900 text-base font-semibold">{subjects.length}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
            <label className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black">Search terms</label>
            <div className="mt-3 text-slate-900 text-base font-semibold">{searchTerm || 'None'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HodResults;

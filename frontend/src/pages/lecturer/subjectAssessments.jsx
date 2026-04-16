import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import toast from 'react-hot-toast';
import { FiClipboard, FiPlus, FiSave, FiAlertCircle, FiSend, FiUsers, FiTrash2, FiEdit2, FiCheckCircle } from 'react-icons/fi';

const SubjectAssessments = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState('All');

  // Form State
  const [showCreate, setShowCreate] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    name: 'Midterm Evaluation',
    type: 'theory',
    batch: '2024/2025',
    maxMarks: 100,
    targetGroups: ''
  });
  const [editAssessmentId, setEditAssessmentId] = useState(null);

  // Marking State
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});

  useEffect(() => {
    fetchCourseAndAssessments();
  }, [id]);

  const fetchCourseAndAssessments = async () => {
    try {
      setLoading(true);
      const courseRes = await api.get(`/api/subjects/${id}`);
      if (courseRes.data.success) setCourse(courseRes.data.subject);

      const assessRes = await api.get(`/api/assessments/course/${id}`);
      if (assessRes.data.success) setAssessments(assessRes.data.assessments);

      const enrollRes = await api.get(`/api/enrollments/course/${id}`);
      if (enrollRes.data.success && Array.isArray(enrollRes.data.enrollments)) {
        setStudents(enrollRes.data.enrollments.map(e => ({
          ...e.student,
          academicYear: e.academicYear || '',
          _id: e.student?._id || e._id // fallback if student not populated
        })).filter(s => s.name)); // Filter out invalid student entries
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = filterBatch === 'All'
    ? assessments
    : assessments.filter(a => a.batch?.toString().trim() === filterBatch.trim());

  const handleCreateOrUpdate = async () => {
    try {
      const payload = {
        ...newAssessment,
        targetGroups: typeof newAssessment.targetGroups === 'string' ? newAssessment.targetGroups.split(',').map(s => s.trim()).filter(s => s) : newAssessment.targetGroups,
        subject: id
      };

      let res;
      if (editAssessmentId) {
        res = await api.put(`/api/assessments/${editAssessmentId}`, payload);
      } else {
        res = await api.post('/api/assessments', payload);
      }

      if (res.data.success) {
        toast.success(editAssessmentId ? "Assessment Updated" : "Assessment Draft Created");
        setShowCreate(false);
        setEditAssessmentId(null);
        setNewAssessment({
          name: 'Midterm Evaluation',
          type: 'theory',
          batch: '2024/2025',
          maxMarks: 100,
          targetGroups: ''
        });
        fetchCourseAndAssessments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save assessment");
    }
  };

  const openEditPanel = (assessment) => {
    setEditAssessmentId(assessment._id);
    setNewAssessment({
      name: assessment.name,
      type: assessment.type,
      batch: assessment.batch,
      maxMarks: assessment.maxMarks,
      targetGroups: assessment.targetGroups?.join(', ') || ''
    });
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (assessmentId) => {
    if (!window.confirm("Are you sure you want to delete this draft?")) return;
    try {
      const res = await api.delete(`/api/assessments/${assessmentId}`);
      if (res.data.success) {
        toast.success("Assessment Deleted!");
        fetchCourseAndAssessments();
      }
    } catch (err) {
      toast.error("Failed to delete assessment");
    }
  };

  const openMarkingPanel = (assessment) => {
    setActiveAssessment(assessment);
    const mData = {};
    if (assessment.marks && assessment.marks.length > 0) {
      assessment.marks.forEach(m => {
        const sId = m.student?._id || m.student;
        if (sId) mData[sId] = m.mark;
      });
    } else {
      const batchStudents = (students || []).filter(s => s && s.batch === assessment.batch);
      batchStudents.forEach(s => {
        if (s && s._id) mData[s._id] = '';
      });
    }
    setMarksData(mData);
  };

  const handleSaveMarks = async () => {
    if (activeAssessment.status !== 'draft' || user.role !== 'lecturer') {
      toast.error("Marks are locked or you are not authorized to edit them.");
      return;
    }
    try {
      const invalidMarks = Object.keys(marksData).filter(studentId => {
        const mark = Number(marksData[studentId]);
        return mark > activeAssessment.maxMarks;
      });

      if (invalidMarks.length > 0) {
        toast.error(`One or more students have marks exceeding the maximum allowed (${activeAssessment.maxMarks})`);
        return;
      }

      const formattedMarks = Object.keys(marksData).map(studentId => ({
        student: studentId,
        mark: Number(marksData[studentId]) || 0
      }));

      const res = await api.put(`/api/assessments/${activeAssessment._id}/marks`, { marks: formattedMarks });
      if (res.data.success) {
        toast.success("Marks updated fully");
        setActiveAssessment(null);
        fetchCourseAndAssessments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update marks");
    }
  };

  const submitToHOD = async (assessmentId) => {
    if (!window.confirm("Submit to HOD? This locks the assessment from further edits.")) return;
    try {
      const res = await api.put(`/api/assessments/${assessmentId}/submit-hod`);
      if (res.data.success) {
        toast.success("Published for HOD Approval!");
        fetchCourseAndAssessments();
      }
    } catch (err) {
      toast.error("Publishing Failed");
    }
  };

  const approveAssessment = async (assessmentId) => {
    if (!window.confirm("Approve this assessment and publish to students?")) return;
    try {
      const res = await api.put(`/api/assessments/${assessmentId}/approve`);
      if (res.data.success) {
        toast.success("Assessment Approved and Published!");
        fetchCourseAndAssessments();
      }
    } catch (err) {
      toast.error("Approval Failed");
    }
  };

  if (loading) return <Loader fullScreen />;

  const batchFilteredStudents = students.filter(s => s && s.batch === activeAssessment?.batch);

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen pb-32">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Assessments Hub</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">{course?.courseName || 'Loading...'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="bg-white border-slate-200 rounded-lg text-xs font-bold text-slate-600 px-3 py-2 shadow-sm focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Batches</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2023/2024">2023/2024</option>
              <option value="2022/2023">2022/2023</option>
              <option value="2021/2022">2021/2022</option>
              <option value="Repeat Batch (All)">Repeat Batch (All)</option>
            </select>
          </div>
          {user.role === 'lecturer' && (
            <button
              onClick={() => {
                setShowCreate(!showCreate);
                if (!showCreate) {
                  setEditAssessmentId(null);
                  setNewAssessment({
                    name: 'Midterm Evaluation',
                    type: 'theory',
                    batch: '2024/2025',
                    maxMarks: 100,
                    targetGroups: ''
                  });
                }
              }}
              className="flex flex-row items-center justify-center p-3 px-6 rounded-xl bg-indigo-600 text-white font-bold tracking-wider text-xs uppercase shadow-lg shadow-indigo-200"
            >
              {showCreate ? 'Close Form' : <><FiPlus className="mr-2" /> Create Assessment</>}
            </button>
          )}
        </div>
      </div>

        {showCreate && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assessment Name</label>
            <select
              className="w-full border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold text-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
              value={newAssessment.name}
              onChange={e => setNewAssessment({ ...newAssessment, name: e.target.value })}
            >
              <optgroup label="Main Examinations">
                <option value="Midterm Examination">Midterm Examination</option>
                <option value="Final Examination">Final Examination</option>
                <option value="Practical Examination">Practical Examination</option>
              </optgroup>
              <optgroup label="Continuous Assessments">
                <option value="Continuous Assessment 1 (CA1)">Continuous Assessment 1 (CA1)</option>
                <option value="Continuous Assessment 2 (CA2)">Continuous Assessment 2 (CA2)</option>
                <option value="Quiz 1">Quiz 1</option>
                <option value="Quiz 2">Quiz 2</option>
                <option value="Spot Test">Spot Test</option>
              </optgroup>
              <optgroup label="Assignments & Projects">
                <option value="Individual Assignment">Individual Assignment</option>
                <option value="Group Assignment">Group Assignment</option>
                <option value="Mini Project">Mini Project</option>
                <option value="Final Project">Final Project</option>
              </optgroup>
              <optgroup label="Other Evaluations">
                <option value="Viva Voce">Viva Voce</option>
                <option value="Presentation">Presentation</option>
                <option value="Lab Report">Lab Report</option>
                <option value="Field Visit Report">Field Visit Report</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Type</label>
            <select className="w-full border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold focus:ring-indigo-500" value={newAssessment.type} onChange={e => setNewAssessment({ ...newAssessment, type: e.target.value })}>
              <option value="theory">Theory</option>
              <option value="practical">Practical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Batch Target</label>
            <select
              className="w-full border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold focus:ring-indigo-500"
              value={newAssessment.batch}
              onChange={e => setNewAssessment({ ...newAssessment, batch: e.target.value })}
            >
              <option value="2024/2025">2024/2025</option>
              <option value="2023/2024">2023/2024</option>
              <option value="2022/2023">2022/2023</option>
              <option value="2021/2022">2021/2022</option>
              <option value="Repeat Batch (All)">Repeat Batch (All)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Max Marks</label>
            <input type="number" className="w-full border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold" value={newAssessment.maxMarks} onChange={e => setNewAssessment({ ...newAssessment, maxMarks: e.target.value })} />
          </div>
          <div className="md:col-span-5 flex justify-end mt-2">
            <button onClick={handleCreateOrUpdate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg font-bold text-sm tracking-wide">
              {editAssessmentId ? 'Update Draft' : 'Publish Draft'}
            </button>
          </div>
        </div>
        )}

        {
          activeAssessment ? (
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-8">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-black text-slate-700">{activeAssessment.name} - Mark Entry (Batch: {activeAssessment.batch})</h2>
                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs uppercase">Max Marks: {activeAssessment.maxMarks}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Student ID</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Student Name</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Awarded Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {batchFilteredStudents.map(s => {
                      if (!s) return null;
                      return (
                        <tr key={s._id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-xs bg-slate-100 rounded my-2 inline-block ml-3 font-bold text-slate-600">{s.studentId}</td>
                          <td className="p-3 font-bold text-slate-700 text-sm">{s.name}</td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max={activeAssessment.maxMarks}
                              className={`border rounded-lg py-1 px-3 w-24 text-center font-black focus:ring-indigo-500 outline-none ${Number(marksData[s._id]) > activeAssessment.maxMarks
                                ? 'border-rose-500 bg-rose-50 text-rose-700 animate-pulse'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                                } ${(activeAssessment.status !== 'draft' || user.role === 'hod') ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                              value={marksData[s._id] !== undefined ? marksData[s._id] : ''}
                              onChange={e => setMarksData({ ...marksData, [s._id]: e.target.value })}
                              disabled={activeAssessment.status !== 'draft' || user.role === 'hod'}
                            />
                            {Number(marksData[s._id]) > activeAssessment.maxMarks && (
                              <p className="text-[10px] text-rose-500 font-bold mt-1 text-right">EXCEEDS MAX ({activeAssessment.maxMarks})</p>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                <button onClick={() => setActiveAssessment(null)} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button
                  onClick={handleSaveMarks}
                  className="px-8 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg flex items-center gap-2 disabled:bg-slate-300 disabled:shadow-none transition-all"
                  disabled={activeAssessment.status !== 'draft' || user.role === 'hod'}
                >
                  <FiSave /> {user.role === 'hod' ? "View Only" : activeAssessment.status === 'draft' ? "Save Marks" : "Locked (Sent to HOD)"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAssessments.map(assess => (
                <div key={assess._id} className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-black text-slate-800">{assess.name}</h3>
                      <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-lg ${assess.status === 'draft' ? 'bg-slate-100 text-slate-500' :
                        assess.status === 'pending_hod' ? 'bg-amber-100 text-amber-700' :
                          assess.status === 'approved_by_hod' ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'
                        }`}>
                        {assess.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Batch: {assess.batch} • {assess.type}</p>

                    <div className="flex items-center gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <FiUsers className="text-indigo-400" />
                      <span className="text-sm font-bold text-slate-700">Marks assigned: {assess.marks?.length || 0} / {students.length}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                    <button onClick={() => openMarkingPanel(assess)} className="flex-1 py-2 font-bold text-xs uppercase tracking-widest bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <FiClipboard /> Manage Marks
                    </button>
                    {assess.status === 'draft' && user.role === 'lecturer' && (
                      <>
                        <button onClick={() => submitToHOD(assess._id)} className="flex-1 py-2 font-bold text-xs uppercase tracking-widest bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-xl flex items-center justify-center gap-2 transition-colors">
                          <FiSend /> Publish
                        </button>
                        <button onClick={() => openEditPanel(assess)} className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-500 transition-colors rounded-xl flex items-center justify-center">
                          <FiEdit2 />
                        </button>
                        <button onClick={() => handleDelete(assess._id)} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-500 transition-colors rounded-xl flex items-center justify-center">
                          <FiTrash2 />
                        </button>
                      </>
                    )}
                    {assess.status === 'pending_hod' && user.role === 'hod' && (
                      <button onClick={() => approveAssessment(assess._id)} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
                        <FiCheckCircle className="h-4 w-4" /> Approve & Publish
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredAssessments.length === 0 && (
                <div className="col-span-1 md:col-span-2 text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-300">
                  {students.length === 0 ? (
                    <div className="flex flex-col items-center">
                      <FiUsers className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                      <p className="text-slate-500 font-bold text-lg">No Students Enrolled.</p>
                      <p className="text-slate-400 text-sm mt-2 mb-6">You must enroll students in this subject before managing assessments.</p>
                      <button
                        onClick={() => navigate('/lecturer/enrollment')}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 active:scale-95"
                      >
                        Go to Enrollment Panel
                      </button>
                    </div>
                  ) : (
                    <>
                      <FiAlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <p className="font-bold text-lg text-slate-500">No Assessments Created Yet.</p>
                      <p className="text-slate-400 text-sm mt-2 font-medium tracking-tight">Create your first evaluation to start tracking performance.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        }

      </div >


      );
};

      export default SubjectAssessments;

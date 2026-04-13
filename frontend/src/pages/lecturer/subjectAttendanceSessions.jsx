import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import toast from 'react-hot-toast';
import { FiCheckSquare, FiPlus, FiTrash2, FiSend, FiClock, FiUsers, FiCalendar, FiEdit3, FiSave, FiArrowRight, FiArrowLeft, FiChevronsRight, FiChevronsLeft } from 'react-icons/fi';

const SubjectAttendanceSessions = () => {
  const { id } = useParams(); // subject Id
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [filterBatch, setFilterBatch] = useState('All');

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '08:30 AM',
    lecturerHour: 2,
    batch: '2024/2025'
  });
  const [editSessionId, setEditSessionId] = useState(null);

  // Marking state
  const [activeSession, setActiveSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourseAndSessions();
  }, [id]);

  const fetchCourseAndSessions = async () => {
    try {
      setLoading(true);
      const courseRes = await api.get(`/api/subjects/${id}`);
      if (courseRes.data.success) {
        setCourse(courseRes.data.subject);
      }

      const sessionsRes = await api.get(`/api/attendance-sessions/course/${id}`);
      if (sessionsRes.data.success) setSessions(sessionsRes.data.sessions);

      const enrollRes = await api.get(`/api/enrollments/course/${id}`);
      if (enrollRes.data.success && Array.isArray(enrollRes.data.enrollments)) {
         setStudents(enrollRes.data.enrollments.map(e => ({
            ...e.student,
            academicYear: e.academicYear || '',
            _id: e.student?._id || e._id // fallback if student not populated
         })).filter(s => s.name)); // Filter out invalid student entries
      }
    } catch (error) {
      toast.error('Failed to load attendance session data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = filterBatch === 'All' 
    ? sessions 
    : sessions.filter(s => s.batch === filterBatch);

  const handleCreateOrUpdateSession = async () => {
    try {
      let res;
      if (editSessionId) {
        res = await api.put(`/api/attendance-sessions/${editSessionId}`, { ...newSession });
      } else {
        res = await api.post('/api/attendance-sessions', {
          ...newSession,
          subject: id
        });
      }

      if (res.data.success) {
        toast.success(editSessionId ? 'Session Updated' : 'Attendance session created successfully');
        setShowCreate(false);
        setEditSessionId(null);
        setNewSession({
          date: new Date().toISOString().split('T')[0],
          startTime: '08:30 AM',
          lecturerHour: 2,
          batch: '2024/2025'
        });
        fetchCourseAndSessions();
      }
    } catch (err) {
      toast.error('Failed to save session');
    }
  };

  const openEditSessionPanel = (session) => {
    setEditSessionId(session._id);
    setNewSession({
      date: new Date(session.date).toISOString().split('T')[0],
      startTime: session.startTime,
      lecturerHour: session.lecturerHour,
      batch: session.batch
    });
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      const res = await api.delete(`/api/attendance-sessions/${sessionId}`);
      if (res.data.success) {
        toast.success('Session deleted');
        fetchCourseAndSessions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSubmitToHOD = async (sessionId) => {
    if (!window.confirm("Publish to HOD? You cannot modify it after publishing.")) return;
    try {
      const res = await api.put(`/api/attendance-sessions/${sessionId}/submit-hod`);
      if (res.data.success) {
        toast.success('Published to HOD successfully');
        fetchCourseAndSessions();
      }
    } catch (err) {
      toast.error('Failed to submit to HOD');
    }
  };

  const openMarkingPanel = (session) => {
    setActiveSession(session);
    // Initialize data map securely
    const initData = {};
    if (session.attendanceRecords && session.attendanceRecords.length > 0) {
      session.attendanceRecords.forEach(r => {
        const sId = r.student?._id || r.student;
        if (sId) initData[sId] = r.status;
      });
    } else {
      // default mark all present
      const batchStudents = (students || []).filter(s => s && s.batch === session.batch);
      batchStudents.forEach(s => {
         if (s && s._id) initData[s._id] = initData[s._id] || 'absent'; // default to absent if not marked
      });
    }
    setAttendanceData(initData);
  };

  const toggleStatus = (studentId, status) => {
    setAttendanceData(prev => ({...prev, [studentId]: status}));
  };

  const handleSaveMarks = async () => {
    try {
      const recordsToSave = Object.keys(attendanceData).map(studentId => ({
        student: studentId,
        status: attendanceData[studentId]
      }));

      const res = await api.put(`/api/attendance-sessions/${activeSession._id}/records`, {
        attendanceRecords: recordsToSave
      });

      if (res.data.success) {
        toast.success("Attendance synced successfully via Bulk Update.");
        setActiveSession(null);
        fetchCourseAndSessions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync');
    }
  };

  if (loading) return <Loader fullScreen />;

  const batchFilteredStudents = students.filter(s => s && s.batch === activeSession?.batch);

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Manage Attendance</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">{course?.courseName || 'Loading...'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
            <select 
              value={filterBatch} 
              onChange={(e) => setFilterBatch(e.target.value)}
              className="bg-white border-slate-200 rounded-lg text-xs font-bold text-slate-600 px-3 py-2 shadow-sm focus:ring-emerald-500 outline-none"
            >
              <option value="All">All Batches</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2023/2024">2023/2024</option>
              <option value="2022/2023">2022/2023</option>
              <option value="2021/2022">2021/2022</option>
              <option value="Repeat Batch (All)">Repeat Batch (All)</option>
            </select>
          </div>
          <button 
            onClick={() => {
              setShowCreate(!showCreate);
              if (!showCreate) {
                setEditSessionId(null);
                setNewSession({
                  date: new Date().toISOString().split('T')[0],
                  startTime: '08:30 AM',
                  lecturerHour: 2,
                  batch: '2024/2025'
                });
              }
            }}
            className="flex flex-row items-center justify-center p-3 px-6 rounded-xl bg-emerald-600 text-white font-bold tracking-wider text-xs uppercase shadow-lg shadow-emerald-200"
          >
            {showCreate ? 'Close Form' : <><FiPlus className="mr-2" /> Create Session</>}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Session Date</label>
            <input type="date" className="w-full border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold" value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start Time</label>
            <input type="time" className="w-full border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold" value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lecturer Hours</label>
            <input type="number" min="1" className="w-full border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold" value={newSession.lecturerHour} onChange={e => setNewSession({...newSession, lecturerHour: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Batch Target</label>
            <select 
              className="w-full border-slate-200 rounded-lg p-2 bg-slate-50 font-semibold focus:ring-indigo-500" 
              value={newSession.batch} 
              onChange={e => setNewSession({...newSession, batch: e.target.value})}
            >
               <option value="2024/2025">2024/2025</option>
               <option value="2023/2024">2023/2024</option>
               <option value="2022/2023">2022/2023</option>
               <option value="2021/2022">2021/2022</option>
               <option value="Repeat Batch (All)">Repeat Batch (All)</option>
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end mt-2">
            <button onClick={handleCreateOrUpdateSession} className="bg-emerald-600 text-white px-8 py-2 rounded-lg font-bold text-sm">
               {editSessionId ? 'Update Session' : 'Save Form'}
            </button>
          </div>
        </div>
      )}

      {/* Marking Panel Array List Modal or View */}
      {activeSession ? (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-8">
           <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
             <h2 className="text-xl font-black text-slate-700">Marking: {new Date(activeSession.date).toDateString()} - Batch: {activeSession.batch}</h2>
             
             <div className="flex items-center gap-4">
               {/* Search Box */}
               <input 
                 type="text"
                 placeholder="Search student..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold border-0 outline-none focus:ring-2 focus:ring-emerald-500 w-64"
               />

               <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
                 <button 
                   onClick={() => {
                     if (activeSession.status !== 'draft') return;
                     const updated = { ...attendanceData };
                     batchFilteredStudents.forEach(s => { if (s && s._id) updated[s._id] = 'present'; });
                     setAttendanceData(updated);
                   }} 
                   className={`px-4 py-2 rounded-lg shadow-sm transition-colors ${activeSession.status === 'draft' ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                   disabled={activeSession.status !== 'draft'}
                 >Mark All Present</button>
                 
                 <button 
                   onClick={() => {
                     if (activeSession.status !== 'draft') return;
                     const updated = { ...attendanceData };
                     batchFilteredStudents.forEach(s => { if (s && s._id) updated[s._id] = 'absent'; });
                     setAttendanceData(updated);
                   }} 
                   className={`px-4 py-2 rounded-lg shadow-sm transition-colors ${activeSession.status === 'draft' ? 'bg-rose-50 hover:bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                   disabled={activeSession.status !== 'draft'}
                 >Reset (All Absent)</button>
               </div>
             </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {/* Left Box: Absent / Not Present */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-96 overflow-hidden">
                 <div className="bg-rose-50 p-3 border-b border-rose-100 flex justify-between items-center">
                    <h3 className="font-black text-rose-700 tracking-wide text-sm uppercase">Not Present ({batchFilteredStudents.filter(s => s && attendanceData[s._id] !== 'present').length})</h3>
                 </div>
                 <div className="overflow-y-auto p-2 flex-1 scrollbar-thin">
                    {batchFilteredStudents
                       .filter(s => s && attendanceData[s._id] !== 'present' && (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.toLowerCase().includes(searchTerm.toLowerCase())))
                       .map(s => (
                        <div 
                          key={s._id} 
                          onClick={() => {
                            if (activeSession.status === 'draft') toggleStatus(s._id, 'present');
                          }} 
                          className={`group flex justify-between items-center p-2 rounded-lg transition-colors border-b border-slate-50 last:border-0 ${activeSession.status === 'draft' ? 'hover:bg-rose-50 cursor-pointer' : 'grayscale-[0.5]'}`}
                        >
                           <div>
                             <p className="font-bold text-sm text-slate-700">{s.name}</p>
                             <p className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded inline-block mt-1">{s.studentId}</p>
                           </div>
                           {activeSession.status === 'draft' && <FiArrowRight className="text-slate-300 group-hover:text-rose-500 transition-colors" />}
                        </div>
                       ))}
                    {batchFilteredStudents.filter(s => s && attendanceData[s._id] !== 'present').length === 0 && (
                       <p className="text-center text-slate-400 text-xs font-bold mt-10 uppercase">All students marked present.</p>
                    )}
                 </div>
              </div>

              {/* Middle Action Buttons (Optional since we have click-to-move, but good for UX) */}
              <div className="flex flex-col gap-3 p-4">
                 <button 
                   onClick={() => {
                     if (activeSession.status !== 'draft') return;
                     const updated = { ...attendanceData };
                     batchFilteredStudents.filter(s => s && attendanceData[s._id] !== 'present').forEach(s => updated[s._id] = 'present');
                     setAttendanceData(updated);
                   }} 
                   className={`p-3 rounded-full transition-colors shadow-sm ${activeSession.status === 'draft' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                   disabled={activeSession.status !== 'draft'}
                   title={activeSession.status === 'draft' ? "Move All to Present" : "View Only"}
                 >
                    <FiChevronsRight size={20} />
                 </button>
                 <button 
                   onClick={() => {
                     if (activeSession.status !== 'draft') return;
                     const updated = { ...attendanceData };
                     batchFilteredStudents.filter(s => s && attendanceData[s._id] === 'present').forEach(s => updated[s._id] = 'absent');
                     setAttendanceData(updated);
                   }} 
                   className={`p-3 rounded-full transition-colors shadow-sm ${activeSession.status === 'draft' ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                   disabled={activeSession.status !== 'draft'}
                   title={activeSession.status === 'draft' ? "Move All to Absent" : "View Only"}
                 >
                    <FiChevronsLeft size={20} />
                 </button>
              </div>

              {/* Right Box: Present */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-96 overflow-hidden">
                 <div className="bg-emerald-50 p-3 border-b border-emerald-100 flex justify-between items-center">
                    <h3 className="font-black text-emerald-700 tracking-wide text-sm uppercase">Present ({batchFilteredStudents.filter(s => s && attendanceData[s._id] === 'present').length})</h3>
                 </div>
                 <div className="overflow-y-auto p-2 flex-1 scrollbar-thin">
                    {batchFilteredStudents
                       .filter(s => s && attendanceData[s._id] === 'present' && (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.toLowerCase().includes(searchTerm.toLowerCase())))
                       .map(s => (
                        <div 
                          key={s._id} 
                          onClick={() => {
                            if (activeSession.status === 'draft') toggleStatus(s._id, 'absent');
                          }} 
                          className={`group flex justify-between items-center p-2 rounded-lg transition-colors border-b border-slate-50 last:border-0 ${activeSession.status === 'draft' ? 'hover:bg-emerald-50 cursor-pointer' : 'grayscale-[0.5]'}`}
                        >
                           {activeSession.status === 'draft' && <FiArrowLeft className="text-slate-300 group-hover:text-emerald-500 transition-colors" />}
                           <div className="text-right">
                             <p className="font-bold text-sm text-slate-700">{s.name}</p>
                             <p className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded inline-block mt-1">{s.studentId}</p>
                           </div>
                        </div>
                       ))}
                    {batchFilteredStudents.filter(s => s && attendanceData[s._id] === 'present').length === 0 && (
                       <p className="text-center text-slate-400 text-xs font-bold mt-10 uppercase">No students marked present.</p>
                    )}
                 </div>
              </div>
           </div>

           <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setActiveSession(null)} className="px-6 py-3 font-bold text-slate-500 rounded-xl hover:bg-slate-100">Close View</button>
              {activeSession.status === 'draft' && (
                 <button onClick={handleSaveMarks} className="px-8 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg flex items-center gap-2">
                 <FiSave /> Bulk Save Attendance Sync
              </button>
               )}
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSessions.map(session => (
            <div key={session._id} className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><FiCalendar className="text-emerald-500" /> {new Date(session.date).toLocaleDateString()}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Batch: {session.batch}</p>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${session.status === 'draft' ? 'bg-slate-100 text-slate-500' : session.status === 'published_to_hod' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-600'}`}>
                    {session.status.replace(/_/g, ' ')}
                  </span>
               </div>
               
               <div className="flex gap-6 mb-6">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 flex items-center gap-1"><FiClock /> Start</span>
                     <span className="text-sm font-black text-slate-700">{session.startTime || '08:30 AM'}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 flex items-center gap-1"><FiClock /> Hours</span>
                     <span className="text-sm font-black text-slate-700">{session.lecturerHour || 2} Hrs</span>
                  </div>
               </div>

               <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <button onClick={() => openMarkingPanel(session)} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                     <FiEdit3 /> Manage / View Details
                  </button>
                  {session.status === 'draft' && (
                    <>
                      <button onClick={() => handleSubmitToHOD(session._id)} className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 transition-colors font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                         <FiSend /> Publish
                      </button>
                      <button onClick={() => openEditSessionPanel(session)} className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-500 transition-colors rounded-xl mx-1">
                         <FiEdit3 />
                      </button>
                      <button onClick={() => handleDeleteSession(session._id)} className="px-3 py-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-500 transition-colors rounded-xl">
                         <FiTrash2 />
                      </button>
                    </>
                  )}
               </div>
            </div>
          ))}

          {filteredSessions.length === 0 && (
            <div className="col-span-1 lg:col-span-2 text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-300">
               {students.length === 0 ? (
                 <div className="flex flex-col items-center">
                   <FiUsers className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                   <p className="text-slate-500 font-bold text-lg">No Students Enrolled.</p>
                   <p className="text-slate-400 text-sm mt-2 mb-6">You must enroll students in this subject before taking attendance.</p>
                   <button 
                     onClick={() => navigate('/lecturer/enrollment')}
                     className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 active:scale-95"
                   >
                     Go to Enrollment Panel
                   </button>
                 </div>
               ) : (
                 <>
                   <FiCheckSquare className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                   <p className="text-slate-500 font-bold text-lg">No Attendance Sessions Found.</p>
                   <p className="text-slate-400 text-sm mt-2 font-medium">Create one to start marking students.</p>
                 </>
               )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectAttendanceSessions;

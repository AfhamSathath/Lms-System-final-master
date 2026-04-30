import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiPlus, FiUser, FiBook, FiCheckCircle, FiSearch, FiX, FiShield, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ModeratorAssignments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [lecturerAssignments, setLecturerAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  const [formData, setFormData] = useState({
    lecturerId: '',
    subjectId: '',
    moderatorId: '',
    academicYear: '',
    semester: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignRes, lecturersRes, subjectsRes, lectAssignRes] = await Promise.all([
        api.get('/api/moderator-assignments/department'),
        api.get('/api/users?role=lecturer'),
        api.get('/api/subjects?isActive=true'),
        api.get(`/api/lecturer-assignments/all?department=${user.department}&limit=1000`)
      ]);

      setAssignments(assignRes.data.data || []);
      setLecturerAssignments(lectAssignRes.data.data || []);
      
      const deptLecturers = (lecturersRes.data.users || []).filter(l => 
        l.department?.toLowerCase() === user.department?.toLowerCase()
      );
      setLecturers(deptLecturers);

      const deptSubjects = (subjectsRes.data.subjects || []).filter(s => 
        s.department?.toLowerCase() === user.department?.toLowerCase()
      );
      setSubjects(deptSubjects);

    } catch (error) {
      console.error('Error fetching data', error);
      toast.error('Failed to load moderator assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (formData.lecturerId === formData.moderatorId) {
      toast.error('Lecturer and Moderator cannot be the same person');
      return;
    }

    try {
      await api.post('/api/moderator-assignments', formData);
      toast.success('Moderator assigned successfully');
      setShowModal(false);
      setFormData({
        lecturerId: '',
        subjectId: '',
        moderatorId: '',
        academicYear: '',
        semester: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Assignment failed');
    }
  };

  const filteredAssignments = assignments.filter(a => 
    a.lecturer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.moderator?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Moderator Assignments</h1>
            <p className="text-slate-500 font-medium italic">Assign moderators for final exam paper reviews in {user.department}</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
          >
            <FiPlus /> New Assignment
          </button>
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           <div className="md:col-span-3 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by lecturer, moderator or subject..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bg-white border border-black rounded-2xl p-4 flex flex-col justify-center items-center shadow-sm">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Assignments</p>
            <p className="text-2xl font-black text-indigo-600">{assignments.length}</p>
          </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAssignments.length === 0 ? (
            <div className="lg:col-span-2 bg-white border border-black rounded-[2.5rem] p-20 text-center">
              <FiShield size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest">No moderator assignments found</p>
            </div>
          ) : (
            filteredAssignments.map((a) => (
              <div key={a._id} className="bg-white border border-black rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[5rem] -mr-6 -mt-6 transition-all group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                      <FiBook size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{a.subject?.name}</h3>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{a.subject?.code} • Sem {a.semester} • {a.academicYear}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Lecturer</p>
                      <p className="font-bold text-slate-700 truncate">{a.lecturer?.name}</p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-dashed border-indigo-200">
                      <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Moderator</p>
                      <p className="font-bold text-indigo-700 truncate">{a.moderator?.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Assignment Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[3rem] border border-black w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-black bg-slate-50 flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">New Moderator Assignment</h2>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl border border-black flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleAssign} className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Filter Year</label>
                    <select 
                      className="w-full px-6 py-4 bg-slate-50 border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-xs"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                    >
                      <option value="">All Years</option>
                      {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Filter Semester</label>
                    <select 
                      className="w-full px-6 py-4 bg-slate-50 border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-xs"
                      value={filterSemester}
                      onChange={(e) => setFilterSemester(e.target.value)}
                    >
                      <option value="">All Semesters</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Lecturer (Creator)</label>
                    <select 
                      required
                      className="w-full px-6 py-4 bg-slate-50 border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                      value={formData.lecturerId}
                      onChange={(e) => {
                        setFormData({
                          ...formData, 
                          lecturerId: e.target.value,
                          subjectId: '', // Reset subject when lecturer changes
                          academicYear: '',
                          semester: ''
                        });
                      }}
                    >
                      <option value="">Choose Lecturer</option>
                      {lecturers.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Select Subject</label>
                    <select 
                      required
                      className="w-full px-6 py-4 bg-slate-50 border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                      value={formData.subjectId}
                      onChange={(e) => {
                        const selectedSub = subjects.find(s => s._id === e.target.value);
                        setFormData({
                          ...formData, 
                          subjectId: e.target.value,
                          academicYear: selectedSub?.year || '',
                          semester: selectedSub?.semester || ''
                        });
                      }}
                    >
                      <option value="">Choose a Subject</option>
                      {subjects
                        .filter(s => !filterYear || s.year === filterYear)
                        .filter(s => !filterSemester || s.semester === parseInt(filterSemester))
                        .filter(s => {
                          if (!formData.lecturerId) return true;
                          // Check if subject is assigned to the selected lecturer
                          return lecturerAssignments.some(la => 
                            (la.lecturer?._id === formData.lecturerId || la.lecturer === formData.lecturerId) && 
                            (la.subject?._id === s._id || la.subject === s._id)
                          );
                        })
                        .map(s => <option key={s._id} value={s._id}>{s.code} - {s.name}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Moderator</label>
                    <select 
                      required
                      className="w-full px-6 py-4 bg-indigo-50 border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                      value={formData.moderatorId}
                      onChange={(e) => setFormData({...formData, moderatorId: e.target.value})}
                    >
                      <option value="">Choose Moderator</option>
                      {lecturers.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Academic Year</label>
                    <input 
                      readOnly
                      className="w-full px-6 py-4 bg-slate-100 border border-black rounded-2xl font-bold text-slate-500 cursor-not-allowed"
                      value={formData.academicYear || 'Select Subject first'}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Semester</label>
                    <input 
                      readOnly
                      className="w-full px-6 py-4 bg-slate-100 border border-black rounded-2xl font-bold text-slate-500 cursor-not-allowed"
                      value={formData.semester ? `Semester ${formData.semester}` : 'Select Subject first'}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 border border-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 px-12 py-4 bg-indigo-600 text-white border border-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Create Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorAssignments;

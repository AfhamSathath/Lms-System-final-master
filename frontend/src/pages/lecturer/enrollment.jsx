import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { 
  FiUserPlus, FiUsers, FiBook, FiSearch, 
  FiCheckCircle, FiXCircle, FiPlus, FiTrash2 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const LecturerEnrollment = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [departmentStudents, setDepartmentStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterBatch, setFilterBatch] = useState('All');
  const batches = ['2024/2025', '2023/2024', '2022/2023', '2021/2022', 'Repeat Batch (All)'];
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    yearOfStudy: '',
    semester: '',
    batch: ''
  });

  useEffect(() => {
    fetchAssignedSubjects();
  }, []);

  const fetchAssignedSubjects = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/lecturer-assignments/lecturer/${user._id || user.id}`);
      setAssignedSubjects(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentData = async (assignment) => {
    setEnrolledStudents([]);
    try {
      // 1. Fetch department students
      const studentsRes = await api.get('/api/auth/users?role=student');
      const allStudents = studentsRes.data.users || [];
      const deptStudents = allStudents.filter(s => 
        (s.department || '').toLowerCase() === (assignment.department || '').toLowerCase()
      );
      setDepartmentStudents(deptStudents);

      // Year mapping from "1st Year" to 1
      const yearMap = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4 };
      const yearNum = yearMap[assignment.academicYear] || assignment.academicYear;

      // Set default filters based on assignment
      setFilters(prev => ({
        ...prev,
        semester: assignment.semester || '',
        yearOfStudy: yearNum || '' 
      }));

      // 2. Fetch enrolled students for this subject
      const enrollRes = await api.get(`/api/enrollments?course=${assignment.subject?._id || assignment.subject}`);
      setEnrolledStudents(enrollRes.data.enrollments || []);
      
    } catch (err) {
      toast.error('Failed to load enrollment data');
    }
  };

  const handleSubjectSelect = (assignment) => {
    setSelectedSubject(assignment);
    fetchEnrollmentData(assignment);
  };

  const handleEnroll = async (student) => {
    try {
      await api.post('/api/enrollments', {
        student: student._id,
        course: selectedSubject.subject._id,
        academicYear: selectedSubject.academicYear,
        semester: selectedSubject.semester,
        yearOfStudy: selectedSubject.academicYear
      });
      toast.success(`${student.name} enrolled successfully`);
      fetchEnrollmentData(selectedSubject);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const handleUnenroll = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to unenroll this student?')) return;
    try {
      await api.delete(`/api/enrollments/${enrollmentId}`);
      toast.success('Student unenrolled');
      fetchEnrollmentData(selectedSubject);
    } catch (err) {
      toast.error('Unenrollment failed');
    }
  };

  const handleAutoEnrollBatch = async () => {
    if (!window.confirm(`This will automatically enroll all active students from ${selectedSubject.department} ${selectedSubject.subject.year}. Continue?`)) return;
    
    setLoading(true);
    try {
      const res = await api.post('/api/enrollments/enroll-batch', {
        courseId: selectedSubject.subject._id,
        academicYear: selectedSubject.academicYear,
        semester: selectedSubject.semester
      });
      toast.success(res.data.message);
      fetchEnrollmentData(selectedSubject);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Automatic enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    // Mapping from "1st Year" to numerical ID
    const yearMap = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4 };
    const yearNum = yearMap[selectedSubject.academicYear] || selectedSubject.academicYear;
    
    setFilters({
      search: '',
      yearOfStudy: yearNum?.toString() || '',
      semester: selectedSubject.semester?.toString() || '',
      batch: ''
    });
    setShowAddModal(true);
  };

  const filteredEnrolled = enrolledStudents.filter(e => {
    const matchesSearch = e.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.student?.studentId?.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = filterBatch === 'All' ? true : e.student?.batch === filterBatch;
    return matchesSearch && matchesBatch;
  });

  const studentsToEnroll = departmentStudents.filter(s => {
    const matchesFilters = 
      (!filters.batch || s.batch === filters.batch) &&
      (!filters.yearOfStudy || s.yearOfStudy?.toString() === filters.yearOfStudy?.toString()) &&
      (!filters.semester || s.semester?.toString() === filters.semester?.toString()) &&
      (!filters.search || s.name?.toLowerCase().includes(filters.search.toLowerCase()) || s.studentId?.toLowerCase().includes(filters.search.toLowerCase()));
    
    return !enrolledStudents.some(e => e.student?._id === s._id) && matchesFilters;
  });

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Subject Enrollment</h1>
              <p className="text-slate-500 font-medium">Manage student access to your assigned subjects</p>
            </div>
            <div className="flex items-center gap-3">
              <FiBook className="text-4xl text-indigo-600 opacity-20" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Subjects */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-4">Your Subjects</h2>
            <div className="space-y-2">
              {assignedSubjects.length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs font-bold uppercase">
                  No subjects assigned
                </div>
              ) : (
                assignedSubjects.map((assignment) => (
                  <button
                    key={assignment._id}
                    onClick={() => handleSubjectSelect(assignment)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border-2 ${
                      selectedSubject?._id === assignment._id 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                        : 'bg-white border-transparent hover:border-indigo-100 text-slate-600 hover:bg-indigo-50/50'
                    }`}
                  >
                    <p className={`text-[10px] font-black uppercase tracking-tighter mb-1 ${selectedSubject?._id === assignment._id ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {assignment.subject.code}
                    </p>
                    <p className="font-bold leading-tight line-clamp-2">{assignment.subject.name}</p>
                    <div className="mt-3 flex items-center gap-2">
                       <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${selectedSubject?._id === assignment._id ? 'bg-indigo-500/50' : 'bg-slate-100'}`}>
                         Sem {assignment.semester}
                       </span>
                       <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${selectedSubject?._id === assignment._id ? 'bg-indigo-500/50' : 'bg-slate-100'}`}>
                         {assignment.department}
                       </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Content - Enrollments */}
          <div className="lg:col-span-3">
             {selectedSubject ? (
               <div className="space-y-6">
                  {/* Subject Header */}
                  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{selectedSubject.subject.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge label={selectedSubject.subject.code} icon={<FiBook className="text-indigo-500" />} color="indigo" />
                        <Badge label={selectedSubject.department} icon={<FiUsers className="text-slate-500" />} color="slate" />
                        <Badge label={`Sem ${selectedSubject.semester}`} color="blue" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAutoEnrollBatch}
                        className="bg-indigo-50 text-indigo-600 px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-100 transition shadow-sm active:scale-95"
                        title="Auto-enroll students by batch"
                      >
                        <FiUsers /> Auto-Enroll Batch
                      </button>
                      <button
                        onClick={handleOpenAddModal}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 active:scale-95"
                      >
                        <FiUserPlus /> Assign Student
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                       <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Enrolled Students ({filteredEnrolled.length})</h4>
                       <div className="flex gap-3">
                         <select
                           value={filterBatch}
                           onChange={(e) => setFilterBatch(e.target.value)}
                           className="px-3 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                         >
                           <option value="All">All Batches</option>
                           {batches.map(b => (
                             <option key={b} value={b}>{b}</option>
                           ))}
                         </select>
                         <div className="relative">
                           <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                           <input 
                             type="text" 
                             placeholder="Search enrolled..." 
                             className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold"
                             value={search}
                             onChange={(e) => setSearch(e.target.value)}
                           />
                         </div>
                       </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/30">
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Student Info</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Student ID</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Enrollment Date</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredEnrolled.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="px-8 py-16 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No students enrolled yet</td>
                            </tr>
                          ) : (
                            filteredEnrolled.map(e => (
                              <tr key={e._id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                                       {e.student?.name?.[0]}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-700">{e.student?.name}</p>
                                      <p className="text-[10px] text-slate-400 font-medium">{e.student?.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-5 font-mono text-sm font-bold text-slate-500">{e.student?.studentId}</td>
                                <td className="px-8 py-5 text-xs font-bold text-slate-400">{new Date(e.createdAt).toLocaleDateString()}</td>
                                <td className="px-8 py-5 text-right">
                                  <button 
                                    onClick={() => handleUnenroll(e._id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <FiTrash2 />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
               </div>
             ) : (
               <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 border-dashed p-20 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl text-indigo-600 mb-6 drop-shadow-sm">
                    <FiBook className="opacity-40" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Select a Subject</h3>
                  <p className="text-slate-400 mt-2 max-w-xs font-medium">Choose one of your assigned subjects from the list to manage student enrollments</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Assign Students to Subject"
      >
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Batch</label>
                  <select 
                    className="w-full mt-1 bg-slate-50 border-none rounded-xl py-2.5 px-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all opacity-80"
                    value={filters.batch}
                    onChange={e => setFilters({...filters, batch: e.target.value})}
                  >
                    <option value="">All Batches</option>
                    <option value="2024/2025">2024/2025</option>
                    <option value="2023/2024">2023/2024</option>
                    <option value="2022/2023">2022/2023</option>
                    <option value="2021/2022">2021/2022</option>
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Year</label>
                  <select 
                    className="w-full mt-1 bg-slate-50 border-none rounded-xl py-2.5 px-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all opacity-80"
                    value={filters.yearOfStudy}
                    onChange={e => setFilters({...filters, yearOfStudy: e.target.value})}
                  >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Semester</label>
                  <select 
                    className="w-full mt-1 bg-slate-50 border-none rounded-xl py-2.5 px-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all opacity-80"
                    value={filters.semester}
                    onChange={e => setFilters({...filters, semester: e.target.value})}
                  >
                    <option value="">All Sem</option>
                    <option value="1">Sem 1</option>
                    <option value="2">Sem 2</option>
                  </select>
               </div>
               <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Search Students</label>
                 <div className="relative mt-1 group">
                   <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                   <input 
                     type="text"
                     placeholder="Name or ID..."
                     className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all"
                     value={filters.search}
                     onChange={e => setFilters({...filters, search: e.target.value})}
                   />
                 </div>
               </div>
            </div>
           
           <div className="max-h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {studentsToEnroll.length === 0 ? (
                <p className="text-center py-10 text-slate-400 font-black uppercase text-xs">No more students available with these filters</p>
              ) : (
                studentsToEnroll.map(student => (
                  <div key={student._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-colors">
                    <div>
                       <p className="font-bold text-slate-700">{student.name}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">{student.studentId || "No ID"}</p>
                    </div>
                    <button
                      onClick={() => handleEnroll(student)}
                      className="px-4 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all transform active:scale-95 flex items-center gap-2"
                    >
                      <FiPlus /> Assign
                    </button>
                  </div>
                ))
              )}
           </div>
        </div>
      </Modal>
    </div>
  );
};

const Badge = ({ label, icon, color }) => (
  <div className={`px-4 py-1.5 bg-${color}-50 text-${color}-600 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest`}>
    {icon}
    {label}
  </div>
);

export default LecturerEnrollment;

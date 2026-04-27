import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiPlus, FiEdit2, FiTrash2, FiSearch, FiClock, FiMapPin, FiBook, FiUsers, FiFilter, FiChevronDown
} from 'react-icons/fi';

import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { useAuth } from '../../context/Authcontext';

const RegistrarTimetables = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timetables, setTimetables] = useState([]);
  const [filteredTimetables, setFilteredTimetables] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [selectedSupervisors, setSelectedSupervisors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedExamType, setSelectedExamType] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [formData, setFormData] = useState({
    subject: '', year: '', semester: '', examType: 'final',
    date: '', startTime: '', endTime: '', venue: '', department: ''
  });

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [1, 2];
  const examTypes = ['midterm', 'final', 'quiz', 'supplementary', 'special', 'practical', 'viva'];

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { filterTimetables(); }, [searchTerm, selectedYear, selectedSemester, selectedExamType, selectedDepartment, timetables]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, sRes, lRes] = await Promise.all([
        api.get('/api/timetables'), 
        api.get('/api/subjects'),
        api.get('/api/users?role=lecturer').catch(() => ({ data: { users: [] } }))
      ]);
      const uniqueDepts = [...new Set((sRes.data.subjects || []).map(s => s.department).filter(Boolean))];
      setSubjects(sRes.data.subjects || []);
      setDepartments(uniqueDepts);
      setLecturers(lRes.data.users || []);
      setTimetables(tRes.data.timetables || []);
      setFilteredTimetables(tRes.data.timetables || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Filter timetables
  const filterTimetables = () => {
    let filtered = timetables;

    // Role-based workflow visibility
    if (user?.role === 'dean') {
      filtered = filtered.filter(t => t.status && t.status !== 'draft');
    } else if (user?.role === 'hod') {
      filtered = filtered.filter(t => t.status && t.status !== 'draft' && t.status !== 'pending_dean');
    }

    if (selectedYear !== 'all') filtered = filtered.filter(t => t.year === selectedYear);
    if (selectedSemester !== 'all') filtered = filtered.filter(t => t.semester === parseInt(selectedSemester));
    if (selectedExamType !== 'all') filtered = filtered.filter(t => t.examType === selectedExamType);
    if (selectedDepartment !== 'all') filtered = filtered.filter(t => t.department === selectedDepartment);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.subject?.name?.toLowerCase().includes(term) ||
        t.subject?.code?.toLowerCase().includes(term) ||
        t.venue?.toLowerCase().includes(term)
      );
    }
    setFilteredTimetables(filtered);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put('/api/timetables/bulk-status', { timetableIds: [id], status });
      toast.success(`Status updated to ${status.replace('pending_', '').replace('_', ' ').toUpperCase()}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAssignSupervisor = async () => {
    if (!selectedTimetable || selectedSupervisors.length === 0) return toast.error('Select at least one supervisor');
    try {
      await api.put(`/api/timetables/${selectedTimetable._id}/supervisor`, { supervisorIds: selectedSupervisors });
      toast.success('Supervisors assigned successfully');
      setShowSupervisorModal(false);
      setSelectedSupervisors([]);
      fetchData();
    } catch (err) {
      toast.error('Failed to assign supervisor');
    }
  };

  // Input change
  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Autofill & lock year, semester, department on subject select
  const handleSubjectChange = e => {
    const subjectId = e.target.value;
    const subject = subjects.find(s => s._id === subjectId);
    setFormData(prev => ({
      ...prev,
      subject: subjectId,
      year: subject?.year || '',
      semester: subject?.semester || '',
      department: subject?.department || prev.department
    }));
  };

  const resetForm = () => setFormData({ subject: '', year: '', semester: '', examType: 'final', date: '', startTime: '', endTime: '', venue: '', department: '' });

  // Add timetable
  const handleAddTimetable = async e => {
    e.preventDefault();
    if (!formData.subject || !formData.year || !formData.semester || !formData.department || !formData.date || !formData.startTime || !formData.endTime || !formData.venue) {
      return toast.error("Please fill all required fields");
    }
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    if ((startH * 60 + startM) >= (endH * 60 + endM)) return toast.error('End time must be after start time');
    try {
      await api.post('/api/timetables', formData);
      toast.success('Timetable added successfully');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to add timetable');
    }
  };

  // Edit timetable
  const handleEditTimetable = async e => {
    e.preventDefault();
    if (!selectedTimetable) return toast.error('No timetable selected');
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    if ((startH * 60 + startM) >= (endH * 60 + endM)) return toast.error('End time must be after start time');
    try {
      await api.put(`/api/timetables/${selectedTimetable._id}`, formData);
      toast.success('Timetable updated successfully');
      setShowEditModal(false);
      setSelectedTimetable(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to update timetable');
    }
  };

  const handleBulkAdd = async (bulkData) => {
    try {
      setLoading(true);
      await api.post('/api/timetables/bulk', { timetables: bulkData });
      toast.success('Bulk timetables added successfully');
      setShowBulkModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Bulk add failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimetable = async id => {
    if (!window.confirm('Are you sure to delete this timetable?')) return;
    try {
      await api.delete(`/api/timetables/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  };

  const openEditModal = t => {
    setSelectedTimetable(t);
    setFormData({
      subject: t.subject?._id || '',
      year: t.year || '',
      semester: t.semester || '',
      examType: t.examType || 'final',
      date: t.date ? format(new Date(t.date), 'yyyy-MM-dd') : '',
      startTime: t.startTime || '',
      endTime: t.endTime || '',
      venue: t.venue || '',
      department: t.department || ''
    });
    setShowEditModal(true);
  };

  // Badge color for year
  const getYearColor = year => {
    switch (year) {
      case '1st Year': return 'bg-white border border-black text-slate-800';
      case '2nd Year': return 'bg-white border border-black text-slate-800';
      case '3rd Year': return 'bg-white border border-black text-slate-800';
      case '4th Year': return 'bg-white border border-black text-slate-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const canEdit = user?.role === 'exam_officer';
  const canApproveDean = user?.role === 'dean';
  const canApproveHod = user?.role === 'hod';

  // For HODs, preferably show lecturers in their department first or filter them
  const availableLecturers = user?.role === 'hod' && user?.department
    ? lecturers.filter(l => l.department === user.department)
    : lecturers;

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 transition-all duration-300">

      {/* Header */}
      <div className="bg-white border border-black rounded-2xl shadow-xl p-6 mb-8 text-slate-900 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Exam Timetables</h1>
          <p className="text-slate-500 mt-1">Manage exam schedules across 4 years • 8 semesters</p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <button onClick={() => setShowAddModal(true)} className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-white border border-black transition-colors flex items-center shadow-lg">
              <FiPlus className="mr-2" /> Add Schedule
            </button>
            <button onClick={() => setShowBulkModal(true)} className="bg-purple-800 text-white px-6 py-3 rounded-lg hover:bg-purple-900 transition-colors flex items-center shadow-lg">
               Bulk Add
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by subject, code, or venue..."
              className="w-full pl-10 pr-4 py-3 border border-black rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-black rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none">
              <option value="all">All Years</option>
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-black rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none">
              <option value="all">All Semesters</option>
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select value={selectedExamType} onChange={e => setSelectedExamType(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-black rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none">
              <option value="all">All Exam Types</option>
              {examTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-black rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => {
            setSearchTerm('');
            setSelectedYear('all');
            setSelectedSemester('all');
            setSelectedExamType('all');
            setSelectedDepartment('all');
          }} className="px-6 py-2 bg-white border border-black text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Timetable Cards */}
      {filteredTimetables.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTimetables.map(t => (
            <div key={t._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="bg-white border border-black px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{t.subject?.name}</h3>
                    <p className="text-slate-500 text-sm">{t.subject?.code}</p>
                  </div>
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 border border-black text-xs font-medium rounded-full">{t.examType}</span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center text-gray-600"><FiCalendar className="mr-2 text-purple-500" />{t.date ? format(new Date(t.date), 'MMMM dd, yyyy') : '-'}</div>
                <div className="flex items-center text-gray-600"><FiClock className="mr-2 text-green-500" />{t.startTime || '-'} - {t.endTime || '-'}</div>
                <div className="flex items-center text-gray-600"><FiMapPin className="mr-2 text-red-500" />{t.venue || '-'}</div>
                <div className="flex items-center text-gray-600"><FiBook className="mr-2 text-blue-500" /><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getYearColor(t.year)}`}>{t.year} - Semester {t.semester}</span></div>
                <div className="flex items-center text-gray-600"><FiUsers className="mr-2 text-indigo-500" />{t.department || '-'}</div>
                
                <div className="flex items-center mt-2 px-2 py-1.5 rounded-lg bg-white border border-black w-fit">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mr-2">Status:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    t.status === 'published' ? 'bg-white border border-black text-slate-800 border border-green-200' :
                    t.status === 'pending_dean' ? 'bg-white border border-black text-slate-800 border border-blue-200' :
                    t.status === 'pending_hod' ? 'bg-white border border-black text-slate-800 border border-orange-200' :
                    'bg-gray-200 text-gray-800 border border-black'
                  }`}>{t.status?.replace('_', ' ') || 'DRAFT'}</span>
                </div>

                {t.supervisors && t.supervisors.length > 0 && (
                  <div className="flex items-center mt-2 px-2 py-1 flex-wrap gap-1 border-t border-black pt-2">
                    <span className="text-xs font-bold mr-2 text-gray-500">Supervisors:</span>
                    {t.supervisors.map(sup => (
                      <span key={sup._id} className="text-xs text-slate-700 bg-white border border-black px-2 py-0.5 rounded-md border border-purple-100">{sup.name}</span>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                  {canEdit && (
                    <>
                      {(!t.status || t.status === 'draft') && (
                        <button onClick={() => handleStatusChange(t._id, 'pending_dean')} className="px-3 py-1 bg-white border border-black text-slate-700 text-xs font-bold rounded hover:bg-white border border-black transition-colors mr-auto">Send to Dean</button>
                      )}
                      <button onClick={() => openEditModal(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><FiEdit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteTimetable(t._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><FiTrash2 className="h-4 w-4" /></button>
                    </>
                  )}
                  
                  {canApproveDean && t.status === 'pending_dean' && (
                     <button onClick={() => handleStatusChange(t._id, 'pending_hod')} className="px-3 py-1.5 bg-white border border-black text-slate-700 text-xs font-bold rounded-lg hover:bg-white border border-black transition-colors shadow-sm">Approve & Send to HOD</button>
                  )}
                  
                  {canApproveHod && t.status === 'pending_hod' && (
                     <>
                       <button onClick={() => { setSelectedTimetable(t); setShowSupervisorModal(true); }} className="px-3 py-1.5 bg-white border border-black text-slate-700 text-xs font-bold rounded-lg hover:bg-white border border-black transition-colors shadow-sm mr-auto">Assign Supervisor</button>
                       <button onClick={() => handleStatusChange(t._id, 'published')} className="px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors shadow-md">Publish</button>
                     </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg">
          <FiCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No timetables found</p>
          {canEdit && (
            <button onClick={() => setShowAddModal(true)} className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">Create Your First Schedule</button>
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add Exam Schedule" size="lg">
        <TimetableForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubjectChange={handleSubjectChange}
          handleSubmit={handleAddTimetable}
          subjects={subjects}
          academicYears={academicYears}
          semesters={semesters}
          examTypes={examTypes}
          departments={departments}
          submitText="Add Schedule"
          resetForm={resetForm}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedTimetable(null); resetForm(); }} title="Edit Exam Schedule" size="lg">
        <TimetableForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubjectChange={handleSubjectChange}
          handleSubmit={handleEditTimetable}
          subjects={subjects}
          academicYears={academicYears}
          semesters={semesters}
          examTypes={examTypes}
          departments={departments}
          submitText="Update Schedule"
          resetForm={resetForm}
        />
      </Modal>

      {/* Bulk Add Modal */}
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Add Exam Schedules" size="2xl">
        <BulkTimetableForm
          subjects={subjects}
          departments={departments}
          academicYears={academicYears}
          semesters={semesters}
          onSubmit={handleBulkAdd}
          onClose={() => setShowBulkModal(false)}
        />
      </Modal>

      {/* Supervisor Modal */}
      <Modal isOpen={showSupervisorModal} onClose={() => { setShowSupervisorModal(false); setSelectedSupervisors([]); }} title="Assign Supervisor" size="lg">
        <div className="space-y-6">
          <div>
            <label className="block mb-2 font-medium text-gray-700">Select Lecturers to Supervise the Exam (Hold Ctrl/Cmd to select multiple)</label>
            <select 
              multiple 
              value={selectedSupervisors} 
              onChange={e => {
                const options = Array.from(e.target.options);
                setSelectedSupervisors(options.filter(o => o.selected).map(o => o.value));
              }} 
              className="w-full border border-black p-3 rounded-lg focus:ring-2 focus:ring-purple-500 h-40 minimal-scrollbar fade-in"
            >
              {availableLecturers.map(l => (
                <option key={l._id} value={l._id} className="py-2 px-2 hover:bg-white border border-black border-b border-gray-50">{l.name} - {l.email} ({l.department})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6 border-t pt-4">
            <button onClick={() => { setShowSupervisorModal(false); setSelectedSupervisors([]); }} className="px-6 py-2 bg-white border border-black text-gray-700 font-semibold rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleAssignSupervisor} className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 shadow-md">Confirm Assignment</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Timetable Form Component
const TimetableForm = ({ formData, handleInputChange, handleSubjectChange, handleSubmit, subjects, academicYears, semesters, examTypes, departments, submitText, resetForm }) => {
  const filteredSubjects = subjects.filter(s => {
    if (formData.year && s.year !== formData.year) return false;
    if (formData.semester && s.semester?.toString() !== formData.semester?.toString()) return false;
    if (formData.department && s.department !== formData.department) return false;
    return true;
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Year</label>
          <select name="year" value={formData.year} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500">
            <option value="">Select Year</option>
            {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Semester</label>
          <select name="semester" value={formData.semester} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500">
            <option value="">Select Semester</option>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Department</label>
          <select name="department" value={formData.department} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500">
            <option value="">Select Department</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Subject</label>
          <select name="subject" value={formData.subject} onChange={handleSubjectChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500">
            <option value="">Select Subject</option>
            {filteredSubjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
      <div>
        <label className="block mb-1 font-medium">Exam Type</label>
        <select name="examType" value={formData.examType} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500">
          {examTypes.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Venue</label>
        <input type="text" name="venue" value={formData.venue} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500" />
      </div>
      <div>
        <label className="block mb-1 font-medium">Date</label>
        <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500" />
      </div>
      <div>
        <label className="block mb-1 font-medium">Start Time</label>
        <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500" />
      </div>
      <div>
        <label className="block mb-1 font-medium">End Time</label>
        <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500" />
      </div>
    </div>
    <div className="flex justify-end space-x-2 mt-4">
      <button type="button" onClick={resetForm} className="px-6 py-2 bg-white border border-black text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Reset</button>
      <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">{submitText}</button>
    </div>
  </form>
  );
};

export default RegistrarTimetables;
// Bulk Timetable Form Component
const BulkTimetableForm = ({ subjects, departments, academicYears, semesters, onSubmit, onClose }) => {
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const filteredSubjects = subjects.filter(s => {
    if (filterYear && s.year !== filterYear) return false;
    if (filterSemester && s.semester?.toString() !== filterSemester?.toString()) return false;
    if (filterDepartment && s.department !== filterDepartment) return false;
    return true;
  });
  const [entries, setEntries] = useState([
    { subject: '', examType: 'final', department: '', date: '', startTime: '', endTime: '', venue: '' }
  ]);

  const handleAddRow = () => {
    setEntries([...entries, { subject: '', examType: 'final', department: '', date: '', startTime: '', endTime: '', venue: '' }]);
  };

  const handleRemoveRow = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
  };

  const handleChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;

    // Autofill year/sem/dept if subject changes
    if (field === 'subject') {
      const subject = subjects.find(s => s._id === value);
      if (subject) {
        newEntries[index].department = subject.department || '';
      }
    }
    setEntries(newEntries);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate
    const isValid = entries.every(e => e.subject && e.department && e.date && e.startTime && e.endTime && e.venue);
    if (!isValid) {
      return toast.error("Please fill all required fields in all rows");
    }
    onSubmit(entries);
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Global Filters for Subjects */}
      <div className="p-4 bg-white border border-black rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-700">Filter Year</label>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full border px-2 py-1 rounded text-sm focus:ring-1 focus:ring-purple-500">
            <option value="">All Years</option>
            {academicYears?.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-700">Filter Semester</label>
          <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className="w-full border px-2 py-1 rounded text-sm focus:ring-1 focus:ring-purple-500">
            <option value="">All Semesters</option>
            {semesters?.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-700">Filter Department</label>
          <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} className="w-full border px-2 py-1 rounded text-sm focus:ring-1 focus:ring-purple-500">
            <option value="">All Departments</option>
            {departments?.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {entries.map((entry, index) => (
          <div key={index} className="p-4 border rounded-xl bg-white relative group">
            <button
              type="button"
              onClick={() => handleRemoveRow(index)}
              className="absolute -right-2 -top-2 bg-white border border-black text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={entries.length === 1}
            >
              <FiTrash2 size={14} />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold mb-1">Subject</label>
                <select
                  value={entry.subject}
                  onChange={(e) => handleChange(index, 'subject', e.target.value)}
                  className="w-full border px-2 py-1 rounded text-sm focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select Subject</option>
                  {filteredSubjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) => handleChange(index, 'date', e.target.value)}
                  className="w-full border px-2 py-1 rounded text-sm focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Start Time</label>
                <input
                  type="time"
                  value={entry.startTime}
                  onChange={(e) => handleChange(index, 'startTime', e.target.value)}
                  className="w-full border px-2 py-1 rounded text-sm focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">End Time</label>
                <input
                  type="time"
                  value={entry.endTime}
                  onChange={(e) => handleChange(index, 'endTime', e.target.value)}
                  className="w-full border px-2 py-1 rounded text-sm focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold mb-1">Venue</label>
                <input
                  type="text"
                  placeholder="Venue"
                  value={entry.venue}
                  onChange={(e) => handleChange(index, 'venue', e.target.value)}
                  className="w-full border px-2 py-1 rounded text-sm focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold mb-1">Exam Type</label>
                <select
                  value={entry.examType}
                  onChange={(e) => handleChange(index, 'examType', e.target.value)}
                  className="w-full border px-2 py-1 rounded text-sm focus:ring-1 focus:ring-purple-500"
                >
                  <option value="final">Final</option>
                  <option value="midterm">Midterm</option>
                  <option value="quiz">Quiz</option>
                  <option value="practical">Practical</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">Department</label>
                <select
                  value={entry.department}
                  onChange={(e) => handleChange(index, 'department', e.target.value)}
                  className="w-full border px-2 py-1 rounded text-sm focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1 text-purple-600 font-bold text-sm hover:underline"
          >
            <FiPlus /> Add Another Entry
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white border border-black text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
            >
              Submit All Entries
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};


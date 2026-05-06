import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiPlus, FiEdit2, FiTrash2, FiSearch, FiClock, FiMapPin, FiBook, FiUsers,
  FiFilter, FiChevronDown, FiUser, FiShield, FiZap, FiCheck, FiLayers, FiAlertCircle,
  FiDownload, FiTable, FiGrid, FiSend, FiArchive
} from 'react-icons/fi';
import TimetableSummary from '../../components/common/TimetableSummary';


import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { useAuth } from '../../context/Authcontext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [viewType, setViewType] = useState('card');
  const [showSummary, setShowSummary] = useState(false);
  const [eoSignature, setEoSignature] = useState(null);

  const [formData, setFormData] = useState({
    subject: '', year: '', semester: '', examType: 'final',
    date: '', startTime: '', endTime: '', venue: '', department: '', batch: ''
  });
  const [manualBatch, setManualBatch] = useState('');
  const [selectedTimetableIds, setSelectedTimetableIds] = useState([]);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [problemText, setProblemText] = useState('');

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
  const semesters = [1, 2];
  const examTypes = ['final'];

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { filterTimetables(); }, [searchTerm, selectedYear, selectedSemester, selectedExamType, selectedDepartment, timetables]);

  // Auto-select HOD department
  useEffect(() => {
    if (user?.role === 'hod' && user?.department) {
      setSelectedDepartment(user.department);
      setFormData(prev => ({ ...prev, department: user.department }));
    }
  }, [user]);

  // Sync manualBatch with selected year
  useEffect(() => {
    if (selectedYear !== 'all') {
      setManualBatch(getBatch(selectedYear));
    }
  }, [selectedYear, timetables]);

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
      const sortedTimetables = (tRes.data.timetables || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTimetables(sortedTimetables);
      setFilteredTimetables(sortedTimetables);

      // Fetch Exam Officer Signature for preview
      const usersRes = await api.get('/api/users/role?role=exam_officer');
      if (usersRes.data.users && usersRes.data.users.length > 0) {
        setEoSignature(usersRes.data.users[0].signature);
      } else if (user?.role === 'exam_officer') {
        setEoSignature(user.signature);
      }
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

    // Role-based workflow visibility (Deans/HODs can see drafts in their dept)
    if (user?.role === 'dean') {
      // Deans see all statuses to oversee the process
    } else if (user?.role === 'hod') {
      // HODs see all statuses for their department
    }

    if (selectedYear !== 'all') filtered = filtered.filter(t => t.year === selectedYear);
    if (selectedSemester !== 'all') filtered = filtered.filter(t => t.semester?.toString() === selectedSemester.toString());
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
    // Role-based signature enforcement
    if (status === 'pending_dean' && !user?.signature) {
      toast.error('Digital signature is required to send for approval. Please add it in your profile.');
      return;
    }
    if (status === 'pending_hod' && user?.role === 'dean' && !user?.signature) {
      toast.error('Digital signature is required for Dean approval. Please add it in your profile.');
      return;
    }
    if (status === 'published' && user?.role === 'hod' && !user?.signature) {
      toast.error('Digital signature is required for publishing. Please add it in your profile.');
      return;
    }

    try {
      await api.put('/api/timetables/bulk-status', { timetableIds: [id], status });
      const successMsg = status === 'published'
        ? 'Timetable published with your digital signature'
        : `Status updated with your digital signature`;
      toast.success(successMsg);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleBulkStatusChange = async (status) => {
    // Role-based signature enforcement
    if (status === 'pending_dean' && !user?.signature) {
      toast.error('Digital signature is required to send for approval. Please add it in your profile.');
      return;
    }
    if (status === 'pending_hod' && user?.role === 'dean' && !user?.signature) {
      toast.error('Digital signature is required for Dean approval. Please add it in your profile.');
      return;
    }
    if (status === 'published' && user?.role === 'hod' && !user?.signature) {
      toast.error('Digital signature is required for publishing. Please add it in your profile.');
      return;
    }

    let targetTimetables = [];
    if (status === 'pending_dean') {
      targetTimetables = filteredTimetables.filter(t => !t.status || t.status === 'draft');
    } else if (status === 'pending_hod') {
      targetTimetables = filteredTimetables.filter(t => t.status === 'pending_dean');
    } else if (status === 'published') {
      targetTimetables = filteredTimetables.filter(t => t.status === 'pending_hod');
    }

    const targetIds = targetTimetables.map(t => t._id);

    if (targetIds.length === 0) return toast.error('No relevant timetables to send');

    try {
      setLoading(true);
      await api.put('/api/timetables/bulk-status', { timetableIds: targetIds, status });
      const successMsg = status === 'published'
        ? 'All timetables published with your digital signature'
        : `Batch successfully sent to ${status.replace('pending_', '').toUpperCase()} with signature`;
      toast.success(successMsg);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to process batch update');
    } finally {
      setLoading(false);
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

  const resetForm = () => {
    if (user?.role === 'hod') {
      // HOD can only reset batch, other fields are locked
      setFormData(prev => ({ ...prev, batch: '' }));
    } else {
      setFormData({ subject: '', year: '', semester: '', examType: 'final', date: '', startTime: '', endTime: '', venue: '', department: '', batch: '' });
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


  const handleGenerate = async (genData) => {
    try {
      const res = await api.post('/api/timetables/generate', genData);
      return res.data;
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Generation failed');
      return null;
    }
  };

  const handleSaveGenerated = async (genEntries) => {
    try {
      await api.post('/api/timetables/bulk', { timetables: genEntries });
      toast.success('Generated timetables saved successfully');
      setShowGenerateModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const handleBulkBatchUpdate = async () => {
    if (!manualBatch) return;
    if (filteredTimetables.length === 0) {
      toast.error('No timetables found in current filter');
      return;
    }

    if (!window.confirm(`Bulk Update: Are you sure you want to change the batch to "${manualBatch}" for all ${filteredTimetables.length} filtered timetables?`)) return;

    try {
      setLoading(true);
      const timetableIds = filteredTimetables.map(t => t._id);
      await api.put('/api/timetables/bulk-status', {
        timetableIds,
        batch: manualBatch
      });
      toast.success(`Successfully updated batch to ${manualBatch}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Bulk batch update failed');
    } finally {
      setLoading(false);
    }
  };

  const getFacultyName = (dept) => {
    const CS_DEPTS = ['Computer Science', 'Physical Science', 'Applied Data Science'];
    const BIZ_DEPTS = ['Languages', 'Business Management', 'Business and Management Studies', 'Languages and Communication Studies'];
    const SIDDHA_DEPTS = ['Unit of Siddha Medicine'];

    if (CS_DEPTS.includes(dept)) return 'FACULTY OF APPLIED SCIENCE';
    if (BIZ_DEPTS.includes(dept)) return 'FACULTY OF COMMUNICATION AND BUSINESS STUDIES';
    if (SIDDHA_DEPTS.includes(dept)) return 'FACULTY OF SIDDHA MEDICINE';
    return 'TRINCOMALEE CAMPUS';
  };

  const getRomanYear = (year) => {
    const map = { '1st Year': 'YEAR I', '2nd Year': 'YEAR II', '3rd Year': 'YEAR III', '4th Year': 'YEAR IV', '5th Year': 'YEAR V' };
    return map[year] || (year ? year.toString().toUpperCase() : 'ALL YEARS');
  };

  const getRomanSemester = (sem) => {
    const map = { '1': 'SEMESTER I', '2': 'SEMESTER II' };
    return map[sem?.toString()] || (sem ? `SEMESTER ${sem}` : 'ALL SEMESTERS');
  };

  const getBatch = (year) => {
    // Prefer batch from database if available in filtered results
    const firstWithBatch = filteredTimetables.find(t => t.batch && (year === 'all' || t.year === year));
    if (firstWithBatch) return firstWithBatch.batch;

    if (!year || year === 'all') return 'ALL BATCHES';
    const currentY = new Date().getFullYear();
    const yearMap = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4, '5th Year': 5 };
    const studyYear = yearMap[year] || 1;
    const batchStart = currentY - (studyYear - 1);
    return `${batchStart}/${batchStart + 1}`;
  };

  const getSubjectDisplay = (t) => {
    if (!t.subject) return '-';
    let base = `${t.subject.code} ${t.subject.name}`;
    const cat = t.subject.category;
    // Practical-natured subjects
    if (['Practical', 'Clinical', 'Project'].includes(cat) || t.subject.name.toLowerCase().includes('practical')) {
      return `${base} (P)`;
    }
    // Theory-natured subjects
    return `${base} (T)`;
  };

  const exportToPDF = async () => {
    if (filteredTimetables.length === 0) return toast.error('No data to export');

    try {
      setLoading(true);
      const response = await api.get('/api/timetables/export', {
        params: {
          department: selectedDepartment,
          year: selectedYear,
          semester: selectedSemester,
          batch: manualBatch
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Exam_Timetable_${selectedDepartment !== 'all' ? selectedDepartment : 'Campus'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Official Timetable PDF generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate official PDF');
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

  const handleSelectTimetable = (id) => {
    setSelectedTimetableIds(prev =>
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e, batchTimetables = null) => {
    if (e.target.checked) {
      const idsToAdd = batchTimetables
        ? batchTimetables.map(t => t._id)
        : filteredTimetables.map(t => t._id);
      setSelectedTimetableIds(prev => [...new Set([...prev, ...idsToAdd])]);
    } else {
      if (batchTimetables) {
        const batchIds = batchTimetables.map(t => t._id);
        setSelectedTimetableIds(prev => prev.filter(id => !batchIds.includes(id)));
      } else {
        setSelectedTimetableIds([]);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTimetableIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedTimetableIds.length} timetable entries?`)) return;

    try {
      setLoading(true);
      await api.delete('/api/timetables/bulk', { data: { timetableIds: selectedTimetableIds } });
      toast.success(`${selectedTimetableIds.length} entries deleted successfully`);
      setSelectedTimetableIds([]);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Bulk delete failed');
      setLoading(false);
    }
  };

  const handleBulkClearSupervisors = async () => {
    if (selectedTimetableIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to clear all examiners/supervisors from ${selectedTimetableIds.length} timetables?`)) return;

    try {
      setLoading(true);
      // We can reuse the bulk-status or create a new endpoint, but since we have a single assignment endpoint, 
      // we'll just loop or if we want to be efficient, we should have a bulk supervisor endpoint.
      // For now, let's just clear them by calling the supervisor endpoint for each or adding a bulk one.
      // I'll add a bulk supervisor endpoint in the backend for better performance.
      await api.put('/api/timetables/bulk-supervisors', {
        timetableIds: selectedTimetableIds,
        supervisorIds: []
      });

      toast.success(`Examiners cleared for ${selectedTimetableIds.length} timetables`);
      setSelectedTimetableIds([]);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Bulk clear failed');
      setLoading(false);
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
      department: t.department || '',
      batch: t.batch || ''
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
  const isAdminOrOfficer = user?.role === 'exam_officer';


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
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-black mr-2">
            <button
              onClick={() => setViewType('card')}
              className={`p-2 rounded-lg transition-all ${viewType === 'card' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'}`}
              title="Card View"
            >
              <FiGrid size={20} />
            </button>
            <button
              onClick={() => setViewType('table')}
              className={`p-2 rounded-lg transition-all ${viewType === 'table' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'}`}
              title="Formal Table View"
            >
              <FiTable size={20} />
            </button>
          </div>

          <button onClick={exportToPDF} className="bg-white border border-black text-slate-900 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm font-bold text-sm">
            <FiDownload /> Export PDF
          </button>

          <button
            onClick={() => setShowSummary(true)}
            className="bg-slate-900 text-white px-4 py-3 rounded-lg hover:bg-black transition-colors flex items-center gap-2 shadow-lg font-bold text-sm"
          >
            <FiArchive /> History Summary
          </button>


          <div className="flex gap-2">
            {isAdminOrOfficer && filteredTimetables.some(t => !t.status || t.status === 'draft') && (
              <button
                onClick={() => handleBulkStatusChange('pending_dean')}
                className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors flex items-center shadow-md font-black uppercase text-xs tracking-widest"
              >
                <FiSend className="mr-2" /> Send All to Dean
              </button>
            )}
            {canApproveDean && filteredTimetables.some(t => t.status === 'pending_dean') && (
              <button
                onClick={() => handleBulkStatusChange('pending_hod')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md font-black uppercase text-xs tracking-widest"
              >
                <FiSend className="mr-2" /> Approve & Send All to HOD
              </button>
            )}
            {canApproveHod && filteredTimetables.some(t => t.status === 'pending_hod') && (
              <button
                onClick={() => handleBulkStatusChange('published')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-md font-black uppercase text-xs tracking-widest"
              >
                <FiSend className="mr-2" /> Publish All Timetables
              </button>
            )}
            {isAdminOrOfficer && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-lg font-bold"
              >
                Auto Generate
              </button>
            )}
            {selectedTimetableIds.length > 0 && isAdminOrOfficer && (
              <div className="flex gap-2 animate-in slide-in-from-right duration-300">
                <button
                  onClick={handleBulkClearSupervisors}
                  className="bg-amber-600 text-white px-4 py-3 rounded-lg hover:bg-amber-700 transition-colors flex items-center shadow-lg font-bold text-xs uppercase tracking-widest"
                  title="Clear Examiners"
                >
                  <FiUsers className="mr-2" /> Clear Examiners ({selectedTimetableIds.length})
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center shadow-lg font-bold text-xs uppercase tracking-widest"
                >
                  <FiTrash2 className="mr-2" /> Bulk Delete ({selectedTimetableIds.length})
                </button>
              </div>
            )}
          </div>
        </div>
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
            <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              disabled={user?.role === 'hod'}
              className={`w-full pl-10 pr-4 py-3 border border-black rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none ${user?.role === 'hod' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            >
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <div className="flex flex-col justify-center px-4 py-1 border border-black rounded-lg bg-slate-50 h-full relative group">
              <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest leading-tight">Current Batch</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualBatch}
                  onChange={e => setManualBatch(e.target.value)}
                  className="bg-transparent text-sm font-black text-slate-900 border-none p-0 focus:ring-0 w-24"
                />
                {manualBatch !== getBatch(selectedYear) && (
                  <button
                    onClick={handleBulkBatchUpdate}
                    title="Update all filtered to this batch"
                    className="p-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all shadow-lg animate-in fade-in zoom-in duration-300"
                  >
                    <FiCheck size={12} />
                  </button>
                )}
              </div>
              <div className="absolute -top-2 -right-2 hidden group-hover:block bg-black text-white text-[8px] px-2 py-1 rounded-md z-10">Edit & Save All</div>
            </div>
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
      </div>      {/* Timetable Content */}
      {/* Result Section */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader /></div>
      ) : filteredTimetables.length > 0 ? (
        viewType === 'card' ? (
          <div className="space-y-12">
            {Object.entries(
              filteredTimetables.reduce((acc, t) => {
                const key = `${t.year} - Semester ${t.semester}${t.batch ? ` (${t.batch})` : ''}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(t);
                return acc;
              }, {})
            ).map(([batchKey, batchTimetables]) => (
              <div key={batchKey} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {isAdminOrOfficer && (
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectAll(e, batchTimetables)}
                        checked={batchTimetables.every(t => selectedTimetableIds.includes(t._id))}
                        className="w-5 h-5 rounded border-2 border-black text-purple-600 focus:ring-purple-500"
                      />
                    )}
                    <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 bg-slate-100 px-6 py-2 rounded-2xl border-l-4 border-purple-600 shadow-sm">{batchKey}</h3>
                  </div>
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{batchTimetables.length} Subjects</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {batchTimetables.map(t => (
                    <div key={t._id} className={`bg-white border border-black rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group fade-in relative ${selectedTimetableIds.includes(t._id) ? 'ring-4 ring-purple-500' : ''}`}>
                      {isAdminOrOfficer && (
                        <div className="absolute top-4 left-4 z-10">
                          <input
                            type="checkbox"
                            checked={selectedTimetableIds.includes(t._id)}
                            onChange={() => handleSelectTimetable(t._id)}
                            className="w-6 h-6 rounded-lg border-2 border-black text-purple-600 focus:ring-purple-500 cursor-pointer shadow-sm"
                          />
                        </div>
                      )}
                      {/* ... existing card content ... */}
                      <div className="p-6 border-b border-black bg-slate-50 group-hover:bg-purple-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-black text-slate-800 leading-tight">{t.subject?.name || 'Unknown Subject'}</h3>
                          <span className="bg-white border border-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">{t.examType}</span>
                        </div>
                        <p className="text-xs font-bold text-purple-600 tracking-wider">{t.subject?.code || 'N/A'}</p>
                      </div>

                      <div className="p-6 flex-1 space-y-4">
                        <div className="flex items-center text-gray-600 font-bold text-sm"><FiCalendar className="mr-3 text-purple-500" />{t.date ? format(new Date(t.date), 'MMMM dd, yyyy') : '-'}</div>
                        <div className="flex items-center text-gray-600 font-bold text-sm"><FiClock className="mr-3 text-emerald-500" />{t.startTime} - {t.endTime}</div>
                        <div className="flex items-center text-gray-600 font-bold text-sm"><FiMapPin className="mr-3 text-red-500" />{t.venue || '-'}</div>
                        <div className="flex items-center text-gray-600 font-bold text-sm"><FiUsers className="mr-3 text-indigo-500" />{t.department || '-'}</div>

                        <div className="flex items-center mt-2 px-3 py-2 rounded-xl bg-slate-50 border border-black w-fit">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-3">Status:</span>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-black ${t.status === 'published' ? 'bg-green-100 text-green-800 border-green-300' :
                            t.status === 'pending_dean' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              t.status === 'pending_hod' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                t.status === 'finished' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                  t.status === 'problem' ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' :
                                    'bg-gray-100 text-gray-800 border-gray-300'
                            }`}>{t.status?.replace('_', ' ') || 'DRAFT'}</span>
                        </div>

                        {t.status === 'problem' && t.problemComments && (
                          <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                            <span className="text-[10px] font-black uppercase text-rose-400 block mb-1">Issue Reported:</span>
                            <p className="text-xs font-bold text-rose-700 italic">"{t.problemComments}"</p>
                          </div>
                        )}

                        {t.supervisors && t.supervisors.length > 0 && (
                          <div className="flex items-center mt-2 px-3 py-2 flex-wrap gap-2 border-t border-slate-100 pt-4">
                            <span className="text-[10px] font-black uppercase text-slate-400 mr-1">Supervisors:</span>
                            {t.supervisors.map(sup => (
                              <span key={sup._id} className="text-[10px] font-bold text-slate-700 bg-white border border-black px-2 py-0.5 rounded-lg">{sup.name}</span>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                          {canEdit && (
                            <>
                              {isAdminOrOfficer && (!t.status || t.status === 'draft') && (
                                <button onClick={() => handleStatusChange(t._id, 'pending_dean')} className="px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-700 transition-all shadow-md mr-auto">Send to Dean</button>
                              )}
                              <button onClick={() => openEditModal(t)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100" title="Edit"><FiEdit2 size={16} /></button>
                              {isAdminOrOfficer && (
                                <button onClick={() => handleDeleteTimetable(t._id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100" title="Delete"><FiTrash2 size={16} /></button>
                              )}
                            </>
                          )}

                          {canApproveDean && t.status === 'pending_dean' && (
                            <div className="flex gap-2 w-full">
                              <button onClick={() => handleStatusChange(t._id, 'draft')} className="px-4 py-2 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all border border-red-200">Reject</button>
                              <button onClick={() => handleStatusChange(t._id, 'pending_hod')} className="flex-1 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-md">Approve & Send to HOD</button>
                            </div>
                          )}

                          {canApproveHod && t.status === 'pending_hod' && (
                            <div className="flex flex-col gap-3 w-full">
                              <div className="flex gap-2">
                                <button onClick={() => { setSelectedTimetable(t); setShowSupervisorModal(true); }} className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all border border-indigo-200">Assign Supervisor</button>
                                <button onClick={() => handleStatusChange(t._id, 'pending_dean')} className="px-4 py-2 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all border border-red-200">Reject to Dean</button>
                              </div>
                              <button onClick={() => handleStatusChange(t._id, 'published')} className="w-full px-4 py-3 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-700 transition-all shadow-lg">Publish Timetable</button>
                            </div>
                          )}

                          {user.role === 'hod' && t.status === 'published' && (
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => {
                                  setSelectedTimetable(t);
                                  setShowProblemModal(true);
                                }}
                                className="flex-1 px-4 py-2 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-100 transition-all border border-rose-200"
                              >
                                Report Problem
                              </button>
                              <button
                                onClick={() => handleStatusChange(t._id, 'finished')}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-md"
                              >
                                Mark Finished
                              </button>
                            </div>
                          )}

                          {isAdminOrOfficer && t.status === 'problem' && (
                            <button
                              onClick={() => handleStatusChange(t._id, 'draft')}
                              className="w-full px-4 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg"
                            >
                              Resolve & Re-draft
                            </button>
                          )}

                          {user.role === 'dean' && t.status === 'problem' && (
                            <button
                              onClick={() => handleStatusChange(t._id, 'draft')}
                              className="w-full px-4 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
                            >
                              Forward to Officer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-black rounded-3xl shadow-xl overflow-hidden p-8 md:p-12">
            <div className="text-center mb-8 border-b border-black pb-8">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Trincomalee Campus</h2>
              <h3 className="text-lg md:text-xl font-bold">Eastern University, Sri Lanka</h3>
              <p className="text-sm font-medium mt-2">{getFacultyName(selectedDepartment)}</p>
              <p className="text-sm font-black uppercase mt-1">Department of {selectedDepartment !== 'all' ? selectedDepartment : 'All Departments'}</p>
              <h4 className="text-2xl md:text-3xl font-black mt-8 border-b-2 border-black inline-block px-8">Time Table</h4>

              <div className="flex flex-col md:flex-row justify-between mt-12 text-[10px] md:text-xs font-black uppercase tracking-widest gap-4">
                <span className="text-left">Examination : {selectedYear !== 'all' ? getRomanYear(selectedYear) : 'ALL YEARS'} {selectedSemester !== 'all' ? getRomanSemester(selectedSemester) : 'ALL SEMESTERS'} - {getBatch(selectedYear)}</span>
                <span className="text-right">Venue: {[...new Set(filteredTimetables.map(t => t.venue))].join(', ')}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-black">
                <thead>
                  <tr className="bg-slate-50">
                    {isAdminOrOfficer && (
                      <th className="border-2 border-black p-4 text-center w-12">
                        <input
                          type="checkbox"
                          onChange={(e) => handleSelectAll(e)}
                          checked={selectedTimetableIds.length === filteredTimetables.length && filteredTimetables.length > 0}
                          className="w-5 h-5 rounded border-2 border-black text-purple-600 focus:ring-purple-500"
                        />
                      </th>
                    )}
                    <th className="border-2 border-black p-4 text-left font-black uppercase text-xs md:text-sm w-40">Date</th>
                    <th className="border-2 border-black p-4 text-left font-black uppercase text-xs md:text-sm w-64">Time</th>
                    <th className="border-2 border-black p-4 text-left font-black uppercase text-xs md:text-sm">Subject Name</th>
                    {(isAdminOrOfficer || canApproveDean || canApproveHod) && (
                      <th className="border-2 border-black p-4 text-left font-black uppercase text-xs md:text-sm w-48">Status / Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredTimetables].sort((a, b) => new Date(a.date) - new Date(b.date)).map(t => (
                    <tr key={t._id} className={`hover:bg-slate-50 transition-colors group ${selectedTimetableIds.includes(t._id) ? 'bg-purple-50' : ''}`}>
                      {isAdminOrOfficer && (
                        <td className="border-2 border-black p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedTimetableIds.includes(t._id)}
                            onChange={() => handleSelectTimetable(t._id)}
                            className="w-5 h-5 rounded border-2 border-black text-purple-600 focus:ring-purple-500"
                          />
                        </td>
                      )}
                      <td className="border-2 border-black p-4 font-bold text-xs md:text-sm">
                        {t.date ? format(new Date(t.date), 'dd.MM.yyyy') : '-'}
                        <div className="text-[10px] text-slate-400 uppercase font-bold">{t.date ? format(new Date(t.date), 'EEEE') : ''}</div>
                      </td>
                      <td className="border-2 border-black p-4 font-black text-indigo-600 text-xs md:text-sm">
                        {t.startTime} - {t.endTime}
                      </td>
                      <td className="border-2 border-black p-4 relative">
                        <div className="font-black text-slate-800 text-xs md:text-sm">{getSubjectDisplay(t)}</div>
                        {t.supervisors && t.supervisors.length > 0 && (
                          <div className="mt-1 text-[9px] md:text-[10px] font-bold text-slate-500 italic">
                            Supervisors: {t.supervisors.map(s => s.name).join(', ')}
                          </div>
                        )}

                        {/* Inline Actions for Table View */}
                        {canEdit && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(t)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200" title="Edit"><FiEdit2 size={12} /></button>
                            <button onClick={() => handleDeleteTimetable(t._id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200" title="Delete"><FiTrash2 size={12} /></button>
                          </div>
                        )}
                      </td>
                      {(isAdminOrOfficer || canApproveDean || canApproveHod) && (
                        <td className="border-2 border-black p-4">
                          <div className="flex flex-col gap-2">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-black w-fit ${t.status === 'published' ? 'bg-green-100 text-green-800 border-green-300' :
                                t.status === 'pending_dean' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                  t.status === 'pending_hod' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                    t.status === 'finished' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                      t.status === 'problem' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                                        'bg-gray-100 text-gray-800 border-gray-300'
                              }`}>{t.status?.replace('_', ' ') || 'DRAFT'}</span>

                            <div className="flex flex-wrap gap-1">
                              {user.role === 'hod' && t.status === 'published' && (
                                <>
                                  <button onClick={() => { setSelectedTimetable(t); setShowProblemModal(true); }} className="px-2 py-1 bg-rose-50 text-rose-700 text-[8px] font-black uppercase border border-rose-200 rounded shadow-sm">Issue</button>
                                  <button onClick={() => handleStatusChange(t._id, 'finished')} className="px-2 py-1 bg-emerald-600 text-white text-[8px] font-black uppercase rounded shadow-sm">Finish</button>
                                </>
                              )}
                              {(isAdminOrOfficer || user.role === 'dean') && t.status === 'problem' && (
                                <button onClick={() => handleStatusChange(t._id, 'draft')} className="px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded shadow-sm">Resolve</button>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-16 flex justify-between items-end px-4">
              <div className="text-[9px] font-black text-slate-300 uppercase vertical-text">
                Generated by Exam Management System • {format(new Date(), 'dd/MM/yyyy HH:mm')}
              </div>
              <div className="text-center flex flex-col items-center">
                {eoSignature && (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${eoSignature}`}
                    alt="AR Signature"
                    className="h-10 md:h-12 object-contain mb-1"
                  />
                )}
                <div className="w-64 border-b-2 border-black mb-3"></div>
                <div className="text-[10px] md:text-xs font-black uppercase tracking-widest">Assistant Registrar</div>
                <div className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">{getFacultyName(selectedDepartment)}</div>
                <div className="text-[9px] font-medium">Trincomalee Campus, EUSL</div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl shadow-lg border border-black border-dashed">
          <FiCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-bold">No timetables found in system</p>
          {canEdit && (
            <button onClick={() => setShowGenerateModal(true)} className="mt-6 px-10 py-4 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all shadow-xl font-black uppercase tracking-widest text-xs">Generate Schedule</button>
          )}
        </div>
      )}


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
          user={user}
        />
      </Modal>


      {/* History Summary Modal */}
      <Modal isOpen={showSummary} onClose={() => setShowSummary(false)} title="Historical Timetable Summary" size="xl">
        <TimetableSummary />
      </Modal>

      {/* Auto Generate Modal */}

      <Modal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Auto-Generate Exam Schedule" size="4xl">
        <GenerateTimetableForm
          departments={departments}
          academicYears={academicYears}
          semesters={semesters}
          onGenerate={handleGenerate}
          onSave={handleSaveGenerated}
          onClose={() => setShowGenerateModal(false)}
          initialFilters={{
            year: selectedYear,
            semester: selectedSemester,
            department: selectedDepartment
          }}
          user={user}
          getBatch={getBatch}
        />
      </Modal>

      {/* Problem Report Modal */}
      <Modal isOpen={showProblemModal} onClose={() => { setShowProblemModal(false); setProblemText(''); }} title="Report Examination Issue" size="md">
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-black uppercase text-[10px] text-slate-400">Describe the Problem</label>
            <textarea
              value={problemText}
              onChange={e => setProblemText(e.target.value)}
              placeholder="e.g. Venue conflict, supervisor unavailable, technical issue..."
              className="w-full border border-black p-4 rounded-2xl focus:ring-2 focus:ring-rose-500 h-32 text-sm font-bold"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => { setShowProblemModal(false); setProblemText(''); }} className="px-6 py-2 bg-white border border-black text-gray-700 font-bold rounded-xl">Cancel</button>
            <button
              onClick={async () => {
                if (!problemText) return toast.error('Please describe the problem');
                try {
                  await api.put('/api/timetables/bulk-status', {
                    timetableIds: [selectedTimetable._id],
                    status: 'problem',
                    problemComments: problemText
                  });
                  toast.success('Problem reported to Dean');
                  setShowProblemModal(false);
                  setProblemText('');
                  fetchData();
                } catch (err) {
                  toast.error('Failed to report problem');
                }
              }}
              className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all"
            >
              Send to Dean
            </button>
          </div>
        </div>
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
const TimetableForm = ({ formData, handleInputChange, handleSubjectChange, handleSubmit, subjects, academicYears, semesters, examTypes, departments, submitText, resetForm, user }) => {
  const filteredSubjects = subjects.filter(s => {
    if (formData.year && s.year !== formData.year) return false;
    if (formData.semester && s.semester?.toString() !== formData.semester?.toString()) return false;
    if (formData.department && s.department !== formData.department) return false;
    return true;
  });

  const isHod = user?.role === 'hod';
  const getFieldClass = (disabled) => `w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200' : 'border-black'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Year</label>
          <select name="year" value={formData.year} onChange={handleInputChange} disabled={isHod} className={getFieldClass(isHod)}>
            <option value="">Select Year</option>
            {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Semester</label>
          <select name="semester" value={formData.semester} onChange={handleInputChange} disabled={isHod} className={getFieldClass(isHod)}>
            <option value="">Select Semester</option>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Department</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            disabled={isHod}
            className={getFieldClass(isHod)}
          >
            <option value="">Select Department</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Subject</label>
          <select name="subject" value={formData.subject} onChange={handleSubjectChange} disabled={isHod} className={getFieldClass(isHod)}>
            <option value="">Select Subject</option>
            {filteredSubjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Exam Type</label>
          <input
            type="text"
            value="Final"
            disabled
            className={getFieldClass(true)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Venue</label>
          <input type="text" name="venue" value={formData.venue} onChange={handleInputChange} disabled={isHod} className={getFieldClass(isHod)} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleInputChange} disabled={isHod} className={getFieldClass(isHod)} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Start Time</label>
          <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} disabled={isHod} className={getFieldClass(isHod)} />
        </div>
        <div>
          <label className="block mb-1 font-medium">End Time</label>
          <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} disabled={isHod} className={getFieldClass(isHod)} />
        </div>
        <div>
          <label className="block mb-1 font-medium text-purple-700 font-bold">Batch (HOD Editable)</label>
          <input
            type="text"
            name="batch"
            value={formData.batch}
            onChange={handleInputChange}
            placeholder="e.g. 2026/2027"
            className="w-full border border-purple-600 px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 bg-purple-50 font-bold"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <button type="button" onClick={resetForm} className="px-6 py-2 bg-white border border-black text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Reset</button>
        <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">{submitText}</button>
      </div>
    </form>
  );
};



// Auto-Generate Timetable Form Component
const GenerateTimetableForm = ({ departments, academicYears, semesters, onGenerate, onSave, onClose, initialFilters, user, getBatch }) => {
  const [step, setStep] = useState(1); // 1: Setup, 2: Preview
  const [genData, setGenData] = useState({
    startDate: '',
    year: initialFilters?.year !== 'all' ? initialFilters.year : 'all',
    semester: initialFilters?.semester !== 'all' ? initialFilters.semester : 'all',
    department: initialFilters?.department !== 'all' ? initialFilters.department : 'all',
    batch: getBatch(initialFilters?.year !== 'all' ? initialFilters.year : 'all'),
    examType: 'final',
    slots: [
      { startTime: '08:30', endTime: '11:30' },
      { startTime: '13:30', endTime: '16:30' }
    ],
    venues: ['Hall A', 'Hall B', 'Main Auditorium', 'Computer Laboratory'],
    skipWeekends: true,
    avoidConflicts: true
  });
  const [previewEntries, setPreviewEntries] = useState([]);
  const [unscheduledSubjects, setUnscheduledSubjects] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleInputChange = e => {
    const { name, value } = e.target;
    const updates = { [name]: value };
    if (name === 'year') {
      updates.batch = getBatch(value);
    }
    setGenData({ ...genData, ...updates });
  };

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...genData.slots];
    newSlots[index][field] = value;
    setGenData({ ...genData, slots: newSlots });
  };

  const handleAddSlot = () => setGenData({ ...genData, slots: [...genData.slots, { startTime: '', endTime: '' }] });
  const handleRemoveSlot = (index) => setGenData({ ...genData, slots: genData.slots.filter((_, i) => i !== index) });

  const handleVenueChange = (val) => {
    const venues = val.split(',').map(v => v.trim()).filter(Boolean);
    setGenData({ ...genData, venues });
  };

  const onGenerateClick = async (e) => {
    e.preventDefault();
    if (!genData.startDate || !genData.year || !genData.semester || !genData.department) {
      return toast.error("Please fill all required parameters");
    }

    setIsGenerating(true);
    setProgress(20);

    // Simulate progress
    const timer = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 200);

    const res = await onGenerate(genData);
    clearInterval(timer);
    setProgress(100);

    setTimeout(() => {
      setIsGenerating(false);
      if (res && res.timetables && res.timetables.length > 0) {
        setPreviewEntries(res.timetables);
        setUnscheduledSubjects(res.unscheduledSubjects || []);
        setStep(2);
      } else if (res) {
        toast.error(res.message || "No subjects could be scheduled with the given constraints.");
      }
    }, 500);
  };

  if (step === 1) {
    return (
      <form onSubmit={onGenerateClick} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
          <div className="space-y-4">
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-400 border-b pb-2">Exam Group</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Academic Year</label>
                <select name="year" value={genData.year} onChange={handleInputChange} className="w-full border border-black p-2 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-bold">
                  <option value="all">All Years</option>
                  {academicYears?.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Semester</label>
                <select name="semester" value={genData.semester} onChange={handleInputChange} className="w-full border border-black p-2 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-bold">
                  <option value="all">All Semesters</option>
                  {semesters?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Department</label>
              <select
                name="department"
                value={genData.department}
                onChange={handleInputChange}
                disabled={user?.role === 'hod'}
                className={`w-full border border-black p-2 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-bold ${user?.role === 'hod' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
              >
                <option value="all">All Departments</option>
                {departments?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Start Date</label>
              <input type="date" name="startDate" value={genData.startDate} onChange={handleInputChange} className="w-full border border-black p-2 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Exam Type & Batch</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value="Final"
                  disabled
                  className="flex-1 border border-black p-2 rounded-xl bg-gray-50 text-gray-500 text-sm font-bold cursor-not-allowed"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    name="batch"
                    value={genData.batch}
                    onChange={handleInputChange}
                    placeholder="Current Batch"
                    className="w-full border border-purple-600 px-3 py-2 rounded-xl focus:ring-2 focus:ring-purple-500 bg-purple-50 font-bold text-purple-800 text-sm"
                  />
                  <span className="block text-[8px] font-black uppercase text-purple-400 mt-1">Editable by Exam Officer</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-400 border-b pb-2">Constraints & Slots</h3>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Venues (Comma separated)</label>
              <textarea
                value={genData.venues.join(', ')}
                onChange={e => handleVenueChange(e.target.value)}
                placeholder="Hall A, Hall B, Main Lab..."
                className="w-full border border-black p-2 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-bold h-20"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-black uppercase text-slate-500">Daily Time Slots</label>
                <button type="button" onClick={handleAddSlot} className="text-[10px] font-black text-purple-600 uppercase">+ Add Slot</button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                {genData.slots.map((slot, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="time" value={slot.startTime} onChange={e => handleSlotChange(i, 'startTime', e.target.value)} className="flex-1 border border-black p-1 rounded-lg text-xs" />
                    <span className="text-gray-400">-</span>
                    <input type="time" value={slot.endTime} onChange={e => handleSlotChange(i, 'endTime', e.target.value)} className="flex-1 border border-black p-1 rounded-lg text-xs" />
                    <button type="button" onClick={() => handleRemoveSlot(i)} className="text-red-500" disabled={genData.slots.length === 1}><FiTrash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400">Rules</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGenData({ ...genData, skipWeekends: !genData.skipWeekends })}
                  className={`flex-1 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1 ${genData.skipWeekends ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-black text-slate-400 opacity-50'}`}
                >
                  <FiZap size={10} /> Weekend Skip {genData.skipWeekends ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => setGenData({ ...genData, avoidConflicts: !genData.avoidConflicts })}
                  className={`flex-1 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1 ${genData.avoidConflicts ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-black text-slate-400 opacity-50'}`}
                >
                  <FiCheck size={10} /> {genData.avoidConflicts ? 'No Conflicts' : 'Allow Overlap'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-black">
          <button type="button" onClick={onClose} className="px-8 py-3 bg-white border border-black text-gray-700 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-50">Cancel</button>
          <button
            type="submit"
            disabled={isGenerating}
            className={`px-8 py-3 ${isGenerating ? 'bg-slate-200' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-emerald-100 flex items-center gap-2 transition-all`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                Analyzing {progress}%
              </>
            ) : (
              <>
                <FiZap /> Run Algorithm
              </>
            )}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
        <div>
          <h3 className="font-black text-emerald-800 uppercase tracking-tighter">Algorithm Result</h3>
          <p className="text-xs text-emerald-600 font-bold">Successfully scheduled {previewEntries.length} subjects with a 2-day gap.</p>
          {unscheduledSubjects.length > 0 && (
            <p className="text-[10px] text-rose-600 font-black uppercase mt-1 flex items-center gap-1">
              <FiAlertCircle size={10} /> {unscheduledSubjects.length} subjects could not be scheduled
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${genData.avoidConflicts ? 'text-emerald-700 bg-white border-emerald-200' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>
            <FiCheck /> {genData.avoidConflicts ? 'No Conflicts' : 'Conflicts Allowed'}
          </span>
          <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${genData.skipWeekends ? 'text-emerald-700 bg-white border-emerald-200' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>
            <FiZap /> Weekend Skip {genData.skipWeekends ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto border border-black rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-black">
            <tr>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Time</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Subject / Staff</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Venue</th>

            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {previewEntries.map((entry, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <p className="text-xs font-black text-slate-700">{format(new Date(entry.date), 'EEEE')}</p>
                  <p className="text-[10px] font-bold text-slate-400">{format(new Date(entry.date), 'dd MMM yyyy')}</p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                    <FiClock size={12} /> {entry.startTime} - {entry.endTime}
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-xs font-black text-slate-800">{entry.subjectCode} - {entry.subjectName}</p>
                </td>

                <td className="p-4">
                  <span className="px-3 py-1 bg-white border border-black rounded-lg text-[10px] font-bold">{entry.venue}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-black">
        <button type="button" onClick={() => setStep(1)} className="px-8 py-3 bg-white border border-black text-gray-700 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-50 flex items-center gap-2">
          Change Settings
        </button>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="px-8 py-3 bg-white border border-black text-gray-700 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-50">Discard</button>
          <button type="button" onClick={() => onSave(previewEntries.map(e => ({ ...e, batch: genData.batch })))} className="px-12 py-3 bg-purple-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-purple-700 shadow-xl shadow-purple-100 flex items-center gap-2">
            Confirm & Save Timetable
          </button>
        </div>
      </div>
    </div>
  );
};




export default RegistrarTimetables;


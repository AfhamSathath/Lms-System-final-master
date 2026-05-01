import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiPlus, FiEdit2, FiTrash2, FiSearch, FiClock, FiMapPin, FiBook, FiUsers, 
  FiFilter, FiChevronDown, FiUser, FiShield, FiZap, FiCheck, FiLayers, FiAlertCircle,
  FiDownload, FiTable, FiGrid, FiSend
} from 'react-icons/fi';

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
  const [formData, setFormData] = useState({
    subject: '', year: '', semester: '', examType: 'final',
    date: '', startTime: '', endTime: '', venue: '', department: ''
  });

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
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
      const sortedTimetables = (tRes.data.timetables || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTimetables(sortedTimetables);
      setFilteredTimetables(sortedTimetables);
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

  const resetForm = () => setFormData({ subject: '', year: '', semester: '', examType: 'final', date: '', startTime: '', endTime: '', venue: '', department: '' });


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

  const exportToPDF = () => {
    if (filteredTimetables.length === 0) return toast.error('No data to export');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const currentYearCycle = new Date().getFullYear();
    const academicCycle = `${currentYearCycle}/${currentYearCycle + 1}`;

    // Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TRINCOMALEE CAMPUS, EASTERN UNIVERSITY, SRI LANKA', pageWidth / 2, 15, { align: 'center' });
    
    const faculty = getFacultyName(selectedDepartment);
    doc.text(faculty, pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Examination: FINAL EXAMINATION`, pageWidth / 2, 29, { align: 'center' });
    
    const examYear = selectedYear !== 'all' ? getRomanYear(selectedYear) : 'ALL YEARS';
    const examSem = selectedSemester !== 'all' ? getRomanSemester(selectedSemester) : 'ALL SEMESTERS';
    doc.text(`${examYear} ${examSem} - ${academicCycle}`, pageWidth / 2, 35, { align: 'center' });

    const dept = selectedDepartment !== 'all' ? selectedDepartment.toUpperCase() : 'ALL DEPARTMENTS';
    doc.text(`Department: ${dept}`, pageWidth / 2, 41, { align: 'center' });

    // Table
    const sortedForExport = [...filteredTimetables].sort((a, b) => new Date(a.date) - new Date(b.date));
    const tableData = sortedForExport.map(t => [
      t.date ? format(new Date(t.date), 'dd.MM.yyyy') : '-',
      `${t.startTime || '-'} - ${t.endTime || '-'}`,
      getSubjectDisplay(t),
      t.venue || '-'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['DATE', 'TIME', 'SUBJECT NAME', 'VENUE']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold', fontSize: 8 },
      styles: { textColor: [0, 0, 0], fontSize: 8, cellPadding: 3, halign: 'left' },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 30 }
      }
    });

    // Signature
    const finalY = (doc).lastAutoTable.finalY + 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    // Assistant Registrar Block (Left)
    doc.text('.........................................', 15, finalY);
    doc.text('Prepared By:', 15, finalY + 5);
    doc.text('Assistant Registrar', 15, finalY + 10);
    doc.text('Academic Affairs', 15, finalY + 15);

    // Dean Block (Right)
    doc.text('.........................................', pageWidth - 15, finalY, { align: 'right' });
    doc.text('Approved By:', pageWidth - 15, finalY + 5, { align: 'right' });
    doc.text('Dean of Faculty', pageWidth - 15, finalY + 10, { align: 'right' });
    doc.text('Date: .......................', pageWidth - 15, finalY + 15, { align: 'right' });

    doc.save(`Exam_Timetable_${dept.replace(/\s+/g, '_')}_${academicCycle.replace('/', '-')}.pdf`);
    toast.success('Professional PDF Generated Successfully');
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

  const canEdit = ['exam_officer', 'registrar', 'admin'].includes(user?.role);
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

            <div className="flex gap-2">
              {canEdit && filteredTimetables.some(t => !t.status || t.status === 'draft') && (
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
              {canEdit && (
                <button 
                  onClick={() => setShowGenerateModal(true)} 
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-lg font-bold"
                >
                  Auto Generate
                </button>
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
      </div>      {/* Timetable Content */}
           {/* Result Section */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader /></div>
      ) : filteredTimetables.length > 0 ? (
        viewType === 'card' ? (
          <div className="space-y-12">
            {Object.entries(
              filteredTimetables.reduce((acc, t) => {
                const key = `${t.year} - Semester ${t.semester}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(t);
                return acc;
              }, {})
            ).map(([batchKey, batchTimetables]) => (
              <div key={batchKey} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 bg-slate-100 px-6 py-2 rounded-2xl border-l-4 border-purple-600 shadow-sm">{batchKey}</h3>
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{batchTimetables.length} Subjects</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {batchTimetables.map(t => (
                    <div key={t._id} className="bg-white border border-black rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group fade-in">
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
                                  'bg-gray-100 text-gray-800 border-gray-300'
                            }`}>{t.status?.replace('_', ' ') || 'DRAFT'}</span>
                        </div>

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
                              {(!t.status || t.status === 'draft') && (
                                <button onClick={() => handleStatusChange(t._id, 'pending_dean')} className="px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-700 transition-all shadow-md mr-auto">Send to Dean</button>
                              )}
                              <button onClick={() => openEditModal(t)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100" title="Edit"><FiEdit2 size={16} /></button>
                              <button onClick={() => handleDeleteTimetable(t._id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100" title="Delete"><FiTrash2 size={16} /></button>
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
                <span className="text-left">Examination : {selectedYear !== 'all' ? getRomanYear(selectedYear) : 'ALL YEARS'} {selectedSemester !== 'all' ? getRomanSemester(selectedSemester) : 'ALL SEMESTERS'}</span>
                <span className="text-right">Venue: {[...new Set(filteredTimetables.map(t => t.venue))].join(', ')}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-black">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-2 border-black p-4 text-left font-black uppercase text-xs md:text-sm w-40">Date</th>
                    <th className="border-2 border-black p-4 text-left font-black uppercase text-xs md:text-sm w-64">Time</th>
                    <th className="border-2 border-black p-4 text-left font-black uppercase text-xs md:text-sm">Subject Name</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredTimetables].sort((a, b) => new Date(a.date) - new Date(b.date)).map(t => (
                    <tr key={t._id} className="hover:bg-slate-50 transition-colors group">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-16 flex justify-between items-end px-4">
              <div className="text-[9px] font-black text-slate-300 uppercase vertical-text">
                Generated by Exam Management System • {format(new Date(), 'dd/MM/yyyy HH:mm')}
              </div>
              <div className="text-center">
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
        />
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



// Auto-Generate Timetable Form Component
const GenerateTimetableForm = ({ departments, academicYears, semesters, onGenerate, onSave, onClose, initialFilters }) => {
  const [step, setStep] = useState(1); // 1: Setup, 2: Preview
  const [genData, setGenData] = useState({
    startDate: '',
    year: initialFilters?.year !== 'all' ? initialFilters.year : 'all',
    semester: initialFilters?.semester !== 'all' ? initialFilters.semester : 'all',
    department: initialFilters?.department !== 'all' ? initialFilters.department : 'all',
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

  const handleInputChange = e => setGenData({ ...genData, [e.target.name]: e.target.value });

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
              <select name="department" value={genData.department} onChange={handleInputChange} className="w-full border border-black p-2 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-bold">
                <option value="all">All Departments</option>
                {departments?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Start Date</label>
              <input type="date" name="startDate" value={genData.startDate} onChange={handleInputChange} className="w-full border border-black p-2 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Exam Type</label>
              <select name="examType" value={genData.examType} onChange={handleInputChange} className="w-full border border-black p-2 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-bold">
                {['midterm', 'final', 'quiz', 'supplementary', 'special', 'practical', 'viva'].map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
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
          <button type="button" onClick={() => onSave(previewEntries)} className="px-12 py-3 bg-purple-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-purple-700 shadow-xl shadow-purple-100 flex items-center gap-2">
            Confirm & Save Timetable
          </button>
        </div>
      </div>
    </div>
  );
};




export default RegistrarTimetables;


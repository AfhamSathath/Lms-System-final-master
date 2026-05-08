import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';

import {
  FiPlus, FiEdit2, FiTrash2, FiUser, FiBook, FiCheckCircle,
  FiAlertCircle, FiDownload, FiSearch, FiFilter, FiTrendingUp,
  FiAward, FiBarChart2, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const LecturerManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState({
    assignments: [],
    lecturers: [],
    subjects: [],
    departments: []
  });
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    department: user?.role === 'hod' ? user.department : 'all',
    semester: 'all',
    academicYear: 'all',
    status: 'all'
  });

  const [modals, setModals] = useState({
    assign: false,
    edit: false,
    qualify: false,
    progress: false
  });

  const [formData, setFormData] = useState({
    lecturerId: '',
    subjectId: '',
    departmentId: user.role === 'hod' ? user.department : '',
    academicYear: '',
    semester: '',
    startDate: '',
    endDate: '',
    totalLectures: 30,
    notes: ''
  });

  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignRes, lecturersRes, subjectsRes, deptRes] = await Promise.all([
        api.get('/api/lecturer-assignments/all').catch(() => ({ data: { assignments: [] } })),
        api.get('/api/users?role=lecturer').catch(() => ({ data: { users: [] } })),
        api.get('/api/subjects?isActive=true').catch(() => ({ data: { subjects: [] } })),
        api.get('/api/departments').catch(() => ({ data: { departments: [] } }))
      ]);

      let assignments = assignRes.data.data || [];
      let lecturers = lecturersRes.data.users || [];
      let subjects = subjectsRes.data.subjects || [];
      const departments = deptRes.data.departments || [];

      // Filter by department if user is HOD
      if (user.role === 'hod' && user.department) {
        const hodDept = user.department.toLowerCase();
        assignments = assignments.filter(a => {
          const deptName = a.department?.name || a.department;
          return deptName?.toLowerCase() === hodDept;
        });
        lecturers = lecturers.filter(l => l.department?.toLowerCase() === hodDept);
        subjects = subjects.filter(s => s.department?.toLowerCase() === hodDept);
      }

      setState({
        assignments,
        lecturers,
        subjects,
        departments
      });
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = useMemo(() => {
    return state.assignments.filter(a => {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch =
        a.lecturer?.name?.toLowerCase().includes(searchTerm) ||
        a.subject?.code?.toLowerCase().includes(searchTerm) ||
        a.subject?.name?.toLowerCase().includes(searchTerm);

      const matchesFilters =
        (filters.department === 'all' || a.department === filters.department || a.department === state.departments.find(d => d._id === filters.department)?.name) &&
        (filters.semester === 'all' || a.semester === Number(filters.semester)) &&
        (filters.academicYear === 'all' || a.academicYear === filters.academicYear) &&
        (filters.status === 'all' || a.status === filters.status);

      return matchesSearch && matchesFilters;
    });
  }, [state.assignments, filters]);

  const handleAssign = async (e) => {
    e.preventDefault();

    if (!formData.lecturerId || !formData.subjectId || !formData.departmentId || !formData.academicYear || !formData.semester || !formData.startDate || !formData.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.post('/api/lecturer-assignments/assign', {
        lecturerId: formData.lecturerId,
        subjectId: formData.subjectId,
        departmentId: formData.departmentId,
        academicYear: formData.academicYear,
        semester: Number(formData.semester),
        startDate: formData.startDate,
        endDate: formData.endDate,
        curriculum: {
          totalLectures: Number(formData.totalLectures)
        },
        notes: formData.notes
      });

      const selectedLecturer = state.lecturers.find(l => l._id === formData.lecturerId);
      const selectedSubject = state.subjects.find(s => s._id === formData.subjectId);

      if (selectedLecturer && selectedSubject) {
        await api.post('/api/notifications/send', {
          recipientIds: [formData.lecturerId],
          title: 'New Subject Assignment',
          message: `You have been assigned to teach ${selectedSubject.name} (${selectedSubject.code}) for ${formData.academicYear}, Semester ${formData.semester}`,
          type: 'ASSIGNMENT',
          priority: 'NORMAL',
          link: '/lecturer/dashboard'
        });
      }

      toast.success('Lecturer assigned successfully');
      toggleModal('assign', false);
      setFormData({
        lecturerId: '',
        subjectId: '',
        departmentId: '',
        academicYear: '',
        semester: '',
        startDate: '',
        endDate: '',
        totalLectures: 30,
        notes: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Assignment failed');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/lecturer-assignments/${selectedAssignment._id}`, {
        lecturerId: formData.lecturerId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        curriculum: {
          totalLectures: Number(formData.totalLectures)
        },
        notes: formData.notes
      });

      toast.success('Assignment updated successfully');
      toggleModal('edit', false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleUpdateStatus = async (assignmentId, status) => {
    try {
      await api.put(`/api/lecturer-assignments/${assignmentId}/status`, { status });
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleSelectAssignment = (id) => {
    setSelectedAssignmentIds(prev =>
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  const handleSelectAllAssignments = (e) => {
    if (e.target.checked) {
      const allIds = filteredAssignments.map(a => a._id);
      setSelectedAssignmentIds(allIds);
    } else {
      setSelectedAssignmentIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssignmentIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedAssignmentIds.length} assignments? This action cannot be undone.`)) return;

    try {
      setLoading(true);
      await api.delete('/api/lecturer-assignments/bulk', { data: { assignmentIds: selectedAssignmentIds } });
      toast.success(`${selectedAssignmentIds.length} assignments deleted successfully`);
      setSelectedAssignmentIds([]);
      fetchData();
    } catch (err) {
      console.error('Bulk delete error:', err);
      toast.error(err.response?.data?.message || 'Bulk delete failed');
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/api/lecturer-assignments/${assignmentId}`);
        toast.success('Assignment deleted');
        fetchData();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const toggleModal = (modalName, show) => {
    setModals(prev => ({ ...prev, [modalName]: show }));
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'bg-white border border-black text-slate-800',
      active: 'bg-white border border-black text-slate-800',
      completed: 'bg-white border border-black text-slate-800',
      suspended: 'bg-white border border-black text-slate-800'
    };
    return colors[status] || 'bg-white border border-black text-gray-800';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white border border-black rounded-2xl shadow-lg p-6 mb-8 text-slate-900">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FiUser /> Lecturer Management
            </h1>
            <p className="text-slate-500 mt-1">Assign subjects and manage lecturer curriculum</p>
          </div>
          <button
            onClick={() => toggleModal('assign', true)}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-50 transition shadow-lg"
          >
            <FiPlus /> Assign Lecturer
          </button>
          {selectedAssignmentIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-red-700 transition shadow-lg"
            >
              <FiTrash2 /> Delete ({selectedAssignmentIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search lecturer, subject..."
            value={filters.search}
            onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.department}
            onChange={(e) => setFilters(p => ({ ...p, department: e.target.value }))}
            disabled={user?.role === 'hod'}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${user?.role === 'hod' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
          >
            <option value="all">All Departments</option>
            {state.departments.map(d => (
              <option key={d._id} value={d.name}>{d.name}</option>
            ))}
          </select>

          <select
            value={filters.semester}
            onChange={(e) => setFilters(p => ({ ...p, semester: e.target.value }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>

          <select
            value={filters.academicYear}
            onChange={(e) => setFilters(p => ({ ...p, academicYear: e.target.value }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={() => setFilters({
              search: '',
              department: 'all',
              semester: 'all',
              academicYear: 'all',
              status: 'all'
            })}
            className="px-4 py-2 bg-white border border-black text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white border-b">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded border-black text-blue-600 focus:ring-blue-500"
                  onChange={handleSelectAllAssignments}
                  checked={selectedAssignmentIds.length === filteredAssignments.length && filteredAssignments.length > 0}
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lecturer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Year/Sem</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Progress</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map(assignment => (
              <tr key={assignment._id} className={`border-b hover:bg-gray-50 ${selectedAssignmentIds.includes(assignment._id) ? 'bg-blue-50' : ''}`}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="rounded border-black text-blue-600 focus:ring-blue-500"
                    checked={selectedAssignmentIds.includes(assignment._id)}
                    onChange={() => handleSelectAssignment(assignment._id)}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{assignment.lecturer?.name}</div>
                  <div className="text-sm text-gray-500">{assignment.lecturer?.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{assignment.subject?.code}</div>
                  <div className="text-sm text-gray-500">{assignment.subject?.name}</div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {assignment.academicYear} / Sem {assignment.semester}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${assignment.curriculum.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{assignment.curriculum.progressPercentage}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    {user.role !== 'hod' && (
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          toggleModal('progress', true);
                        }}
                        className="text-blue-600 hover:text-slate-800"
                      >
                        <FiTrendingUp size={18} />
                      </button>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          // Recalculate lectures from code to fix errors
                          const digits = assignment.subject?.code?.match(/\d/g);
                          const derivedCredits = (digits && digits.length >= 3) ? parseInt(digits[2]) : (assignment.subject?.credits || 2);
                          const correctedLectures = derivedCredits * 15;

                          setFormData({
                            lecturerId: assignment.lecturer?._id || '',
                            subjectId: assignment.subject?._id || '',
                            departmentId: assignment.department?.name || assignment.department || '',
                            academicYear: assignment.academicYear || '',
                            semester: assignment.semester?.toString() || '',
                            startDate: assignment.startDate ? new Date(assignment.startDate).toISOString().split('T')[0] : '',
                            endDate: assignment.endDate ? new Date(assignment.endDate).toISOString().split('T')[0] : '',
                            totalLectures: correctedLectures,
                            notes: assignment.notes || ''
                          });
                          toggleModal('edit', true);
                        }}
                        className="text-amber-600 hover:text-amber-800"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        className="text-red-600 hover:text-slate-800"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modals.assign && (
        <AssignModal
          isOpen={modals.assign}
          onClose={() => toggleModal('assign', false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAssign}
          lecturers={state.lecturers}
          subjects={state.subjects}
          departments={state.departments}
        />
      )}

      {modals.edit && selectedAssignment && (
        <EditModal
          isOpen={modals.edit}
          onClose={() => toggleModal('edit', false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdate}
          lecturers={state.lecturers}
          assignment={selectedAssignment}
        />
      )}

      {modals.progress && selectedAssignment && (
        <ProgressModal
          isOpen={modals.progress}
          onClose={() => toggleModal('progress', false)}
          assignment={selectedAssignment}
          onUpdate={() => { fetchData(); toggleModal('progress', false); }}
        />
      )}
    </div>
  );
};


// Assign Modal Component
const AssignModal = ({ isOpen, onClose, formData, setFormData, onSubmit, lecturers, subjects, departments }) => {
  const { user } = useAuth();

  // Filter subjects based on selected year and semester
  const filteredSubjects = subjects.filter(s => {
    const yearMatch = !formData.academicYear || s.year === formData.academicYear;
    const semMatch = !formData.semester || s.semester?.toString() === formData.semester;
    return yearMatch && semMatch;
  });

  // Allowed departments - filtered list
  const ALLOWED_DEPARTMENTS = ['Computer Science', 'Software Engineering', 'Information Technology', 'CS', 'SE', 'IT'];

  // Filter departments to only show allowed ones
  const allowedDepts = departments.filter(d =>
    ALLOWED_DEPARTMENTS.some(allowed =>
      d.name?.trim().toLowerCase() === allowed.toLowerCase() ||
      d.code?.trim().toLowerCase() === allowed.toLowerCase()
    )
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Assign Lecturer to Subject</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Lecturer *</label>
              <select
                value={formData.lecturerId}
                onChange={(e) => setFormData(p => ({ ...p, lecturerId: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Lecturer</option>
                {lecturers.map(l => (
                  <option key={l._id} value={l._id}>{l.name} ({l.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Academic Year *</label>
              <select
                value={formData.academicYear}
                onChange={(e) => {
                  const newYear = e.target.value;
                  setFormData(p => ({
                    ...p,
                    academicYear: newYear,
                    subjectId: '' // Clear subject to re-filter
                  }));
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Semester *</label>
              <select
                value={formData.semester}
                onChange={(e) => {
                  const newSem = e.target.value;
                  setFormData(p => ({
                    ...p,
                    semester: newSem,
                    subjectId: '' // Clear subject to re-filter
                  }));
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject *</label>
              <select
                value={formData.subjectId}
                onChange={(e) => {
                  const subjId = e.target.value;
                  const selectedSubject = subjects.find(s => s._id === subjId);

                  let autoResolved = false;
                  let matchedDept = null;

                  if (selectedSubject && selectedSubject.department) {
                    const deptIdentifier = selectedSubject.department.toString().trim();

                    // Try to find a match in the allowed departments list from DB
                    const dbMatch = allowedDepts.find(d =>
                      d._id?.toString() === deptIdentifier ||
                      d.code?.toLowerCase() === deptIdentifier.toLowerCase() ||
                      d.name?.toLowerCase() === deptIdentifier.toLowerCase()
                    );

                    // Use DB match name if found, otherwise use the identifier from the subject directly
                    const resolvedDeptName = dbMatch ? dbMatch.name : deptIdentifier;

                    // Extract credits from code to fix potential credit errors
                    const digits = selectedSubject.code.match(/\d/g);
                    const derivedCredits = (digits && digits.length >= 3) ? parseInt(digits[2]) : selectedSubject.credits;
                    const calculatedLectures = derivedCredits ? derivedCredits * 15 : p.totalLectures;

                    setFormData(p => ({
                      ...p,
                      subjectId: subjId,
                      departmentId: resolvedDeptName,
                      academicYear: selectedSubject?.year || p.academicYear,
                      semester: selectedSubject?.semester ? selectedSubject.semester.toString() : p.semester,
                      totalLectures: calculatedLectures
                    }));
                  } else {
                    // Extract credits from code to fix potential credit errors
                    const digits = selectedSubject?.code?.match(/\d/g);
                    const derivedCredits = (digits && digits.length >= 3) ? parseInt(digits[2]) : selectedSubject?.credits;
                    const calculatedLectures = derivedCredits ? derivedCredits * 15 : p.totalLectures;

                    setFormData(p => ({
                      ...p,
                      subjectId: subjId,
                      academicYear: selectedSubject?.year || p.academicYear,
                      semester: selectedSubject?.semester ? selectedSubject.semester.toString() : p.semester,
                      totalLectures: calculatedLectures
                    }));
                  }
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={!formData.academicYear && !formData.semester}
              >
                <option value="">{(!formData.academicYear && !formData.semester) ? 'Select Year/Sem first' : 'Select Subject'}</option>
                {filteredSubjects.map(s => (
                  <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                ))}
              </select>
              {filteredSubjects.length === 0 && (formData.academicYear || formData.semester) && (
                <p className="text-xs text-rose-500 mt-1">No subjects found for this selection</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Department *</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData(p => ({ ...p, departmentId: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={(!!formData.departmentId && !!formData.subjectId) || user.role === 'hod'}
              >
                <option value="">Select Department</option>
                {/* 1. Primary options from Database */}
                {allowedDepts.map(d => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}

                {/* 2. Fallback for standard departments if not in allowedDepts */}
                {['Computer Science', 'Software Engineering', 'Information Technology'].map(dept => (
                  !allowedDepts.find(d => d.name === dept) && (
                    <option key={dept} value={dept}>{dept}</option>
                  )
                ))}

                {/* 3. Safety fallback: show current selected value if still missing */}
                {formData.departmentId &&
                  !allowedDepts.find(d => d.name === formData.departmentId) &&
                  !['Computer Science', 'Software Engineering', 'Information Technology'].includes(formData.departmentId) && (
                    <option value={formData.departmentId}>{formData.departmentId}</option>
                  )}
              </select>
              {formData.departmentId && formData.subjectId && (
                <p className="text-xs text-gray-500 mt-1">✓ Auto-selected & locked</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Lectures</label>
              <input
                type="number"
                value={formData.totalLectures}
                onChange={(e) => setFormData(p => ({ ...p, totalLectures: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formData.subjectId ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                min="1"
                readOnly={!!formData.subjectId}
              />
              {formData.subjectId && (
                <p className="text-[10px] text-indigo-500 mt-1 font-bold">✓ Calculated from credits (15h/credit)</p>
              )}
            </div>

          </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          rows="3"
          maxLength={1000}
        />
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Assign Lecturer
        </button>
      </div>
    </form>
      </div >
    </div >
  );
};

// Progress Modal Component
const ProgressModal = ({ isOpen, onClose, assignment, onUpdate }) => {
  const [data, setData] = useState({
    lecturesCompleted: assignment.curriculum.lecturesCompleted || 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/lecturer-assignments/${assignment._id}/progress`, data);
      toast.success('Progress updated');
      onUpdate();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Update Progress</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Lectures Completed: {data.lecturesCompleted}/{assignment.curriculum.totalLectures}
            </label>
            <input
              type="range"
              min="0"
              max={assignment.curriculum.totalLectures}
              value={data.lecturesCompleted}
              onChange={(e) => setData(p => ({ ...p, lecturesCompleted: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

      <div className="flex justify-end gap-3 pt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Update Progress
        </button>

      </div>
      </form>
    </div>
  </div>
  );
};

// Edit Modal Component
const EditModal = ({ isOpen, onClose, formData, setFormData, onSubmit, lecturers, assignment }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FiEdit2 size={24} /></div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Edit Assignment</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl mb-6 border border-black">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Subject</p>
          <p className="font-bold text-slate-700">{assignment.subject?.code} - {assignment.subject?.name}</p>
          <div className="flex gap-4 mt-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Year: <span className="text-slate-600">{assignment.academicYear}</span></p>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Semester: <span className="text-slate-600">{assignment.semester}</span></p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-1 ml-1">Lecturer *</label>
              <select
                value={formData.lecturerId}
                onChange={(e) => setFormData(p => ({ ...p, lecturerId: e.target.value }))}
                className="w-full px-4 py-3 bg-white border-black rounded-xl font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                required
              >
                {lecturers.map(l => (
                  <option key={l._id} value={l._id}>{l.name} ({l.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-1 ml-1">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                className="w-full px-4 py-3 bg-white border-black rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-1 ml-1">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
                className="w-full px-4 py-3 bg-white border-black rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-1 ml-1">Total Lectures</label>
              <input
                type="number"
                value={formData.totalLectures}
                onChange={(e) => setFormData(p => ({ ...p, totalLectures: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border-black rounded-xl font-bold text-slate-500 cursor-not-allowed"
                min="1"
                readOnly
              />
              <p className="text-[10px] text-indigo-500 mt-1 font-bold ml-1">✓ Standard: 15h per credit</p>
            </div>

          </div>

      <div>
        <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-1 ml-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
          className="w-full px-4 py-3 bg-white border-black rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
          rows="3"
        />
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-8 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-10 py-3 bg-amber-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all"
        >
          Update Assignment
        </button>
      </div>
    </form>
      </div >
    </div >
  );
};

export default LecturerManagement;

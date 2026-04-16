import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { FiUserPlus, FiSearch, FiCheck, FiX, FiUsers, FiFilter, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const HodStudents = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const batches = ['2024/2025', '2023/2024', '2022/2023', '2021/2022', 'Repeat Batch (All)'];
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    yearOfStudy: '',
    semester: '',
    batch: '',
    isActive: true
  });

  useEffect(() => {
    if (user?.department) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user?.department]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/auth/users?role=student');
      const allStudents = res.data.users || [];

      // My department students
      const myStudents = allStudents.filter(s =>
        (s.department || '').toLowerCase() === (user.department || '').toLowerCase()
      );

      // Unassigned students (no department set)
      const pool = allStudents.filter(s => !s.department || s.department.trim() === '');

      setStudents(myStudents);
      setUnassignedStudents(pool);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudent = async (studentId) => {
    setAssigning(true);
    try {
      await api.put(`/api/auth/users/${studentId}`, {
        department: user.department,
        faculty: user.faculty
      });
      toast.success('Student assigned to department');
      fetchData();
    } catch (error) {
      toast.error('Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from your department?')) return;
    try {
      await api.put(`/api/auth/users/${studentId}`, {
        department: '',
        faculty: ''
      });
      toast.success('Student removed from department');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove student');
    }
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setEditFormData({
      yearOfStudy: student.yearOfStudy || '',
      semester: student.semester || '',
      batch: student.batch || '',
      isActive: student.isActive !== undefined ? student.isActive : true
    });
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/auth/users/${editingStudent._id}`, editFormData);
      toast.success('Student updated successfully');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name?.toLowerCase().includes(search.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      student.email?.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = selectedBatch === 'All' ? true : student.batch === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  const filteredUnassigned = unassignedStudents.filter((student) =>
    student.name?.toLowerCase().includes(assignSearch.toLowerCase()) ||
    student.email?.toLowerCase().includes(assignSearch.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Departmental Students</h1>
            <p className="text-gray-500 font-medium">Managing assignments for <span className="text-indigo-600 font-bold">{user.department}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium transition-all outline-none"
            >
              <option value="All">All Batches</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 w-full md:w-64 font-medium transition-all"
              />
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              <FiUserPlus /> Assign Students
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Students" value={students.length} icon={<FiUsers />} color="indigo" />
        <StatCard label="Active" value={students.filter(s => s.isActive).length} icon={<FiCheck />} color="green" />
        <StatCard label="Waitlist Pool" value={unassignedStudents.length} icon={<FiFilter />} color="amber" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Student Info</th>
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Academic ID</th>
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Batch / Year</th>
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <FiUsers className="text-gray-200 text-5xl mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest">No students assigned to this department</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg shadow-sm">
                        {student.name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{student.name}</p>
                        <p className="text-xs text-gray-400 font-medium">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-mono font-bold text-gray-500 uppercase tracking-tighter">
                    {student.studentId || "PENDING"}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-gray-700">{student.batch || "BATCH N/A"}</span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase tracking-tighter w-fit">
                        Year {student.yearOfStudy || "N/A"} • Sem {student.semester || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${student.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm font-bold text-gray-600 capitalize">{student.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(student)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit Details"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleRemoveStudent(student._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Remove from Department"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Students to Department"
      >
        <div className="space-y-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter unassigned students..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {filteredUnassigned.length === 0 ? (
              <p className="text-center py-10 text-gray-400 font-bold uppercase text-xs">No unassigned students found</p>
            ) : (
              filteredUnassigned.map(s => (
                <div key={s._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-indigo-50 transition-colors group">
                  <div>
                    <p className="font-bold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </div>
                  <button
                    disabled={assigning}
                    onClick={() => handleAssignStudent(s._id)}
                    className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    <FiCheck size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Student Details"
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">Batch</label>
              <input
                type="text"
                value={editFormData.batch}
                onChange={(e) => setEditFormData({ ...editFormData, batch: e.target.value })}
                placeholder="e.g. 2021/2022"
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">Status</label>
              <select
                value={editFormData.isActive}
                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">Year of Study</label>
              <select
                value={editFormData.yearOfStudy}
                onChange={(e) => setEditFormData({ ...editFormData, yearOfStudy: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">Semester</label>
              <select
                value={editFormData.semester}
                onChange={(e) => setEditFormData({ ...editFormData, semester: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-1"
            >
              Update Student Records
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center text-2xl shadow-sm`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-3xl font-black text-gray-800 tracking-tighter leading-none mt-1">{value}</p>
    </div>
  </div>
);

export default HodStudents;

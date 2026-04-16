import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { FiEdit2, FiTrash2, FiSearch, FiUserPlus, FiX, FiCheck, FiUsers, FiInfo, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const HodStaff = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState(null);
  const [staff, setStaff] = useState([]);
  const [unassignedLecturers, setUnassignedLecturers] = useState([]);
  const [search, setSearch] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editFormData, setEditFormData] = useState({
    lecturerId: '',
    isActive: true
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const departmentKey = user?.department;
      if (!departmentKey) return;

      const [deptRes, lecturersRes] = await Promise.all([
        api.get(`/api/departments/${encodeURIComponent(departmentKey)}`),
        api.get('/api/auth/users?role=lecturer')
      ]);

      const dept = deptRes.data.department;
      setDepartment(dept);

      const allLecturers = lecturersRes.data.users || [];
      
      // Staff in my department
      const myStaff = allLecturers.filter(l => 
        (l.department || '').toLowerCase() === departmentKey.toLowerCase()
      );
      setStaff(myStaff);

      // Unassigned lecturers (no department)
      const pool = allLecturers.filter(l => !l.department || l.department.trim() === '');
      setUnassignedLecturers(pool);

    } catch (error) {
      console.error('HOD staff error:', error);
      toast.error('Failed to load department staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStaff = async (lecturerId) => {
    setAssigning(true);
    try {
      await api.put(`/api/auth/users/${lecturerId}`, {
        department: user.department,
        faculty: user.faculty
      });
      toast.success('Staff assigned to department');
      fetchStaff();
    } catch (error) {
      toast.error('Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to remove this staff member from your department?')) return;
    try {
      await api.put(`/api/auth/users/${staffId}`, {
        department: '',
        faculty: ''
      });
      toast.success('Staff removed from department');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to remove staff');
    }
  };

  const handleEditClick = (staffer) => {
    setEditingStaff(staffer);
    setEditFormData({
      lecturerId: staffer.lecturerId || '',
      isActive: staffer.isActive !== undefined ? staffer.isActive : true
    });
    setShowEditModal(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/auth/users/${editingStaff._id}`, editFormData);
      toast.success('Staff updated successfully');
      setShowEditModal(false);
      fetchStaff();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const staffWithoutId = staff.filter((person) => !person.lecturerId);

  const filteredStaff = staff.filter((person) =>
    person.name?.toLowerCase().includes(search.toLowerCase()) ||
    person.email?.toLowerCase().includes(search.toLowerCase()) ||
    person.lecturerId?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase leading-none mb-2">Staff Directory</h1>
            <p className="text-gray-500 font-medium">Managing academic staff for <span className="text-indigo-600 font-bold">{user.department}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff..."
                className="pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 w-full md:w-64 font-medium transition-all"
              />
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              <FiUserPlus /> Assign Staff
            </button>
            <button
              onClick={fetchStaff}
              className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all"
              title="Refresh"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-left">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Staff Member</th>
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Staff ID</th>
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Role</th>
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <FiUsers className="text-gray-200 text-5xl mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest">No staff members found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStaff.map((staffer) => (
                <tr key={staffer._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg shadow-sm">
                        {staffer.name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{staffer.name}</p>
                        <p className="text-xs text-gray-400 font-medium">{staffer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-mono font-bold text-gray-500 uppercase tracking-tighter">
                    {staffer.lecturerId || "NOT SET"}
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {staffer.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${staffer.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm font-bold text-gray-600 capitalize">{staffer.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button
                        onClick={() => handleEditClick(staffer)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit Staff ID / Status"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleRemoveStaff(staffer._id)}
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
        title="Appoint New Department Staff"
      >
        <div className="space-y-6">
          <div className="p-4 bg-indigo-50 rounded-2xl flex items-center gap-4 text-indigo-700">
            <FiInfo className="text-xl shrink-0" />
            <p className="text-xs font-bold leading-tight uppercase tracking-wider">Select unassigned lecturers to bring them into your department.</p>
          </div>
          
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter unassigned staff..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {unassignedLecturers.filter(l => 
              l.name?.toLowerCase().includes(assignSearch.toLowerCase()) || 
              l.email?.toLowerCase().includes(assignSearch.toLowerCase())
            ).length === 0 ? (
              <p className="text-center py-10 text-gray-400 font-bold uppercase text-xs">No suitable candidates found</p>
            ) : (
              unassignedLecturers.filter(l => 
                l.name?.toLowerCase().includes(assignSearch.toLowerCase()) || 
                l.email?.toLowerCase().includes(assignSearch.toLowerCase())
              ).map(l => (
                <div key={l._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-indigo-50 transition-colors group">
                  <div>
                    <p className="font-bold text-gray-800">{l.name}</p>
                    <p className="text-xs text-gray-400">{l.email}</p>
                  </div>
                  <button
                    disabled={assigning}
                    onClick={() => handleAssignStaff(l._id)}
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

      {/* Edit Staff Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Staff Member"
      >
        <form onSubmit={handleUpdateStaff} className="space-y-6 pt-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Staff ID</label>
            <input
              type="text"
              value={editFormData.lecturerId}
              onChange={(e) => setEditFormData({ ...editFormData, lecturerId: e.target.value })}
              placeholder="e.g. L001"
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Account Status</label>
            <select
              value={editFormData.isActive}
              onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })}
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
            >
              <option value="true">Active Access</option>
              <option value="false">Inactive / Suspended</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform active:scale-95"
          >
            Update Staff Information
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default HodStaff;

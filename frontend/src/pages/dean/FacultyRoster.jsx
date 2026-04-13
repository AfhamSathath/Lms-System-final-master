import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/Authcontext';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { 
  FiUsers, FiUser, FiSearch, FiFilter, 
  FiEdit, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const FacultyRoster = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [facultyName, setFacultyName] = useState(user.faculty || '');

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const fetchFacultyData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all users
      const usersRes = await api.get('/api/auth/users');
      const allUsers = usersRes.data.users || [];
      
      // 2. Fetch departments to get the list for this faculty
      const deptsRes = await api.get('/api/departments');
      const allDepts = deptsRes.data.data || [];
      
      // Filter roster by faculty
      const facultyUsers = allUsers.filter(u => 
        (u.faculty === user.faculty) || (!u.faculty && u.role === 'student')
      );
      setRoster(facultyUsers);
      
      const facultyDepts = allDepts.filter(d => 
        d.faculty?.name === user.faculty || d.faculty === user.faculty
      );
      setDepartments(facultyDepts);

    } catch (err) {
      toast.error('Failed to load faculty roster');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/auth/users/${editingUser._id}`, {
        department: editingUser.department,
        faculty: user.faculty // Ensure they stay in this faculty
      });
      toast.success('User records updated');
      setShowEditModal(false);
      fetchFacultyData();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const filteredRoster = roster.filter(u => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesDept = deptFilter === 'all' || u.department === deptFilter;
    
    return matchesSearch && matchesRole && matchesDept;
  });

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <FiUsers className="text-9xl text-rose-600" />
          </div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-2">Faculty Roster</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <FiCheckCircle className="text-rose-600" /> Management Oversight for Faculty of {user.faculty || 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="md:col-span-2 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, ID or email..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-rose-500 transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div>
              <select 
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                 <option value="all">All Roles</option>
                 <option value="student">Students</option>
                 <option value="lecturer">Lecturers</option>
                 <option value="hod">HODs</option>
              </select>
           </div>
           <div>
              <select 
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                 <option value="all">All Departments</option>
                 {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
           </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden mb-12">
           <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400">User Identity</th>
                  <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Department</th>
                  <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Role</th>
                  <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRoster.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${u.role === 'student' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                             {u.name?.[0]}
                          </div>
                          <div>
                             <p className="font-black text-slate-700 uppercase tracking-tight">{u.name}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.studentId || u.lecturerId || 'No ID'}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-6">
                       {u.department ? (
                         <span className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-500 tracking-widest">
                           {u.department}
                         </span>
                       ) : (
                         <span className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                           <FiAlertCircle /> Unassigned
                         </span>
                       )}
                    </td>
                    <td className="px-10 py-6">
                       <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                         u.role === 'hod' ? 'bg-rose-500 text-white' : 
                         u.role === 'lecturer' ? 'bg-emerald-50 text-emerald-600' : 
                         'bg-indigo-50 text-indigo-600'
                       }`}>
                         {u.role}
                       </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <button 
                         onClick={() => { setEditingUser(u); setShowEditModal(true); }}
                         className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all transform active:scale-95 group-hover:shadow-lg group-hover:shadow-rose-100"
                       >
                         <FiEdit />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Move Department">
         <form onSubmit={handleUpdateUser} className="space-y-6 pt-4">
            <div className="p-6 bg-slate-50 rounded-[2.5rem] flex items-center gap-4 mb-4">
               <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center text-rose-600 text-2xl font-black">
                  {editingUser?.name?.[0]}
               </div>
               <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-tight">{editingUser?.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{editingUser?.role}</p>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assign to Department</label>
               <select 
                 className="w-full px-6 py-5 bg-slate-50 border-none rounded-[2rem] font-black uppercase text-xs focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
                 value={editingUser?.department || ''}
                 onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                 required
               >
                  <option value="">Select Target Department</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
               </select>
            </div>

            <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95">
               Confirm Department Assignment
            </button>
         </form>
      </Modal>
    </div>
  );
};

export default FacultyRoster;

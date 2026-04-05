import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiUsers, FiEdit2, FiTrash2, FiSearch, FiPlus, FiMail, FiPhone, FiBox, FiX, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const DeanHods = () => {
  const [hods, setHods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAppointModal, setShowAppointModal] = useState(false);
  const [editingHod, setEditingHod] = useState(null);

  useEffect(() => {
    fetchHods();
  }, []);

  const fetchHods = async () => {
    try {
      const res = await api.get('/api/stats/dashboard');
      // For Dean, the dashboard stats now include enriched hodStats
      if (res.data.data && res.data.data.hodStats) {
        setHods(res.data.data.hodStats);
      } else {
        // Fallback to basic list if dashboard doesn't provide nested stats
        const fallback = await api.get('/api/auth/users?role=hod');
        setHods(fallback.data.users || []);
      }
    } catch (err) {
      toast.error('Failed to fetch HODs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this HOD? They will still remain as a Lecturer.')) {
      try {
        // In this system, 'removal' might mean setting role back to lecturer or deactivating
        await api.put(`/api/auth/users/${id}`, { role: 'lecturer' });
        toast.success('HOD role revoked. User is now a Lecturer.');
        fetchHods();
      } catch (err) {
        toast.error('Failed to revoke HOD role');
      }
    }
  };

  const handleEdit = (hod) => {
    setEditingHod(hod);
    setShowAppointModal(true);
  };

  const filteredHods = hods.filter(hod =>
    hod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hod.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center animate-pulse text-rose-500 font-black uppercase tracking-tighter">Initializing Authority protocols...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">HOD Management</h1>
          <p className="text-gray-500 font-medium">Departmental Head Oversight & Governance</p>
        </div>
        <button 
          onClick={() => { setEditingHod(null); setShowAppointModal(true); }}
          className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-rose-200 flex items-center gap-2 hover:bg-rose-700 transition-all active:scale-95"
        >
          <FiPlus /> Appoint New HOD
        </button>
      </div>

      {/* Search & Filter */}
      <div className="relative mb-8">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Lookup by name or department..."
          className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-rose-500 transition-all font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredHods.map((hod, index) => (
            <motion.div
              key={hod._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                 <button 
                   onClick={() => handleEdit(hod)}
                   className="bg-rose-50 text-rose-600 p-2 rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors"
                 >
                   <FiEdit2 size={16} />
                 </button>
                 <button 
                   onClick={() => handleDelete(hod._id)}
                   className="bg-gray-50 text-gray-600 p-2 rounded-xl border border-gray-100 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                 >
                   <FiTrash2 size={16} />
                 </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-xl font-black shadow-lg">
                  {hod.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{hod.name}</h3>
                  <span className="text-xs font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full tracking-widest">{hod.department}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                 <div className="flex items-center gap-3 text-sm text-gray-600">
                    <FiMail className="text-rose-400" />
                    <span className="truncate">{hod.email}</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm text-gray-600">
                    <FiPhone className="text-rose-400" />
                    <span>{hod.phone || '+94 XX XXX XXXX'}</span>
                 </div>
              </div>

              <div className="pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                 <div className="text-center p-3 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">Lecturers</p>
                    <p className="text-lg font-black text-gray-800 tracking-tight">{hod.lecturerCount || 0}</p>
                 </div>
                 <div className="text-center p-3 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">Subjects</p>
                    <p className="text-lg font-black text-gray-800 tracking-tight">{hod.courseCount || 0}</p>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredHods.length === 0 && (
         <div className="text-center py-20 bg-white rounded-[40px] shadow-sm border border-dashed border-gray-200">
            <FiBox size={48} className="mx-auto text-gray-200 mb-4" />
            <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest">No HODs Found</h2>
         </div>
      )}

      {/* Appoint Modal */}
      <AppointHODModal 
        isOpen={showAppointModal} 
        onClose={() => { setShowAppointModal(false); setEditingHod(null); }}
        onSuccess={() => { setShowAppointModal(false); setEditingHod(null); fetchHods(); }}
        editingHod={editingHod}
      />
    </div>
  );
};

const AppointHODModal = ({ isOpen, onClose, onSuccess, editingHod }) => {
  const [searchLecturer, setSearchLecturer] = useState('');
  const [lecturers, setLecturers] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLecturers();
      if (editingHod) {
        setDepartment(editingHod.department);
        setSelectedLecturer(editingHod);
      } else {
        setDepartment('');
        setSelectedLecturer(null);
      }
    }
  }, [isOpen, editingHod]);

  const fetchLecturers = async () => {
    try {
      const res = await api.get('/api/auth/users?role=lecturer');
      setLecturers(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLecturer || !department) return toast.error('Check all fields');
    
    setLoading(true);
    try {
      if (editingHod) {
        await api.put(`/api/auth/users/${editingHod._id}`, { department });
        toast.success('HOD record updated');
      } else {
        await api.put(`/api/auth/users/${selectedLecturer._id}`, { role: 'hod', department });
        toast.success(`${selectedLecturer.name} appointed as HOD`);
      }
      onSuccess();
    } catch (err) {
      toast.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredLecturers = lecturers.filter(l => 
    l.name.toLowerCase().includes(searchLecturer.toLowerCase()) ||
    l.email.toLowerCase().includes(searchLecturer.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8 overflow-hidden"
      >
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
             {editingHod ? 'Update HOD Status' : 'New Appointment'}
           </h2>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"><FiX /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           {!editingHod && (
             <div>
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest block mb-2">Select Lecturer</label>
                <div className="relative mb-2">
                   <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                   <input 
                     type="text" 
                     placeholder="Search lecturer pool..."
                     className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 text-sm font-bold"
                     value={searchLecturer}
                     onChange={(e) => setSearchLecturer(e.target.value)}
                   />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 p-1 bg-gray-50 rounded-2xl">
                   {filteredLecturers.map(l => (
                     <button
                       key={l._id}
                       type="button"
                       onClick={() => setSelectedLecturer(l)}
                       className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${selectedLecturer?._id === l._id ? 'bg-rose-500 text-white' : 'hover:bg-gray-100'}`}
                     >
                        <span className="text-xs font-bold truncate">{l.name}</span>
                        {selectedLecturer?._id === l._id && <FiCheckCircle />}
                     </button>
                   ))}
                </div>
             </div>
           )}

           <div>
              <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest block mb-2">Department Assignment</label>
              <select 
                className="w-full py-3 px-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 text-sm font-bold appearance-none"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                 <option value="">Select Faculty Department</option>
                 <option value="Computer Science">Computer Science</option>
                 <option value="Software Engineering">Software Engineering</option>
                 <option value="Information Technology">Information Technology</option>
                 <option value="Data Science">Data Science</option>
              </select>
           </div>

           <button 
             type="submit" 
             disabled={loading}
             className="w-full py-4 bg-gray-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black transition-all disabled:opacity-50"
           >
             {loading ? 'Processing Appointment...' : editingHod ? 'Update Records' : 'Confirm Appointment'}
           </button>
        </form>
      </motion.div>
    </div>
  );
};

export default DeanHods;

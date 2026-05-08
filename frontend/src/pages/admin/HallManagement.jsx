import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiUsers, FiSearch, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const HallManagement = () => {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    location: '',
    isActive: true
  });

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
    withCredentials: true
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/halls');
      setHalls(res.data.halls);
    } catch (error) {
      toast.error('Failed to fetch halls');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHall) {
        await api.put(`/api/halls/${editingHall._id}`, formData);
        toast.success('Hall updated successfully');
      } else {
        await api.post('/api/halls', formData);
        toast.success('Hall created successfully');
      }
      setShowModal(false);
      setEditingHall(null);
      setFormData({ name: '', capacity: '', location: '', isActive: true });
      fetchHalls();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (hall) => {
    setEditingHall(hall);
    setFormData({
      name: hall.name,
      capacity: hall.capacity,
      location: hall.location || '',
      isActive: hall.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this hall?')) {
      try {
        await api.delete(`/api/halls/${id}`);
        toast.success('Hall deleted');
        fetchHalls();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const filteredHalls = halls.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.location && h.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Hall Capacity Management</h1>
            <p className="text-slate-500 font-bold text-sm">Configure exam halls and seating capacities centrally</p>
          </div>
          <button 
            onClick={() => {
              setEditingHall(null);
              setFormData({ name: '', capacity: '', location: '', isActive: true });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all transform hover:-translate-y-1 shadow-xl active:scale-95"
          >
            <FiPlus size={18} /> Add New Hall
          </button>
        </div>

        {/* Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-black p-4 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Halls</p>
            <p className="text-2xl font-black text-slate-800 italic">{halls.length}</p>
          </div>
          <div className="bg-white border border-black p-4 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Capacity</p>
            <p className="text-2xl font-black text-purple-600 italic">{halls.reduce((sum, h) => sum + (Number(h.capacity) || 0), 0)} Seats</p>
          </div>
          <div className="md:col-span-2 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by hall name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full bg-white border border-black px-12 rounded-3xl text-sm font-bold focus:ring-2 focus:ring-purple-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Halls Grid */}
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHalls.map((hall) => (
              <div key={hall._id} className={`group bg-white border-2 border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:translate-x-1 hover:translate-y-1 ${!hall.isActive ? 'opacity-60 grayscale' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {hall.name}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(hall)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-black">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(hall._id)} className="p-2 hover:bg-rose-50 rounded-xl transition-colors text-slate-600 hover:text-rose-600">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-black italic text-slate-800 leading-none">{hall.capacity}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seats Available</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                    <FiMapPin className="text-purple-500" />
                    {hall.location || 'No location specified'}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg ${hall.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {hall.isActive ? <><FiCheck /> Active</> : <><FiX /> Inactive</>}
                    </span>
                    <span className="text-[9px] font-bold text-slate-300 uppercase italic">
                      ID: {hall._id.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredHalls.length === 0 && !loading && (
          <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
            <FiMapPin className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-black uppercase tracking-widest">No halls found matching your search</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-4 border-black rounded-[3rem] w-full max-w-md overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-8 bg-black text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                  {editingHall ? 'Edit Hall' : 'Create Hall'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fill in the hall seating details</p>
              </div>
              <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-all p-2 bg-white/10 rounded-full">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Hall Name</label>
                <input 
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Main Auditorium"
                  className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-bold focus:border-black outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Capacity (Seats)</label>
                  <input 
                    required
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="100"
                    className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-bold focus:border-black outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col justify-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 hover:border-black transition-all">
                    <input 
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded accent-black"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-700">Active</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Location / Building</label>
                <input 
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Science Block, 2nd Floor"
                  className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-bold focus:border-black outline-none transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-4 border-2 border-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] active:scale-95"
                >
                  {editingHall ? 'Update Hall' : 'Create Hall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallManagement;

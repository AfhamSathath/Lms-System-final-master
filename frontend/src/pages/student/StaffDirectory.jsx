import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiUsers, FiMail, FiPhone, FiBookOpen, FiSearch, FiMapPin } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../components/common/model';
import { FiX, FiAward, FiBook } from 'react-icons/fi';

const StaffDirectory = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const openProfile = (member) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get('/api/auth/users?role=lecturer');
        setStaff(res.data.users || []);
      } catch (err) {
        console.error('Failed to fetch staff directory');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const filteredStaff = staff.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-black p-10 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <FiUsers className="text-9xl text-indigo-600" />
          </div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase leading-none mb-2">Staff Directory</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Connect with your academic mentors and faculty</p>
            
            <div className="mt-8 relative max-w-xl">
               <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
               <input 
                 type="text" 
                 placeholder="Search by name, department or specialization..."
                 className="w-full pl-12 pr-6 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold transition-all shadow-inner"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.length === 0 ? (
            <div className="col-span-full py-20 text-center">
               <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No staff members found matching your search</p>
            </div>
          ) : (
            filteredStaff.map((member, idx) => (
              <motion.div 
                key={member._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[2rem] p-6 border border-black hover:shadow-xl hover:shadow-indigo-50 transition-all group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl text-indigo-600 font-black shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500 overflow-hidden">
                    {member.profilePicture ? (
                      <img 
                        src={getImageUrl(member.profilePicture)} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : member.name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tighter leading-tight">{member.name}</h3>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{member.department || 'General Faculty'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <InfoItem icon={<FiBookOpen />} label="Specialization" value={member.specialization || 'Academic Staff'} />
                  <InfoItem icon={<FiMail />} label="Email" value={member.email} />
                  {member.phone && <InfoItem icon={<FiPhone />} label="Phone" value={member.phone} />}
                  <InfoItem icon={<FiMapPin />} label="Office" value={member.address || 'Academic Block'} />
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50">
                   <button 
                     onClick={() => openProfile(member)}
                     className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-colors shadow-lg active:scale-95 transform"
                   >
                     View Academic Profile
                   </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Profile Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Academic Profile"
          size="lg"
        >
          {selectedMember && (
            <div className="p-2">
              <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                <div className="w-32 h-32 rounded-3xl bg-indigo-50 flex items-center justify-center text-5xl text-indigo-600 font-black shadow-inner">
                  {selectedMember.profilePicture ? (
                     <img 
                       src={getImageUrl(selectedMember.profilePicture)} 
                       alt={selectedMember.name}
                       className="w-full h-full object-cover rounded-3xl"
                     />
                  ) : selectedMember.name?.[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-1">{selectedMember.name}</h2>
                  <p className="text-indigo-600 font-black uppercase tracking-[0.2em] text-sm mb-4">{selectedMember.department}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee ID</p>
                       <p className="font-bold text-slate-700">{selectedMember.lecturerId || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                       <p className="font-bold text-slate-700 truncate">{selectedMember.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 italic">
                    <FiAward className="text-indigo-500" /> Academic Qualifications
                  </h4>
                  <div className="bg-white p-6 rounded-[2rem] border border-black shadow-sm">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      {selectedMember.qualifications || "Information about academic qualifications and certifications is currently being verified and will be updated shortly."}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 italic">
                    <FiBook className="text-indigo-500" /> Research & Specialization
                  </h4>
                  <div className="bg-white p-6 rounded-[2rem] border border-black shadow-sm">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      {selectedMember.specialization || "Research focus and areas of academic specialization are currently being updated."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4">
                   <div className="flex items-center gap-3 text-slate-500">
                      <FiPhone className="text-indigo-400" />
                      <span className="text-sm font-bold">{selectedMember.phone || 'Contact not provided'}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-500">
                      <FiMapPin className="text-indigo-400" />
                      <span className="text-sm font-bold">{selectedMember.address || 'Main Campus'}</span>
                   </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 text-slate-400 group-hover:text-indigo-400 transition-colors">{icon}</div>
    <div>
      <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest leading-none mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-600 truncate">{value}</p>
    </div>
  </div>
);

export default StaffDirectory;

import React, { useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/common/loader';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBook,
  FiHash,
  FiEdit2,
  FiSave,
  FiX,
  FiCamera
} from 'react-icons/fi';
import ProfilePictureUpload from '../../components/common/ProfilePictureUpload';

const StudentProfile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    competitions: user?.competitions || []
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/api/users/profile', formData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setIsEditing(false);
  };

  const handleProfilePictureUpdate = (pictureUrl) => {
    updateUser({ ...user, profilePicture: pictureUrl });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Cover Photo */}
          <div className="h-32 bg-white border border-black"></div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Avatar with Upload */}
            <div className="relative -mt-16 mb-4">
              <ProfilePictureUpload
                currentPicture={user?.profilePicture}
                userName={user?.name}
                onUpdate={handleProfilePictureUpdate}
              />
            </div>

            {/* Edit Toggle */}
            <div className="absolute top-4 right-6">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-white border border-black text-slate-800 font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                >
                  <FiEdit2 className="mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-slate-900 text-white border border-black rounded-xl hover:bg-black transition-colors disabled:opacity-50 font-bold uppercase text-xs tracking-widest"
                  >
                    <FiSave className="mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 bg-white border border-black text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold uppercase text-xs tracking-widest"
                  >
                    <FiX className="mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Profile Details */}
            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Full Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email Address
                  </label>
                  <p className="text-lg text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Student ID
                  </label>
                  <p className="text-lg font-semibold text-blue-600">{user?.studentId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Department
                  </label>
                  <p className="text-lg text-gray-900">{user?.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Current Semester
                  </label>
                  <p className="text-lg font-semibold text-purple-600">Semester {user?.semester}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Phone Number
                  </label>
                  <p className="text-lg text-gray-900">{user?.phone || 'Not provided'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Address
                  </label>
                  <p className="text-lg text-gray-900">{user?.address || 'Not provided'}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label htmlFor="student-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="student-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Cannot be changed)
                  </label>
                  <input
                    id="student-email"
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full px-4 py-2 border border-black rounded-lg bg-white border border-black text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="student-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="student-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department (Cannot be changed)
                  </label>
                  <input
                    type="text"
                    value={user?.department}
                    disabled
                    className="w-full px-4 py-2 border border-black rounded-lg bg-white border border-black text-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="student-address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    id="student-address"
                    name="address"
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter your address"
                    className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Competitions Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-8 border border-black p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Competitions & Event Participation</h2>
              <p className="text-sm text-gray-500">Record your achievements and event roles</p>
            </div>
            <button 
              onClick={() => {
                const name = prompt('Competition/Event Name:');
                const role = prompt('Your Role (e.g. Participant, Lead, Organizer):');
                const achievement = prompt('Achievement (optional):');
                if (name && role) {
                  const newComp = { name, role, achievement, date: new Date() };
                  const updatedComps = [...(formData.competitions || []), newComp];
                  setFormData({ ...formData, competitions: updatedComps });
                  // Trigger a silent update or wait for profile save
                  toast.success('Added to list. Click "Save Profile" to finalize.');
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all"
            >
              + Add Participation
            </button>
          </div>

          <div className="space-y-4">
            {formData.competitions?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.competitions.map((comp, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-black rounded-2xl relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{comp.name}</p>
                        <p className="text-xs text-indigo-600 font-bold mt-1">{comp.role}</p>
                        {comp.achievement && (
                          <p className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded w-fit mt-2 font-black uppercase">
                            🏆 {comp.achievement}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400">
                          {new Date(comp.date).toLocaleDateString()}
                        </p>
                        <button 
                          onClick={() => {
                            const updated = formData.competitions.filter((_, i) => i !== idx);
                            setFormData({ ...formData, competitions: updated });
                          }}
                          className="text-rose-600 opacity-0 group-hover:opacity-100 transition-all mt-2"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-3xl">
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No competition records found</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-black">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                <FiBook className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="ml-3 font-black text-slate-800 uppercase text-xs tracking-widest">Extra Activities</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {user?.extraActivities?.length > 0 ? user.extraActivities.map((act, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                  {act}
                </span>
              )) : <p className="text-slate-400 italic text-xs">No activities recorded during registration</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-black">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                <FiUser className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="ml-3 font-black text-slate-800 uppercase text-xs tracking-widest">Account Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eligibility</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${user?.competitionEligibility ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {user?.competitionEligibility ? 'Tournament Ready' : 'Restricted'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standing</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${!user?.hasRepeats ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                  {!user?.hasRepeats ? 'Clear Standing' : 'Repeat Subjects'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
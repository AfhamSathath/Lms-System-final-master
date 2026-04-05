import React, { useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/common/loader';
import ProfilePictureUpload from '../../components/common/ProfilePictureUpload';
import { FiEdit2, FiSave, FiX, FiLock } from 'react-icons/fi';

const HodProfile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const submitProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.put('/api/users/profile', formData);
      updateUser(response.data.user);
      toast.success('Profile updated');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error('Password must have at least 6 characters');
    }
    setIsLoading(true);
    try {
      const userId = user?.id || user?._id;
      await api.put(`/api/users/${userId}/update-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password updated');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password update failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">HOD Profile</h1>
            <p className="text-gray-600">Manage your personal information</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <FiEdit2 className="inline mr-2" /> {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="mb-6">
          <ProfilePictureUpload
            currentPicture={user?.profilePicture}
            userName={user?.name}
            onUpdate={(url) => updateUser({ ...user, profilePicture: url })}
          />
        </div>

        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="text-lg font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="text-lg font-medium capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-lg font-medium">{user?.phone || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-lg font-medium">{user?.address || '-'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={submitProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" value={formData.name} onChange={handleChange} className="border p-2 rounded-lg" placeholder="Full Name" required />
            <input name="phone" value={formData.phone} onChange={handleChange} className="border p-2 rounded-lg" placeholder="Phone" />
            <input name="address" value={formData.address} onChange={handleChange} className="border p-2 rounded-lg" placeholder="Address" />
            <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Bio" className="border p-2 rounded-lg md:col-span-2" rows={3} />
            <button type="submit" disabled={isLoading} className="bg-green-600 text-white rounded-lg px-4 py-2 md:col-span-2">
              {isLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}

        <div className="mt-8 bg-gray-100 p-4 rounded-lg">
          <h2 className="font-semibold">Change Password</h2>
          <form onSubmit={submitPassword} className="grid grid-cols-1 gap-3 mt-3">
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Current Password"
              className="border p-2 rounded-lg"
              required
            />
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              placeholder="New Password"
              className="border p-2 rounded-lg"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Confirm Password"
              className="border p-2 rounded-lg"
              required
            />
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white rounded-lg px-4 py-2 self-start">
              <FiLock className="inline mr-2" /> {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HodProfile;

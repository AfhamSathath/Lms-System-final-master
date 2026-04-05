import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { FiPlus, FiSend, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const HodNotifications = () => {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    recipientIds: [],
    role: '',
    title: '',
    message: '',
    type: 'GENERAL',
    priority: 'MEDIUM',
    link: ''
  });

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    try {
      const [usersRes, notifRes, unreadRes] = await Promise.all([
        api.get('/api/auth/users'),
        api.get('/api/notifications'),
        api.get('/api/notifications/unread-count')
      ]);
      setUsers(usersRes.data.users || []);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(unreadRes.data.count || 0);
    } catch (error) {
      console.error('Failed to load notifications', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const updateUnreadCount = (list) => {
    setUnreadCount(list.filter((n) => !n.isRead).length);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      const updated = notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n));
      setNotifications(updated);
      updateUnreadCount(updated);
      toast.success('Marked as read');
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      const updated = notifications.map((n) => ({ ...n, isRead: true }));
      setNotifications(updated);
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      const updated = notifications.filter((n) => n._id !== id);
      setNotifications(updated);
      updateUnreadCount(updated);
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await api.delete('/api/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All cleared');
    } catch {
      toast.error('Failed to clear');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      return toast.error('Title and message required');
    }
    if (!formData.role && formData.recipientIds.length === 0) {
      return toast.error('Select users or role');
    }

    try {
      setSending(true);
      await api.post('/api/notifications/send', formData);
      toast.success('Notification sent');
      setFormData({ recipientIds: [], role: '', title: '', message: '', type: 'GENERAL', priority: 'MEDIUM', link: '' });
      setShowModal(false);
      fetchInitial();
    } catch (error) {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, options } = e.target;
    if (name === 'recipientIds') {
      const selected = Array.from(options).filter((o) => o.selected).map((o) => o.value);
      setFormData((prev) => ({ ...prev, recipientIds: selected }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notifications]);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">HOD Notifications ({unreadCount} unread)</h1>
          <p className="text-purple-100">Send important department announcements</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleMarkAllAsRead} className="bg-white text-purple-700 px-4 py-2 rounded-lg">Mark All</button>
          <button onClick={handleClearAll} className="bg-red-500 text-white px-4 py-2 rounded-lg">Clear All</button>
          <button onClick={() => setShowModal(true)} className="bg-white text-purple-700 px-4 py-2 rounded-lg flex items-center">
            <FiPlus className="mr-1" /> New
          </button>
        </div>
      </div>

      {sortedNotifications.length === 0 ? (
        <p className="text-center text-gray-500">No notifications</p>
      ) : (
        <div className="space-y-4">
          {sortedNotifications.map((notif) => (
            <div key={notif._id} className={`p-4 rounded-xl shadow ${notif.isRead ? 'bg-gray-100' : 'bg-purple-50'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{notif.title}</h3>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                  <small className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleString()}</small>
                </div>
                <div className="space-x-2">
                  {!notif.isRead && <button onClick={() => handleMarkAsRead(notif._id)} className="text-green-600">Mark read</button>}
                  <button onClick={() => handleDelete(notif._id)} className="text-red-600">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Send Notification" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600">Title</label>
              <input value={formData.title} name="title" onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Message</label>
              <textarea value={formData.message} name="message" onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={4} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600">Role (Optional)</label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">General (all users)</option>
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="hod">HOD</option>
                  <option value="admin">Admin</option>
                  <option value="dean">Dean</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Link (Optional)</label>
                <input value={formData.link} name="link" onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={sending} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default HodNotifications;

import api from './api';

const getPendingRepeatRegistrations = () => api.get('/api/repeat-registration/hod/pending');

const reviewRepeatRegistration = (id, action, comments = '') =>
  api.put(`/api/repeat-registration/${id}/hod-review`, { action, comments });

export default {
  getPendingRepeatRegistrations,
  reviewRepeatRegistration,
};

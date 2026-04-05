import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import hodService from '../../services/hodService';
import Loader from '../../components/common/loader';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiSearch, FiUser, FiBook, FiClock, FiAlertCircle } from 'react-icons/fi';

const HodRepeatApprovals = () => {
  const { user } = useAuth();
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  const fetchPendingRegistrations = async () => {
    setLoading(true);
    try {
      const response = await hodService.getPendingRepeatRegistrations();
      setPendingRegistrations(response.data.data || []);
    } catch (error) {
      console.error('Error loading HOD repeat approvals', error);
      toast.error('Failed to load repeat applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, action) => {
    const comments = action === 'REJECT' ? window.prompt('Enter rejection reason:') : window.prompt('Optional note for approval:');

    if (action === 'REJECT' && !comments) {
      toast.error('Please provide a reason for rejection.');
      return;
    }

    setProcessingId(id);
    try {
      await hodService.reviewRepeatRegistration(id, action, comments || '');
      toast.success(`Application ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
      fetchPendingRegistrations();
    } catch (error) {
      console.error('Review failed', error);
      toast.error('Unable to update application status.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="container mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-slate-500 font-semibold">HOD Portal</p>
            <h1 className="text-4xl font-extrabold text-slate-900">Repeat Registration Approvals</h1>
            <p className="mt-2 text-slate-500 max-w-2xl">Review pending repeat subject applications from your department and advance them through the institutional workflow.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <div className="text-slate-400 text-xs uppercase tracking-[0.3em]">Pending Requests</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">{pendingRegistrations.length}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-12">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
              <table className="w-full min-w-max overflow-hidden text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 tracking-[0.1em] uppercase text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Previous Grade</th>
                    <th className="px-6 py-4">Submitted</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        No pending repeat applications at the moment.
                      </td>
                    </tr>
                  ) : (
                    pendingRegistrations.map((registration) => {
                      const student = registration.student || {};
                      const subject = registration.subject || {};
                      return (
                        <tr key={registration._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-5 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-bold">
                                {student.name?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{student.name || 'Student'}</p>
                                <p className="text-xs text-slate-400 uppercase tracking-[0.14em]">{student.studentId || student._id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <p className="font-semibold text-slate-900">{subject.name || registration.subjectName || 'Unknown Subject'}</p>
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{subject.code || registration.subjectCode}</p>
                          </td>
                          <td className="px-6 py-5 max-w-[220px] text-slate-600 text-sm leading-relaxed">
                            {registration.reason || registration.notes || 'No reason provided.'}
                          </td>
                          <td className="px-6 py-5">
                            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                              {registration.previousAttempt?.grade || registration.previousGrade || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-slate-500 text-xs uppercase tracking-[0.14em]">
                            {registration.studentSubmittedAt ? new Date(registration.studentSubmittedAt).toLocaleDateString() : 'Unknown'}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-wrap gap-3">
                              <button
                                disabled={processingId === registration._id}
                                onClick={() => handleReview(registration._id, 'APPROVE')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiCheck /> Approve
                              </button>
                              <button
                                disabled={processingId === registration._id}
                                onClick={() => handleReview(registration._id, 'REJECT')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiX /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HodRepeatApprovals;

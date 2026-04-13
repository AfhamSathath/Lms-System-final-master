import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiBook, FiAlertTriangle, FiCheck, FiX, FiUser, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

const HODAttendanceReview = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, attendance, discrepancies, pending
  const [filterBatch, setFilterBatch] = useState('all');

  useEffect(() => {
    fetchEnrollmentsWithDiscrepancies();
  }, [user]);

  const fetchEnrollmentsWithDiscrepancies = async () => {
    setLoading(true);
    try {
      console.log('HOD User:', { name: user?.name, department: user?.department, id: user?.id });
      
      // Get all enrollments for HOD's department (backend already filters by department)
      const response = await api.get('/api/enrollments');
      const allData = response.data.enrollments || [];
      console.log('Total enrollments from API:', allData.length);
      
      if (allData.length > 0) {
        console.log('Sample enrollment:', {
          id: allData[0]._id,
          student: allData[0].student?.name,
          course: allData[0].course?.courseName,
          attendanceCount: allData[0].attendance?.length || 0,
          hasMarked: allData[0].attendance?.some(r => r.markedBy),
          hasStudentConfirmed: allData[0].attendance?.some(r => r.studentConfirmed),
          hasHODUpdated: allData[0].attendance?.some(r => r.updatedByHOD)
        });
      }

      // Store all enrollments
      setAllEnrollments(allData);

      // Filter for enrollments with attendance issues to review
      const withIssues = allData.filter(enrollment => {
        const hasAttendance = enrollment.attendance && enrollment.attendance.length > 0;
        const hasUnreviewedRecords = enrollment.attendance?.some(record =>
          record.markedBy && !record.updatedByHOD
        );

        return hasAttendance && hasUnreviewedRecords;
      });

      console.log('Enrollments requiring HOD review:', {
        total: withIssues.length,
        breakdown: {
          withAttendance: allData.filter(e => e.attendance?.length > 0).length,
          withMarkedRecords: allData.filter(e => e.attendance?.some(r => r.markedBy)).length,
          withUnreviewedByHOD: allData.filter(e => e.attendance?.some(r => r.markedBy && !r.updatedByHOD)).length,
          alreadyReviewedByHOD: allData.filter(e => e.attendance?.some(r => r.updatedByHOD)).length
        }
      });
      
      setEnrollments(withIssues);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAttendance = async (enrollmentId, attendanceUpdates) => {
    setReviewing(true);
    try {
      await api.put(`/api/enrollments/${enrollmentId}/review-attendance`, {
        attendanceUpdates
      });
      toast.success('Attendance review completed successfully');
      fetchEnrollmentsWithDiscrepancies(); // Refresh data
      setSelectedEnrollment(null);
    } catch (error) {
      console.error('Error reviewing attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to complete review');
    } finally {
      setReviewing(false);
    }
  };

  const getFilteredEnrollments = () => {
    let baseEnrollments = allEnrollments;
    
    // Apply search
    if (searchTerm) {
      baseEnrollments = baseEnrollments.filter(enrollment =>
        enrollment.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.course?.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.course?.courseCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply batch filter
    if (filterBatch !== 'all') {
      baseEnrollments = baseEnrollments.filter(enrollment =>
        enrollment.academicYear === filterBatch
      );
    }

    // Apply filter type
    if (filterType === 'attendance') {
      // Show only enrollments with attendance records
      baseEnrollments = baseEnrollments.filter(enrollment =>
        enrollment.attendance && enrollment.attendance.length > 0
      );
    } else if (filterType === 'discrepancies') {
      // Show only enrollments with discrepancies
      baseEnrollments = baseEnrollments.filter(enrollment =>
        enrollment.attendance?.some(record =>
          record.studentConfirmed && record.status === 'absent'
        )
      );
    } else if (filterType === 'pending') {
      // Show only enrollments with pending reviews (marked but not reviewed by HOD)
      baseEnrollments = baseEnrollments.filter(enrollment =>
        enrollment.attendance?.some(record =>
          record.markedBy && !record.updatedByHOD
        )
      );
    }

    return baseEnrollments;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-100 text-emerald-700';
      case 'absent': return 'bg-rose-100 text-rose-700';
      case 'late': return 'bg-amber-100 text-amber-700';
      case 'excused': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <Loader fullScreen />;

  const filteredEnrollments = getFilteredEnrollments();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 font-outfit">Attendance Review</h1>
        <p className="text-gray-600 mt-2">Review student attendance confirmations and resolve discrepancies</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name, ID, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-4">
            <select 
              value={filterBatch} 
              onChange={(e) => setFilterBatch(e.target.value)}
              className="px-4 py-3 bg-gray-100 border-0 rounded-xl font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Batches</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2023/2024">2023/2024</option>
              <option value="2022/2023">2022/2023</option>
              <option value="2021/2022">2021/2022</option>
              <option value="Repeat Batch (All)">Repeat Batch (All)</option>
            </select>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Enrollments' },
                { value: 'attendance', label: 'With Attendance' },
                { value: 'pending', label: 'Requires Review' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    filterType === filter.value
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
              <p className="text-2xl font-bold text-gray-800">{allEnrollments.length}</p>
            </div>
            <FiBook className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With Attendance Records</p>
              <p className="text-2xl font-bold text-green-600">
                {allEnrollments.filter(e => e.attendance?.length > 0).length}
              </p>
            </div>
            <FiCheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Requiring Review</p>
              <p className="text-2xl font-bold text-red-600">
                {allEnrollments.filter(e => e.attendance?.some(r => r.markedBy && !r.updatedByHOD)).length}
              </p>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Enrollment List */}
      <div className="space-y-6">
        {filteredEnrollments.length > 0 ? filteredEnrollments.map((enrollment) => (
          <EnrollmentReviewCard
            key={enrollment._id}
            enrollment={enrollment}
            onReview={handleReviewAttendance}
            reviewing={reviewing}
            isSelected={selectedEnrollment === enrollment._id}
            onSelect={setSelectedEnrollment}
            getStatusColor={getStatusColor}
          />
        )) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xl">
            <FiBook className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Records Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all'
                ? 'No records match your current filters.'
                : 'No attendance records require review at this time.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const EnrollmentReviewCard = ({ enrollment, onReview, reviewing, isSelected, onSelect, getStatusColor }) => {
  const [reviews, setReviews] = useState({});

  const recordsNeedingReview = enrollment.attendance?.filter(record =>
    record.markedBy && !record.updatedByHOD
  ) || [];

  const handleReview = async () => {
    const reviewData = Object.entries(reviews).map(([date, data]) => ({
      date,
      status: data.status,
      hodRemarks: data.remarks || ''
    }));

    if (reviewData.length === 0) {
      toast.error('Please review at least one attendance record');
      return;
    }

    await onReview(enrollment._id, reviewData);
    setReviews({});
  };

  const hasDiscrepancies = enrollment.attendance?.some(record =>
    record.studentConfirmed && record.status === 'absent'
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-md rounded-full p-3">
              <FiUser className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{enrollment.student?.name}</h3>
              <p className="text-indigo-100">{enrollment.student?.studentId}</p>
            </div>
          </div>
          <div className="text-right">
            <h4 className="text-lg font-bold text-white">{enrollment.course?.courseCode}</h4>
            <p className="text-indigo-100 text-sm">{enrollment.course?.courseName}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Status Summary */}
        <div className="flex flex-wrap gap-2 mb-6">
          {hasDiscrepancies && (
            <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              <FiAlertTriangle className="w-3 h-3" />
              Has Discrepancies
            </div>
          )}
          <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <FiClock className="w-3 h-3" />
            {recordsNeedingReview.length} Need Review
          </div>
          <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            Attendance: {enrollment.attendancePercentage}%
          </div>
        </div>

        {/* Review Button */}
        {recordsNeedingReview.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => onSelect(isSelected ? null : enrollment._id)}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                isSelected
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isSelected ? 'Cancel Review' : `Review ${recordsNeedingReview.length} Records`}
            </button>
          </div>
        )}

        {/* Review Form */}
        {isSelected && recordsNeedingReview.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
            <h5 className="font-semibold text-indigo-800 mb-4">Review Attendance Records</h5>
            <div className="space-y-4">
              {recordsNeedingReview.map((record, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FiCalendar className="text-gray-400" />
                      <span className="font-medium text-gray-700">
                        {new Date(record.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Lecturer marked:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  </div>

                  {record.studentRemarks && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Student Remarks:</strong> {record.studentRemarks}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Your Decision:</span>
                      <div className="flex gap-1">
                        {['present', 'absent', 'late', 'excused'].map(status => (
                          <button
                            key={status}
                            onClick={() => setReviews(prev => ({
                              ...prev,
                              [record.date]: { ...prev[record.date], status }
                            }))}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              reviews[record.date]?.status === status
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <textarea
                      placeholder="Add remarks (optional)"
                      value={reviews[record.date]?.remarks || ''}
                      onChange={(e) => setReviews(prev => ({
                        ...prev,
                        [record.date]: { ...prev[record.date], remarks: e.target.value }
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows="2"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => onSelect(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewing || Object.keys(reviews).length === 0}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reviewing ? 'Submitting Review...' : 'Complete Review'}
              </button>
            </div>
          </div>
        )}

        {/* Attendance History */}
        <div className="space-y-3">
          <h5 className="font-semibold text-gray-700 flex items-center">
            <FiClock className="mr-2" />
            Recent Attendance Records
          </h5>
          <div className="space-y-2">
            {enrollment.attendance?.slice(-5).reverse().map((record, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <FiCalendar className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  {record.studentConfirmed && (
                    <FiCheckCircle className="w-4 h-4 text-green-500" title="Student Confirmed" />
                  )}
                  {record.updatedByHOD && (
                    <FiCheckCircle className="w-4 h-4 text-blue-500" title="HOD Reviewed" />
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(record.status)}`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HODAttendanceReview;
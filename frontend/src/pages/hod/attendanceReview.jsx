import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiBook, FiAlertTriangle, FiCheck, FiX, FiUser, FiSearch, FiChevronDown, FiChevronUp, FiPieChart, FiActivity } from 'react-icons/fi';
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
  const [expandedStudents, setExpandedStudents] = useState({});

  useEffect(() => {
    fetchEnrollmentsWithDiscrepancies();
  }, [user]);

  const toggleStudent = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

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

  const handlePublishAttendance = async (enrollmentId) => {
    try {
      await api.put(`/api/enrollments/${enrollmentId}/publish-attendance`);
      toast.success('Attendance published to student successfully');
      fetchEnrollmentsWithDiscrepancies(); // Refresh to update status
    } catch (error) {
      console.error('Error publishing attendance:', error);
      if (error.response?.data?.debug) {
        console.log('Publication failure debug info:', error.response.data.debug);
      }
      toast.error(error.response?.data?.message || 'Failed to publish attendance');
    }
  };

  const getFilteredEnrollments = () => {
    let baseEnrollments = allEnrollments;
    
    // Apply search
    if (searchTerm) {
      baseEnrollments = baseEnrollments.filter(enrollment =>
        enrollment.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.course?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.academicYear?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const groupedByStudent = React.useMemo(() => {
    const studentMap = {};
    const filtered = getFilteredEnrollments();
    
    filtered.forEach(e => {
      const sId = e.student?._id;
      if (!sId) return;
      
      if (!studentMap[sId]) {
        studentMap[sId] = {
          student: e.student,
          semesters: {},
          enrollments: [],
          totalEnrollments: 0,
          needsReviewTotal: 0,
          academicYear: e.academicYear
        };
      }
      
      const sem = e.semester || 1;
      if (!studentMap[sId].semesters[sem]) {
        studentMap[sId].semesters[sem] = [];
      }
      
      studentMap[sId].enrollments.push(e);
      studentMap[sId].semesters[sem].push(e);
      studentMap[sId].totalEnrollments++;
      studentMap[sId].needsReviewTotal += (e.attendance?.filter(r => r.markedBy && !r.updatedByHOD).length || 0);
    });
    
    // Sort students by name
    return Object.values(studentMap).sort((a, b) => 
      (a.student?.name || '').localeCompare(b.student?.name || '')
    );
  }, [allEnrollments, searchTerm, filterBatch, filterType]);

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
              <p className="text-sm font-medium text-gray-600">Avg. Attendance Rate</p>
              <p className="text-2xl font-bold text-indigo-600">
                {allEnrollments.length > 0
                  ? (allEnrollments.reduce((acc, curr) => acc + (curr.attendancePercentage || 0), 0) / allEnrollments.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <FiPieChart className="w-8 h-8 text-indigo-500" />
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

      {/* Student List */}
      <div className="space-y-8">
        {groupedByStudent.length > 0 ? groupedByStudent.map((group) => (
          <StudentAttendanceDashboard
            key={group.student._id}
            group={group}
            onReview={handleReviewAttendance}
            onPublish={handlePublishAttendance}
            reviewing={reviewing}
            selectedEnrollment={selectedEnrollment}
            onSelectEnrollment={setSelectedEnrollment}
            getStatusColor={getStatusColor}
            isExpanded={expandedStudents[group.student._id]}
            onToggle={() => toggleStudent(group.student._id)}
          />
        )) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xl">
            <FiBook className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Records Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterBatch !== 'all'
                ? 'No students match your current filters.'
                : 'No attendance records found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const StudentAttendanceDashboard = ({ 
  group, onReview, onPublish, reviewing, selectedEnrollment, onSelectEnrollment, getStatusColor, isExpanded, onToggle 
}) => {
  const { student, semesters, needsReviewTotal, totalEnrollments } = group;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
      {/* Student Profile Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 shadow-inner">
                <FiUser className="w-10 h-10 text-white" />
              </div>
              {needsReviewTotal > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce shadow-lg">
                  {needsReviewTotal}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">{student?.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-indigo-100 text-sm font-medium tracking-wide bg-white/10 px-3 py-0.5 rounded-full">{student?.studentId}</span>
                <span className="h-1 w-1 bg-white/30 rounded-full"></span>
                <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">{student?.department}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
              <p className="text-white/60 text-[10px] uppercase font-black tracking-widest mb-1">Enrolled Subjects</p>
              <p className="text-xl font-black text-white">{totalEnrollments}</p>
            </div>
            <button 
              onClick={onToggle}
              className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl text-white transition-all shadow-lg active:scale-95"
            >
              {isExpanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Card Section (Always Visible) */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {/* Summary Stats */}
           <div className="md:col-span-4 bg-slate-50 rounded-2xl p-1 mb-2 border border-slate-100 flex gap-1">
              {[
                { label: 'Overall Status', value: needsReviewTotal > 0 ? 'Review Required' : 'Up to Date', icon: FiActivity, color: needsReviewTotal > 0 ? 'text-amber-600' : 'text-emerald-600' },
                { label: 'Academic Year', value: group.academicYear, icon: FiCalendar, color: 'text-indigo-600' },
                { label: 'Action Items', value: `${needsReviewTotal} discrepancies`, icon: FiAlertTriangle, color: needsReviewTotal > 0 ? 'text-rose-600' : 'text-slate-400' }
              ].map((stat, i) => (
                <div key={i} className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="mt-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {Object.entries(semesters).sort().map(([sem, enrollments]) => (
              <div key={sem} className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <FiActivity className="text-indigo-500" />
                    Semester {sem} Summary
                  </h4>
                  <span className="px-4 py-1 bg-white border border-slate-200 text-slate-500 rounded-full text-xs font-bold uppercase tracking-widest">
                    {enrollments.length} Subjects
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {enrollments.map(enrollment => (
                    <SubjectStatItem 
                      key={enrollment._id}
                      enrollment={enrollment}
                      onReview={onReview}
                      onPublish={onPublish}
                      reviewing={reviewing}
                      isSelected={selectedEnrollment === enrollment._id}
                      onSelect={() => onSelectEnrollment(selectedEnrollment === enrollment._id ? null : enrollment._id)}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Global Last Attendance Log */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
                <h5 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                  <FiClock className="text-indigo-400" />
                  Consolidated Attendance History
                </h5>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Combined Subject Log</span>
              </div>
              <div className="p-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-black uppercase text-[10px] text-slate-500 tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Time / Hr</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(group.enrollments || []).flatMap(e => 
                      (e.attendance || []).map(r => ({ ...r, course: e.course }))
                    ).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map((record, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700 text-sm">
                            {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-indigo-600 uppercase">{record.startTime || '---'}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{record.lecturerHour || '-'} Hrs Session</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-slate-600 uppercase">{record.course?.code}</p>
                          <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{record.course?.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {record.studentConfirmed && <FiCheckCircle className="text-emerald-500" title="Student Confirmed" />}
                            {record.updatedByHOD && <FiCheckCircle className="text-indigo-500" title="HOD Verified" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SubjectStatItem = ({ enrollment, onReview, onPublish, reviewing, isSelected, onSelect, getStatusColor }) => {
  const [reviews, setReviews] = useState({});
  const [publishing, setPublishing] = useState(false);

  const recordsNeedingReview = enrollment.attendance?.filter(record =>
    record.markedBy && !record.updatedByHOD
  ) || [];

  const recordsNeedingPublish = enrollment.attendance?.filter(record =>
    record.markedBy && !record.isPublished
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

  const handlePublish = async () => {
    setPublishing(true);
    await onPublish(enrollment._id);
    setPublishing(false);
  };

  const hasDiscrepancies = enrollment.attendance?.some(record =>
    record.studentConfirmed && record.status === 'absent'
  );

  return (
    <div className={`bg-white rounded-2xl border transition-all ${isSelected ? 'ring-2 ring-indigo-500 border-transparent shadow-lg' : 'border-slate-200'}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">{enrollment.course?.name}</h5>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">{enrollment.course?.code}</p>
          </div>
          <div className="text-right">
            <div className={`text-lg font-black ${enrollment.attendancePercentage < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {enrollment.attendancePercentage}%
            </div>
            <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full ${enrollment.attendancePercentage < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                style={{ width: `${enrollment.attendancePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {hasDiscrepancies && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-rose-100">
              <FiAlertTriangle size={10} /> Discrepancy
            </span>
          )}
          {recordsNeedingReview.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-100">
              <FiClock size={10} /> {recordsNeedingReview.length} Pending
            </span>
          )}
        </div>

        <button 
          onClick={onSelect}
          className={`w-full py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
            isSelected 
              ? 'bg-rose-50 text-rose-600 border border-rose-200' 
              : recordsNeedingReview.length > 0
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
          disabled={recordsNeedingReview.length === 0 && !isSelected}
        >
          {isSelected ? 'Cancel Review' : recordsNeedingReview.length > 0 ? `Review ${recordsNeedingReview.length} Records` : 'No Actions Pending'}
        </button>

        {recordsNeedingPublish.length > 0 && !isSelected && (
          <button 
            onClick={handlePublish}
            disabled={publishing}
            className="w-full mt-2 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : `Publish ${recordsNeedingPublish.length} Records`}
          </button>
        )}

        {/* Review Form - Same logic as before but adapted to this component */}
        {isSelected && recordsNeedingReview.length > 0 && (
          <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
             <div className="space-y-3">
                {recordsNeedingReview.map((record, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         {new Date(record.date).toLocaleDateString()}
                       </span>
                       <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(record.status)}`}>
                         Originally: {record.status}
                       </span>
                    </div>
                    
                    {record.studentRemarks && (
                      <div className="mb-2 p-2 bg-indigo-50 rounded-md text-[10px] text-indigo-700 italic border-l-2 border-indigo-300">
                         "{record.studentRemarks}"
                      </div>
                    )}

                    <div className="flex gap-1 mb-2">
                       {['present', 'absent', 'late', 'excused'].map(status => (
                         <button
                           key={status}
                           onClick={() => setReviews(prev => ({
                             ...prev,
                             [record.date]: { ...prev[record.date], status }
                           }))}
                           className={`flex-1 py-1 px-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${
                             reviews[record.date]?.status === status
                               ? 'bg-indigo-600 text-white'
                               : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                           }`}
                         >
                           {status}
                         </button>
                       ))}
                    </div>

                    <textarea
                      placeholder="HOD Remarks..."
                      className="w-full text-[10px] p-2 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400"
                      rows="1"
                      onChange={(e) => setReviews(prev => ({
                        ...prev,
                        [record.date]: { ...prev[record.date], remarks: e.target.value }
                      }))}
                    />
                  </div>
                ))}
             </div>
             <button 
                onClick={handleReview}
                className="w-full mt-3 py-2 bg-indigo-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 disabled:opacity-50"
                disabled={reviewing || Object.keys(reviews).length === 0}
             >
                {reviewing ? 'Saving...' : 'Submit Decision'}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HODAttendanceReview;
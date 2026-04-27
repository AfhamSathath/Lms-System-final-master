import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiBook, FiAlertTriangle, FiUser, FiSearch, FiBarChart2, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminAttendanceDetails = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [attendanceDetails, setAttendanceDetails] = useState(null);
  const [academicSummary, setAcademicSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  useEffect(() => {
    fetchEnrollments();
  }, [user]);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/enrollments');
      setEnrollments(response.data.enrollments || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load enrollment records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicSummary = async (studentId) => {
    try {
      const response = await api.get(`/api/results/transcript/${studentId}`);
      if (response.data && response.data.success) {
        setAcademicSummary(response.data.transcript);
      } else {
        setAcademicSummary(null);
      }
    } catch (error) {
      console.error('Error fetching academic summary:', error);
      setAcademicSummary(null);
    }
  };

  const fetchAttendanceDetails = async (enrollmentId) => {
    setDetailsLoading(true);
    setAcademicSummary(null);
    try {
      const response = await api.get(`/api/enrollments/${enrollmentId}/attendance-details`);
      setAttendanceDetails(response.data);
      
      if (response.data?.enrollment?.student?._id) {
        fetchAcademicSummary(response.data.enrollment.student._id);
      }
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      toast.error('Failed to load attendance details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const getFilteredEnrollments = () => {
    let filtered = enrollments.filter(enrollment =>
      enrollment.attendance && enrollment.attendance.length > 0
    );

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(enrollment =>
        enrollment.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.course?.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by department
    if (departmentFilter) {
      filtered = filtered.filter(enrollment =>
        enrollment.student?.department === departmentFilter
      );
    }

    // Filter by course
    if (courseFilter) {
      filtered = filtered.filter(enrollment =>
        enrollment.course?._id === courseFilter
      );
    }

    // Filter by batch
    if (batchFilter) {
      filtered = filtered.filter(enrollment =>
        enrollment.academicYear === batchFilter
      );
    }

    return filtered;
  };

  const getDepartments = () => {
    const departments = [...new Set(enrollments.map(e => e.student?.department).filter(Boolean))];
    return departments;
  };

  const getCourses = () => {
    const uniqueCourses = [];
    const courseIds = new Set();
    enrollments.forEach(e => {
      if (e.course && !courseIds.has(e.course._id)) {
        courseIds.add(e.course._id);
        uniqueCourses.push(e.course);
      }
    });
    return uniqueCourses;
  };

  const getBatches = () => {
    const batches = [...new Set(enrollments.map(e => e.academicYear).filter(Boolean))];
    return batches;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-100 text-emerald-700';
      case 'absent': return 'bg-rose-100 text-rose-700';
      case 'late': return 'bg-amber-100 text-amber-700';
      case 'excused': return 'bg-white border border-black text-slate-700';
      default: return 'bg-white border border-black text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <FiCheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'absent': return <FiXCircle className="w-4 h-4 text-red-600" />;
      case 'late': return <FiClock className="w-4 h-4 text-amber-600" />;
      case 'excused': return <FiCheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <FiClock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) return <Loader fullScreen />;

  const filteredEnrollments = getFilteredEnrollments();
  const departments = getDepartments();
  const courses = getCourses();
  const batches = getBatches();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 font-outfit">Attendance Management</h1>
        <p className="text-gray-600 mt-2">Comprehensive attendance overview and detailed records</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-black">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students or courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-black rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-3 border border-black rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-4 py-3 border border-black rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>

          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="px-4 py-3 border border-black rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Batches</option>
            {batches.map(batch => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setDepartmentFilter('');
              setCourseFilter('');
              setBatchFilter('');
            }}
            className="px-4 py-3 bg-white border border-black text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-800">{filteredEnrollments.length}</p>
            </div>
            <FiBook className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredEnrollments.length > 0
                  ? Math.round(filteredEnrollments.reduce((sum, e) => sum + (e.attendancePercentage || 0), 0) / filteredEnrollments.length)
                  : 0}%
              </p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Discrepancies</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredEnrollments.filter(e =>
                  e.attendance?.some(r => r.studentConfirmed && r.status === 'absent')
                ).length}
              </p>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-amber-600">
                {filteredEnrollments.filter(e =>
                  e.attendance?.some(r => r.studentConfirmed && !r.updatedByHOD)
                ).length}
              </p>
            </div>
            <FiClock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enrollment List */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Student Records</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredEnrollments.map((enrollment) => (
              <div
                key={enrollment._id}
                onClick={() => {
                  setSelectedEnrollment(enrollment._id);
                  fetchAttendanceDetails(enrollment._id);
                }}
                className={`bg-white rounded-xl shadow-lg p-4 border-2 cursor-pointer transition-all hover:shadow-xl ${
                  selectedEnrollment === enrollment._id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-black hover:border-black'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800">{enrollment.student?.name}</h4>
                    <p className="text-sm text-gray-600">{enrollment.student?.studentId}</p>
                    <p className="text-xs text-gray-500">{enrollment.student?.department}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-600">{enrollment.attendancePercentage}%</div>
                    <div className="text-xs text-gray-500">Attendance</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-700">{enrollment.course?.code}</p>
                    <p className="text-sm text-gray-600">{enrollment.course?.name}</p>
                  </div>
                  <div className="flex gap-1">
                    {enrollment.attendance?.some(r => r.studentConfirmed && r.status === 'absent') && (
                      <FiAlertTriangle className="w-4 h-4 text-red-500" title="Has Discrepancies" />
                    )}
                    {enrollment.attendance?.some(r => r.studentConfirmed && !r.updatedByHOD) && (
                      <FiClock className="w-4 h-4 text-amber-500" title="Pending Review" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed View */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Detailed Attendance</h3>
          {detailsLoading ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Loader />
              <p className="text-gray-600 mt-4">Loading attendance details...</p>
            </div>
          ) : attendanceDetails ? (
            <div className="bg-white rounded-xl shadow-lg border border-black">
              {/* Header */}
              <div className="bg-white border border-black px-6 py-5 text-slate-900">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xl font-bold">{attendanceDetails.enrollment.student.name}</h4>
                  <span className="text-indigo-100 bg-white/20 px-2 py-1 rounded-md text-sm">{attendanceDetails.enrollment.student.studentId}</span>
                </div>
                <p className="text-indigo-50 font-medium text-lg leading-snug">
                  {attendanceDetails.enrollment.course.code} - {attendanceDetails.enrollment.course.name}
                </p>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm text-indigo-200">
                    {attendanceDetails.enrollment.academicYear} | Semester {attendanceDetails.enrollment.semester} | Department: {attendanceDetails.enrollment.student.department || 'N/A'}
                  </p>
                  {academicSummary && (
                    <div className="bg-white text-slate-700 px-3 py-1 rounded-lg shadow-sm flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">CGPA</span>
                      <span className="text-lg font-bold">{academicSummary.cgpa ? academicSummary.cgpa.toFixed(2) : 'N/A'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Summary Detailed */}
              {academicSummary && (
                <div className="p-6 border-b border-black bg-white/50">
                  <h5 className="font-bold text-gray-700 mb-4 flex items-center">
                    <FiBook className="mr-2 text-indigo-500" />
                    Academic Profile Summary
                  </h5>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-black shadow-sm flex flex-col justify-center items-center">
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Total Credits</div>
                      <div className="text-2xl font-black text-slate-800">
                        {academicSummary.totalCredits || 0}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-black shadow-sm flex flex-col justify-center items-center">
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Total Points</div>
                      <div className="text-2xl font-black text-slate-800">
                        {academicSummary.totalGradePoints ? academicSummary.totalGradePoints.toFixed(1) : 0}
                      </div>
                    </div>
                    <div className="col-span-2 bg-white p-4 rounded-xl border border-black shadow-sm">
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Program Snapshot</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Current Course:</span>
                          <span className="font-medium text-gray-800 truncate pl-2" title={attendanceDetails.enrollment.course.name}>
                            {attendanceDetails.enrollment.course.name}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Department:</span>
                          <span className="font-medium text-gray-800">
                            {attendanceDetails.enrollment.student.department || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="p-6 border-b border-black">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{attendanceDetails.statistics.present}</div>
                    <div className="text-xs text-gray-600">Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{attendanceDetails.statistics.absent}</div>
                    <div className="text-xs text-gray-600">Absent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{attendanceDetails.statistics.late}</div>
                    <div className="text-xs text-gray-600">Late</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{attendanceDetails.statistics.excused}</div>
                    <div className="text-xs text-gray-600">Excused</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">{attendanceDetails.statistics.confirmedByStudent}</div>
                    <div className="text-xs text-slate-700">Student Confirmed</div>
                  </div>
                  <div className="bg-white border border-black p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-purple-600">{attendanceDetails.statistics.reviewedByHOD}</div>
                    <div className="text-xs text-slate-700">HOD Reviewed</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-red-600">{attendanceDetails.statistics.discrepancies}</div>
                    <div className="text-xs text-slate-700">Discrepancies</div>
                  </div>
                </div>
              </div>

              {/* Attendance Records */}
              <div className="p-6">
                <h5 className="font-bold text-gray-700 mb-4 flex items-center">
                  <FiCalendar className="mr-2" />
                  Attendance History
                </h5>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {attendanceDetails.attendance.map((record, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-black">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(record.status)}
                          <div>
                            <span className="font-medium text-gray-800">
                              {new Date(record.date).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              {record.studentConfirmed && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-black text-slate-700 rounded-full text-xs">
                                  <FiCheckCircle className="w-3 h-3" />
                                  Student Confirmed
                                </span>
                              )}
                              {record.updatedByHOD && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-black text-slate-700 rounded-full text-xs">
                                  <FiCheckCircle className="w-3 h-3" />
                                  HOD Reviewed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>

                      {record.remarks && (
                        <div className="mt-2 p-2 bg-white rounded border-l-4 border-black">
                          <p className="text-sm text-gray-700">
                            <strong>Lecturer:</strong> {record.remarks}
                          </p>
                        </div>
                      )}

                      {record.studentRemarks && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-300">
                          <p className="text-sm text-slate-800">
                            <strong>Student:</strong> {record.studentRemarks}
                          </p>
                        </div>
                      )}

                      {record.hodRemarks && (
                        <div className="mt-2 p-2 bg-white border border-black rounded border-l-4 border-purple-300">
                          <p className="text-sm text-slate-800">
                            <strong>HOD:</strong> {record.hodRemarks}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-black">
              <FiBarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-gray-800 mb-2">Select a Record</h4>
              <p className="text-gray-600">Click on a student record to view detailed attendance information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAttendanceDetails;
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiBook, FiAlertTriangle, FiUser, FiSearch, FiChevronDown, FiChevronUp, FiPieChart, FiActivity, FiTrendingUp, FiBarChart2, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminAttendanceDetails = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [expandedStudents, setExpandedStudents] = useState({});

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

  const toggleStudent = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const getFilteredEnrollments = () => {
    let filtered = enrollments.filter(enrollment =>
      enrollment.attendance && enrollment.attendance.length > 0
    );

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(enrollment =>
        enrollment.student?.name?.toLowerCase().includes(term) ||
        enrollment.student?.studentId?.toLowerCase().includes(term) ||
        enrollment.course?.name?.toLowerCase().includes(term) ||
        enrollment.course?.code?.toLowerCase().includes(term)
      );
    }

    if (filterBatch !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.academicYear === filterBatch);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.student?.department === departmentFilter);
    }

    if (filterType === 'discrepancies') {
      filtered = filtered.filter(enrollment =>
        enrollment.attendance?.some(record => record.studentConfirmed && record.status === 'absent')
      );
    } else if (filterType === 'pending') {
      filtered = filtered.filter(enrollment =>
        enrollment.attendance?.some(record => record.markedBy && !record.updatedByHOD)
      );
    }

    return filtered;
  };

  const groupedByStudent = useMemo(() => {
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
    
    return Object.values(studentMap).sort((a, b) => 
      (a.student?.name || '').localeCompare(b.student?.name || '')
    );
  }, [enrollments, searchTerm, filterBatch, filterType]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-100 text-emerald-700';
      case 'absent': return 'bg-rose-100 text-rose-700';
      case 'late': return 'bg-amber-100 text-amber-700';
      case 'excused': return 'bg-white border border-black text-slate-700';
      default: return 'bg-white border border-black text-gray-700';
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 font-outfit">Attendance Management</h1>
        <p className="text-gray-600 mt-2">Comprehensive attendance overview and detailed records</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-black">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name, ID, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-black rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-4">
            <select 
              value={filterBatch} 
              onChange={(e) => setFilterBatch(e.target.value)}
              className="px-4 py-3 bg-white border border-black rounded-xl font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Batches</option>
              {[...new Set(enrollments.map(e => e.academicYear).filter(Boolean))].map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
            <select 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-black rounded-xl font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Departments</option>
              {[...new Set(enrollments.map(e => e.student?.department).filter(Boolean))].map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'discrepancies', label: 'Discrepancies' },
                { value: 'pending', label: 'Under Review' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    filterType === filter.value
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-white border border-black text-gray-700 hover:bg-gray-200'
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-800">{enrollments.length}</p>
            </div>
            <FiBook className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Attendance</p>
              <p className="text-2xl font-bold text-indigo-600">
                {enrollments.length > 0
                  ? (enrollments.reduce((acc, curr) => acc + (curr.attendancePercentage || 0), 0) / enrollments.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <FiPieChart className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Discrepancies</p>
              <p className="text-2xl font-bold text-red-600">
                {enrollments.filter(e => e.attendance?.some(r => r.studentConfirmed && r.status === 'absent')).length}
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
                {enrollments.filter(e => e.attendance?.some(r => r.markedBy && !r.updatedByHOD)).length}
              </p>
            </div>
            <FiClock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-8">
        {groupedByStudent.length > 0 ? groupedByStudent.map((group) => (
          <StudentAttendanceDashboard
            key={group.student._id}
            group={group}
            getStatusColor={getStatusColor}
            isExpanded={expandedStudents[group.student._id]}
            onToggle={() => toggleStudent(group.student._id)}
          />
        )) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-black shadow-xl">
            <FiBook className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Records Found</h3>
            <p className="text-gray-600">No attendance records found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StudentAttendanceDashboard = ({ group, getStatusColor, isExpanded, onToggle }) => {
  const { student, semesters, needsReviewTotal, totalEnrollments } = group;
  const [academicSummary, setAcademicSummary] = useState(null);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(null);

  useEffect(() => {
    if (isExpanded && !academicSummary) {
      fetchAcademicSummary();
    }
  }, [isExpanded]);

  const fetchAcademicSummary = async () => {
    try {
      const response = await api.get(`/api/results/transcript/${student._id}`);
      if (response.data && response.data.success) {
        setAcademicSummary(response.data.transcript);
      }
    } catch (error) {
      // If student has no results, the API returns 404. Handle this gracefully.
      if (error.response?.status !== 404) {
        console.error('Error fetching academic summary:', error);
      }
      setAcademicSummary(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-black overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <div className="bg-white border border-black p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="bg-slate-100 rounded-2xl p-4 shadow-inner border border-black">
                <FiUser className="w-10 h-10 text-slate-700" />
              </div>
              {needsReviewTotal > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce shadow-lg">
                  {needsReviewTotal}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{student?.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-slate-600 text-sm font-medium tracking-wide bg-slate-100 px-3 py-0.5 rounded-full border border-black">{student?.studentId}</span>
                <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                <span className="text-indigo-600 text-xs font-bold uppercase tracking-widest">{student?.department}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl border border-black">
              <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Enrolled Subjects</p>
              <p className="text-xl font-black text-slate-900">{totalEnrollments}</p>
            </div>
            <button 
              onClick={onToggle}
              className="p-3 bg-white hover:bg-slate-100 border border-black rounded-2xl text-slate-800 transition-all shadow-sm active:scale-95"
            >
              {isExpanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="md:col-span-4 bg-white rounded-2xl p-1 mb-2 border border-black flex gap-1">
              {[
                { label: 'Overall Status', value: needsReviewTotal > 0 ? 'Review Required' : 'Up to Date', icon: FiActivity, color: needsReviewTotal > 0 ? 'text-amber-600' : 'text-emerald-600' },
                { label: 'Academic Year', value: group.academicYear, icon: FiCalendar, color: 'text-indigo-600' },
                { label: 'Action Items', value: `${needsReviewTotal} discrepancies`, icon: FiAlertTriangle, color: needsReviewTotal > 0 ? 'text-rose-600' : 'text-slate-400' }
              ].map((stat, i) => (
                <div key={i} className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-black flex items-center gap-4">
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

        {isExpanded && (
          <div className="mt-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {academicSummary && (
              <div className="bg-slate-50 rounded-3xl p-6 border border-black">
                <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
                  <FiBarChart2 className="text-indigo-500" />
                  Academic Profile Summary
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-black shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CGPA</p>
                    <p className="text-2xl font-black text-slate-800">{academicSummary.cgpa?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-black shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Credits</p>
                    <p className="text-2xl font-black text-slate-800">{academicSummary.totalCredits || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-black shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Grade Points</p>
                    <p className="text-2xl font-black text-slate-800">{academicSummary.totalGradePoints?.toFixed(1) || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-black shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                    <p className="text-lg font-black text-emerald-600 uppercase">Active</p>
                  </div>
                </div>
              </div>
            )}

            {Object.entries(semesters).sort().map(([sem, enrollments]) => (
              <div key={sem} className="bg-white/50 rounded-3xl p-6 border border-black">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <FiActivity className="text-indigo-500" />
                    Semester {sem} Summary
                  </h4>
                  <span className="px-4 py-1 bg-white border border-black text-slate-500 rounded-full text-xs font-bold uppercase tracking-widest">
                    {enrollments.length} Subjects
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {enrollments.map(enrollment => (
                    <SubjectStatItem 
                      key={enrollment._id}
                      enrollment={enrollment}
                      isSelected={selectedEnrollmentId === enrollment._id}
                      onSelect={() => setSelectedEnrollmentId(selectedEnrollmentId === enrollment._id ? null : enrollment._id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-white border border-black rounded-3xl overflow-hidden shadow-sm">
              <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
                <h5 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                  <FiClock className="text-indigo-400" />
                  {selectedEnrollmentId ? (
                    `Attendance History: ${group.enrollments.find(e => e._id === selectedEnrollmentId)?.course?.name}`
                  ) : (
                    'Consolidated Attendance History'
                  )}
                </h5>
                <div className="flex items-center gap-4">
                  {selectedEnrollmentId && (
                    <button 
                      onClick={() => setSelectedEnrollmentId(null)}
                      className="text-[10px] text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-full font-bold uppercase tracking-widest transition-colors"
                    >
                      Show All Subjects
                    </button>
                  )}
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    {selectedEnrollmentId ? 'Subject Log' : 'Combined Subject Log'}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white border-b border-black font-black uppercase text-[10px] text-slate-500 tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {group.enrollments
                      .filter(e => !selectedEnrollmentId || e._id === selectedEnrollmentId)
                      .flatMap(e => 
                        (e.attendance || []).map(r => ({ ...r, course: e.course }))
                      )
                      .sort((a,b) => new Date(b.date) - new Date(a.date))
                      .slice(0, selectedEnrollmentId ? 50 : 10)
                      .map((record, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                          {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
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

const SubjectStatItem = ({ enrollment, isSelected, onSelect }) => {
  const hasDiscrepancies = enrollment.attendance?.some(record =>
    record.studentConfirmed && record.status === 'absent'
  );

  const pendingReviewCount = enrollment.attendance?.filter(record =>
    record.markedBy && !record.updatedByHOD
  ).length || 0;

  return (
    <div 
      onClick={onSelect}
      className={`bg-white rounded-2xl border cursor-pointer transition-all ${
        isSelected 
          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-lg scale-[1.02]' 
          : 'border-black hover:border-indigo-400 hover:shadow-md'
      } p-4`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h5 className={`text-sm font-black uppercase tracking-tight transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-800'}`}>
            {enrollment.course?.name}
          </h5>
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

      <div className="flex flex-wrap gap-2">
        {hasDiscrepancies && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-rose-100">
            <FiAlertTriangle size={10} /> Discrepancy
          </span>
        )}
        {pendingReviewCount > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-100">
            <FiClock size={10} /> {pendingReviewCount} Pending Review
          </span>
        )}
      </div>
    </div>
  );
};

export default AdminAttendanceDetails;
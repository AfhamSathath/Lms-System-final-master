import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiBook, FiUsers, FiFile, FiCalendar, FiBarChart2, FiBell, FiAlertCircle, FiAward, FiFileText, FiArrowRight, FiCheckCircle, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const HodDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState(null);
  const [pendingRepeats, setPendingRepeats] = useState(0);
  const [stats, setStats] = useState({ courses: 0, staff: 0, students: 0, assignments: 0, uploads: 0, admins: 0, lecturers: 0, hods: 0, deans: 0 });
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    staff: [],
    files: [],
    timetable: [],
    students: [],
    pendingAssessments: []
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      let departmentRes;
      let dept = null;

      // Primary: fetch department(s) via HOD scoped endpoint
      try {
        departmentRes = await api.get('/api/departments');
        dept = departmentRes.data.departments?.[0] || departmentRes.data.department || null;
      } catch (err) {
        // Fallback to explicit lookup by user.department (name/code/id) when needed
        if (user?.department) {
          try {
            departmentRes = await api.get(`/api/departments/${encodeURIComponent(user.department)}`);
            dept = departmentRes.data.department || null;
          } catch (innerErr) {
            console.warn('Fallback department lookup failed', innerErr);
            dept = null;
          }
        } else {
          throw err;
        }
      }

      // Another fallback: if primary returned empty list but user.department exists
      if (!dept && user?.department) {
        try {
          departmentRes = await api.get(`/api/departments/${encodeURIComponent(user.department)}`);
          dept = departmentRes.data.department || null;
        } catch (err) {
          console.warn('Secondary fallback department lookup failed', err);
        }
      }

      // If Department document doesn't exist in MongoDB but the user has a department string,
      // create a mock object to proceed to string-based endpoints.
      if (!dept && user?.department) {
        dept = { name: user.department };
      }

      setDepartment(dept);

      if (!dept) {
        setStats({ courses: 0, staff: 0, students: 0, assignments: 0, uploads: 0, admins: 0, lecturers: 0, hods: 0, deans: 0, upcomingExams: 0 });
        return;
      }

      const departmentKey = dept.name || dept.code || dept._id;

      const requests = await Promise.allSettled([
        api.get(`/api/departments/${encodeURIComponent(departmentKey)}/courses`),
        api.get(`/api/departments/${encodeURIComponent(departmentKey)}/staff`),
        api.get(`/api/lecturer-assignments/department/${encodeURIComponent(departmentKey)}`),
        api.get(`/api/subject-files/department/${encodeURIComponent(departmentKey)}`),
        api.get('/api/timetables/upcoming'),
        api.get('/api/auth/users'),
        api.get('/api/repeat-registration/hod/pending'),
        api.get('/api/assessments/hod/pending'),
        api.get('/api/enrollments'),
        api.get('/api/attendance-sessions/hod/pending')
      ]);

      const courses = requests[0].status === 'fulfilled' ? requests[0].value.data.courses || [] : [];
      const staff = requests[1].status === 'fulfilled' ? requests[1].value.data.staff || [] : [];
      const assignments = requests[2].status === 'fulfilled' ? requests[2].value.data.data || [] : [];
      const files = requests[3].status === 'fulfilled' ? requests[3].value.data.files || [] : [];
      const timetable = requests[4].status === 'fulfilled' ? requests[4].value.data.timetables || [] : [];
      const pendingRepeatsResponse = requests[6].status === 'fulfilled' ? requests[6].value.data : null;
      const pendingRepeatCount = pendingRepeatsResponse?.count || 0;
      const pendingAssessments = requests[7].status === 'fulfilled' ? requests[7].value.data.assessments || [] : [];
      const enrollments = requests[8].status === 'fulfilled' ? requests[8].value.data.enrollments || [] : [];
      const pendingAttendanceSessions = requests[9].status === 'fulfilled' ? requests[9].value.data.sessions || [] : [];

      const userData = requests[5].status === 'fulfilled' ? requests[5].value.data : { users: [] };
      const allUsers = Array.isArray(userData) ? userData : (userData.users || []);
      const counts = userData.counts || {};

      const adminCount = counts.admin !== undefined ? counts.admin : allUsers.filter(u => u.role === 'admin').length;
      const lecturerCount = counts.lecturer !== undefined ? counts.lecturer : allUsers.filter(u => u.role === 'lecturer').length;
      const hodCount = counts.hod !== undefined ? counts.hod : allUsers.filter(u => u.role === 'hod').length;
      const deanCount = counts.dean !== undefined ? counts.dean : allUsers.filter(u => u.role === 'dean').length;

      const departmentStudents = allUsers.filter((student) => {
        if (student.role !== 'student') return false;
        const studentDept = (student.department || '').toString().trim().toLowerCase();
        const departmentNames = [dept.name, dept.code, dept._id?.toString()].filter(Boolean).map((val) => val.toString().trim().toLowerCase());
        return departmentNames.includes(studentDept);
      });

      // Extract recent attendance across all subjects
      const recentAttendance = enrollments
        .flatMap(e => (e.attendance || []).map(r => ({ ...r, student: e.student, course: e.course })))
        .sort((a, b) => new Date(b.markedAt || b.date) - new Date(a.markedAt || b.date))
        .slice(0, 5);

      setStats({
        courses: courses.length,
        staff: staff.length,
        students: departmentStudents.length,
        assignments: assignments.length,
        uploads: files.length,
        upcomingExams: timetable.length,
        admins: adminCount,
        lecturers: lecturerCount,
        hods: hodCount,
        deans: deanCount,
        totalAttendancePercentage: enrollments.length > 0 
          ? (enrollments.reduce((acc, curr) => acc + (curr.attendancePercentage || 0), 0) / enrollments.length).toFixed(1)
          : 0,
        pendingAttendanceCount: pendingAttendanceSessions.length
      });
      setPendingRepeats(pendingRepeatCount);

      setDashboardData({
        courses: courses.slice(0, 5),
        staff: staff.slice(0, 5),
        files: files.slice(0, 5),
        timetable: timetable.slice(0, 5),
        students: departmentStudents.slice(0, 5),
        pendingAssessments: pendingAssessments,
        recentAttendance: recentAttendance,
        pendingAttendanceSessions: pendingAttendanceSessions
      });
    } catch (error) {
      console.error('HOD dashboard load failed', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6">
      <div className="container mx-auto">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome, Dr. {user?.name?.split(' ')[0] || user?.name}</h1>
              <p className="text-purple-200">Department: {department?.name || user?.department || 'Unassigned'}</p>
            </div>
            <Link
              to="/hod/notifications"
              className="bg-white text-purple-700 px-5 py-3 rounded-lg hover:bg-purple-50 transition-colors font-semibold inline-flex items-center"
            >
              <FiBell className="mr-2" /> Manage Notifications
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[{
            label: 'Courses', value: stats.courses, icon: FiBook
          }, {
            label: 'Staff', value: stats.staff, icon: FiUsers
          }, {
            label: 'Students', value: stats.students, icon: FiUsers
          }, {
            label: 'Repeat Requests', value: pendingRepeats, icon: FiAlertCircle
          }, {
            label: 'Material Uploads', value: stats.uploads, icon: FiFile
          }, {
            label: 'Assignments', value: stats.assignments, icon: FiBarChart2
          }, {
            label: 'Upcoming Exams', value: stats.upcomingExams, icon: FiCalendar
          }].map((item, idx) => (
            <div key={`${item.label}-${idx}`} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <item.icon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[{
            label: 'Admins', value: stats.admins, icon: FiUsers
          }, {
            label: 'Lecturers', value: stats.lecturers, icon: FiUsers
          }, {
            label: 'HODs', value: stats.hods, icon: FiUsers
          }, {
            label: 'Deans', value: stats.deans, icon: FiUsers
          }].map((item, idx) => (
            <div key={`${item.label}-${idx}`} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <item.icon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Assessment Review Workflow */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] mb-2 px-3 py-1 bg-emerald-50 rounded-lg inline-block">Assessment Workflow</p>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Submitted Assessments</h2>
                  <p className="text-slate-500 text-sm mt-1">Review and approve lecturer evaluations for your department.</p>
                </div>
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <FiAward className="h-6 w-6" />
                </div>
              </div>

              {dashboardData.pendingAssessments.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.pendingAssessments.slice(0, 3).map((assess) => (
                    <div key={assess._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-emerald-50/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                          <FiFileText />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{assess.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{assess.subject?.code} • By {assess.lecturer?.name}</p>
                        </div>
                      </div>
                      <Link
                        to={`/hod/subject/${assess.subject?._id}/assessments`}
                        className="p-2 text-indigo-600 hover:bg-white rounded-lg transition-all"
                      >
                        <FiArrowRight className="h-5 w-5" />
                      </Link>
                    </div>
                  ))}
                  {dashboardData.pendingAssessments.length > 3 && (
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">+{dashboardData.pendingAssessments.length - 3} more pending</p>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <FiCheckCircle className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-slate-400 font-bold text-sm">All assessments reviewed!</p>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Approval Workflow */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.3em] mb-2 px-3 py-1 bg-amber-50 rounded-lg inline-block">Attendance Approval</p>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Pending Sessions</h2>
                  <p className="text-slate-500 text-sm mt-1">Approve attendance logs submitted by department lecturers.</p>
                </div>
                <div className="w-14 h-14 bg-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                  <FiClock className="h-6 w-6" />
                </div>
              </div>

              {dashboardData.pendingAttendanceSessions?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.pendingAttendanceSessions.slice(0, 3).map((session) => (
                    <div key={session._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-amber-50/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm">
                          <FiCheckCircle />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{session.subject?.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{session.subject?.code} • By {session.lecturer?.name}</p>
                        </div>
                      </div>
                      <Link 
                        to={`/hod/subject/${session.subject?._id}/attendance`}
                        className="p-2 text-indigo-600 hover:bg-white rounded-lg transition-all"
                      >
                        <FiArrowRight className="h-5 w-5" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <FiCheckCircle className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-slate-400 font-bold text-sm">No attendance pending approval!</p>
                </div>
              )}
            </div>
          </div>

          {/* Repeat Registration Workflow */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] mb-2 px-3 py-1 bg-indigo-50 rounded-lg inline-block">Registration Workflow</p>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Repeat Requests</h2>
                  <p className="text-slate-500 text-sm mt-1">Review student applications for repeat subject registrations.</p>
                </div>
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <FiAlertCircle className="h-6 w-6" />
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div>
                  <p className="text-3xl font-black text-slate-800">{pendingRepeats}</p>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pending Approvals</p>
                </div>
                <Link
                  to="/hod/repeats"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Review All
                </Link>
              </div>
            </div>

            {/* Published Attendance Log */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.3em] mb-2 px-3 py-1 bg-blue-50 rounded-lg inline-block">Attendance Feed</p>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Attendance Activity</h2>
                    <p className="text-slate-500 text-sm mt-1">Latest attendance records published by department lecturers.</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <FiCheckCircle className="h-6 w-6" />
                  </div>
                </div>

                {dashboardData.recentAttendance?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentAttendance.map((record, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-blue-50/30 transition-colors">
                        <div className="flex items-center gap-4 truncate">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
                            <FiUsers />
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-slate-800 text-sm truncate">{record.student?.name}</p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate">
                              {record.course?.code} • {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                          {record.status}
                        </span>
                      </div>
                    ))}
                    <Link to="/hod/attendance-review" className="block text-center text-[10px] font-black uppercase text-blue-600 tracking-widest hover:underline pt-2">View Detailed Analytics</Link>
                  </div>
                ) : (
                  <div className="py-10 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <FiCalendar className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                    <p className="text-slate-400 font-bold text-sm">No recent attendance marked.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Recent Courses */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Courses</h2>
              </div>
              {dashboardData.courses.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.courses.map(course => (
                    <div key={course._id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-gray-800">{course.name || course.courseName}</p>
                        <p className="text-sm text-gray-500">{course.code || course.courseCode}</p>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                        Credits: {course.credits}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent courses</p>
              )}
            </div>

            {/* Department Staff */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Department Staff</h2>
              </div>
              {dashboardData.staff.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.staff.map(member => (
                    <div key={member._id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-gray-800">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        {member.role || 'Staff'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No staff members found</p>
              )}
            </div>

            {/* Department Students */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Department Students</h2>
                  <p className="text-sm text-gray-500">Latest students in your department</p>
                </div>
                <Link
                  to="/hod/students"
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                >
                  View all
                </Link>
              </div>
              {dashboardData.students.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.students.map((student) => (
                    <div key={student._id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-gray-800">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.studentId || student.email}</p>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                        {student.yearOfStudy ? `${student.yearOfStudy} Year` : 'Student'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No students found for this department</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <h3 className="font-semibold text-gray-800 mb-2">Review Department Subjects</h3>
              <p className="text-sm text-gray-500">Manage course offerings and lecturer assignments</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <h3 className="font-semibold text-gray-800 mb-2">Department Staff</h3>
              <p className="text-sm text-gray-500">Monitor lecturers and HOD assignment status</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <h3 className="font-semibold text-gray-800 mb-2">Teaching Materials</h3>
              <p className="text-sm text-gray-500">Upload guidelines and verify compliance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HodDashboard;

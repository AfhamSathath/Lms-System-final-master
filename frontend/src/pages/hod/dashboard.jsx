import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiBook, FiUsers, FiFile, FiCalendar, FiBarChart2, FiBell, FiAlertCircle } from 'react-icons/fi';
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
    students: []
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
          dept = null;
        }
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
        api.get('/api/repeat-registration/hod/pending')
      ]);

      const courses = requests[0].status === 'fulfilled' ? requests[0].value.data.courses || [] : [];
      const staff = requests[1].status === 'fulfilled' ? requests[1].value.data.staff || [] : [];
      const assignments = requests[2].status === 'fulfilled' ? requests[2].value.data.data || [] : [];
      const files = requests[3].status === 'fulfilled' ? requests[3].value.data.files || [] : [];
      const timetable = requests[4].status === 'fulfilled' ? requests[4].value.data.timetables || [] : [];
      const pendingRepeatsResponse = requests[6].status === 'fulfilled' ? requests[6].value.data : null;
      const pendingRepeatCount = pendingRepeatsResponse?.count || 0;
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
        deans: deanCount
      });
      setPendingRepeats(pendingRepeatCount);

      setDashboardData({
        courses: courses.slice(0, 5),
        staff: staff.slice(0, 5),
        files: files.slice(0, 5),
        timetable: timetable.slice(0, 5),
        students: departmentStudents.slice(0, 5)
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

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.28em]">Repeat Registration Workflow</p>
              <h2 className="text-2xl font-bold text-slate-900">Pending approvals from your department</h2>
              <p className="text-sm text-slate-500">Review student repeat subject applications and move them on to the Registrar stage.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-3xl bg-indigo-50 px-5 py-4 text-center shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pending requests</p>
                <p className="text-3xl font-extrabold text-slate-900">{pendingRepeats}</p>
              </div>
              <Link
                to="/hod/repeats"
                className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              >
                Review Repeat Applications
              </Link>
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
  );
};

export default HodDashboard;

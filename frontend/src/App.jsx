import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/Authcontext';
import PrivateRoute from './components/common/PrivateRoute';

const LayoutWrapper = ({ children }) => {
  const { sidebarOpen, user } = useAuth();

  if (!user) return children;

  return (
    <div className={`transition-all duration-300 flex-1 ${sidebarOpen ? 'lg:ml-52' : 'lg:ml-16'}`}>
      {children}
    </div>
  );
};

// Layout Components
import Navbar from './components/layout/navbar';

// Auth Pages
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import ForgotPassword from './pages/auth/forgotPassword';
import ResetPassword from './pages/auth/resetPassword';

// Landing Page
import Landing from './pages/home/landing';

// Student Pages
import StudentDashboard from './pages/student/dashboard';
import StudentSubjects from './pages/student/subjects';
import StudentResults from './pages/student/results';
import StudentFiles from './pages/student/files';
import StudentProfile from './pages/student/profile';
import StudentTimetable from './pages/student/timetable';
import StudentNotifications from './pages/student/notifications';
import StudentAttendance from './pages/student/attendance';
import StudentAssignments from './pages/student/assignments';
import StudentFees from './pages/student/fees';
import StudentFeedback from './pages/student/feedback';
import StudentCourseRegistration from './pages/student/courseRegistration';
import StudentRepeatExam from './pages/student/repeatExam';

// Lecturer Pages
import LecturerDashboard from './pages/lecturer/dashboard';
import LecturerSubjects from './pages/lecturer/subjects';
import LecturerFiles from './pages/lecturer/files';
import LecturerProfile from './pages/lecturer/profile';
import LecturerTimetable from './pages/lecturer/timetable';
import LecturerNotifications from './pages/lecturer/notifications';
import LecurerSubjectMaterials from './pages/lecturer/subjectMaterials';
import LecturerProgress from './pages/lecturer/progress';
import LecturerAttendance from './pages/lecturer/attendance';
import LecturerAssignmentsPage from './pages/lecturer/assignments';
import LecturerResults from './pages/lecturer/results';

// Admin Pages
import AdminDashboard from './pages/admin/dashboard';
import AdminUsers from './pages/admin/user';
import AdminSubjects from './pages/admin/subject';
import AdminResults from './pages/admin/results';
import AdminTimetables from './pages/admin/timetable';
import AdminFiles from './pages/admin/files';
import AdminProfile from './pages/admin/Profile';
import AdminNotifications from './pages/admin/notifications';
import AdminLecturerManagement from './pages/admin/lecturerManagement';
import AdminRepeatApprovals from './pages/admin/repeatApprovals';

// HOD Pages
import HodDashboard from './pages/hod/dashboard';
import HodSubjects from './pages/hod/subjects';
import HodStaff from './pages/hod/staff';
import HodStudents from './pages/hod/students';
import HodResults from './pages/hod/results';
import HodFiles from './pages/hod/files';
import HodNotifications from './pages/hod/notifications';
import HodProfile from './pages/hod/profile';
import HodTimetable from './pages/hod/timetable';
import HodRepeatApprovals from './pages/hod/repeatApprovals';

// Dean Pages
import DeanDashboard from './pages/dean/dashboard';
import DeanFaculty from './pages/dean/faculty';
import DeanHods from './pages/dean/hods';
import DeanAudit from './pages/dean/audit';
import DeanReports from './pages/dean/reports';

// Registrar Pages
import RegistrarDashboard from './pages/registrar/dashboard';
import RegistrarEnrollment from './pages/registrar/enrollment';

// Bursary Pages
import BursarDashboard from './pages/bursar/dashboard';
import BursarRevenue from './pages/bursar/revenue';

// Exam Officer Pages
import ExamOfficerDashboard from './pages/examOfficer/dashboard';
import ExamOfficerCertification from './pages/examOfficer/certification';


function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <div className="min-h-screen text-slate-900 bg-slate-50">
          <Routes>
            {/* Landing Page - No navbar needed as it has its own */}
            <Route path="/" element={<Landing />} />

            {/* Other routes with navbar */}
            <Route
              path="/*"
              element={
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <LayoutWrapper>
                    <MainRoutes />
                  </LayoutWrapper>
                </div>
              }
            />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

function MainRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      {/* Public Routes */}
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password/:token" element={<ResetPassword />} />

      {/* Student Routes */}
      <Route path="student" element={<PrivateRoute role="student" />}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="subjects" element={<StudentSubjects />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="files" element={<StudentFiles />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="fees" element={<StudentFees />} />
        <Route path="feedback" element={<StudentFeedback />} />
        <Route path="registration" element={<StudentCourseRegistration />} />
        <Route path="repeats" element={<StudentRepeatExam />} />
      </Route>

      {/* Lecturer Routes */}
      <Route path="lecturer" element={<PrivateRoute role="lecturer" />}>
        <Route path="dashboard" element={<LecturerDashboard />} />
        <Route path="subjects" element={<LecturerSubjects />} />
        <Route path="files" element={<LecturerFiles />} />
        <Route path="subjectMaterials" element={<LecurerSubjectMaterials />} />
        <Route path="progress" element={<LecturerProgress />} />
        <Route path="timetable" element={<LecturerTimetable />} />
        <Route path="notifications" element={<LecturerNotifications />} />
        <Route path="profile" element={<LecturerProfile />} />
        <Route path="attendance" element={<LecturerAttendance />} />
        <Route path="assignments" element={<LecturerAssignmentsPage />} />
        <Route path="results" element={<LecturerResults />} />
      </Route>

      {/* Admin Routes */}
      <Route path="admin" element={<PrivateRoute role="admin" />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="lecturers" element={<AdminLecturerManagement />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="results" element={<AdminResults />} />
        <Route path="timetables" element={<AdminTimetables />} />
        <Route path="files" element={<AdminFiles />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="repeats" element={<AdminRepeatApprovals />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* HOD Routes */}
      <Route path="hod" element={<PrivateRoute role="hod" />}>
        <Route path="dashboard" element={<HodDashboard />} />
        <Route path="subjects" element={<HodSubjects />} />
        <Route path="staff" element={<HodStaff />} />
        <Route path="students" element={<HodStudents />} />
        <Route path="results" element={<HodResults />} />
        <Route path="files" element={<HodFiles />} />
        <Route path="timetable" element={<HodTimetable />} />
        <Route path="notifications" element={<HodNotifications />} />
        <Route path="repeats" element={<HodRepeatApprovals />} />
        <Route path="profile" element={<HodProfile />} />
      </Route>

      {/* Dean Routes */}
      <Route path="dean" element={<PrivateRoute role="dean" />}>
        <Route path="dashboard" element={<DeanDashboard />} />
        <Route path="faculty" element={<DeanFaculty />} />
        <Route path="hods" element={<DeanHods />} />
        <Route path="audit" element={<DeanAudit />} />
        <Route path="reports" element={<DeanReports />} />
        <Route path="profile" element={<HodProfile />} />
      </Route>

      {/* Registrar Routes */}
      <Route path="registrar" element={<PrivateRoute role="registrar" />}>
        <Route path="dashboard" element={<RegistrarDashboard />} />
        <Route path="enrollment" element={<RegistrarEnrollment />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Bursar Routes */}
      <Route path="bursar" element={<PrivateRoute role="bursar" />}>
        <Route path="dashboard" element={<BursarDashboard />} />
        <Route path="revenue" element={<BursarRevenue />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Exam Officer Routes */}
      <Route path="exam_officer" element={<PrivateRoute role="exam_officer" />}>
        <Route path="dashboard" element={<ExamOfficerDashboard />} />
        <Route path="certification" element={<ExamOfficerCertification />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
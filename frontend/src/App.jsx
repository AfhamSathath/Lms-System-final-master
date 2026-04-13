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

// Student Pages
import StudentDashboard from './pages/student/dashboard';
import StudentSubjects from './pages/student/subjects';
import StudentResults from './pages/student/results';
import StudentFiles from './pages/student/files';
import StudentTimetable from './pages/student/timetable';
import StudentNotifications from './pages/student/notifications';
import StudentProfile from './pages/student/profile';
import StudentAttendance from './pages/student/attendance';
import StudentAssignments from './pages/student/assignments';
import StudentFees from './pages/student/fees';
import StudentFeedback from './pages/student/feedback';
import StudentCourseRegistration from './pages/student/courseRegistration';
import StudentRepeatExam from './pages/student/repeatExam';
import StudentMedicalForm from './pages/student/MedicalForm';
import StudentMahapolaForm from './pages/student/MahapolaForm';
import StudentMahapolaDetails from './pages/student/MahapolaAppliedDetails';
import ChangeMedium from './pages/student/ChangeMedium';
import FacultyDepartments from './pages/student/FacultyDepartments';
import StaffDirectory from './pages/student/StaffDirectory';
import CreditProgress from './pages/student/CreditProgress';
import BankSettings from './pages/student/BankSettings';
import StudentClaims from './pages/student/StudentClaims';

// Lecturer Pages
import LecturerDashboard from './pages/lecturer/dashboard';
import LecturerFiles from './pages/lecturer/files';
import LecturerProfile from './pages/lecturer/profile';
import LecturerTimetable from './pages/lecturer/timetable';
import LecturerNotifications from './pages/lecturer/notifications';
import LecturerSubjectMaterials from './pages/lecturer/subjectMaterials';
import LecturerProgress from './pages/lecturer/progress';
import LecturerAttendance from './pages/lecturer/attendance';
import LecturerAttendanceDetails from './pages/lecturer/attendanceDetails';
import LecturerAssignmentsPage from './pages/lecturer/assignments';
import LecturerResults from './pages/lecturer/results';
import LecturerRepeatApprovals from './pages/lecturer/repeatApprovals';
import LecturerEnrollment from './pages/lecturer/enrollment';
import SubjectAssessments from './pages/lecturer/subjectAssessments';
import SubjectAttendanceSessions from './pages/lecturer/subjectAttendanceSessions';

// Registrar Pages
import RegistrarDashboard from './pages/registrar/dashboard';
import RegistrarUsers from './pages/registrar/user';
import RegistrarSubjects from './pages/registrar/subject';
import RegistrarResults from './pages/registrar/results';
import RegistrarTimetables from './pages/registrar/timetable';
import RegistrarFiles from './pages/registrar/files';
import RegistrarProfile from './pages/registrar/Profile';
import RegistrarNotifications from './pages/registrar/notifications';
import RegistrarLecturerManagement from './pages/registrar/lecturerManagement';
import RegistrarRepeatApprovals from './pages/registrar/repeatApprovals';
import RegistrarAttendanceDetails from './pages/registrar/attendanceDetails';
import RegistrarMedicalApprovals from './pages/registrar/MedicalApprovals';

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
import HODAttendanceReview from './pages/hod/attendanceReview';

// Dean Pages
import DeanDashboard from './pages/dean/dashboard';
import DeanFaculty from './pages/dean/faculty';
import DeanHods from './pages/dean/hods';
import DeanAudit from './pages/dean/audit';
import DeanReports from './pages/dean/reports';
import FacultyRoster from './pages/dean/FacultyRoster';

// Bursary Pages
import ExamOfficerDashboard from './pages/examOfficer/dashboard';
import ExamOfficerCertification from './pages/examOfficer/certification';
import ComingSoon from './pages/common/ComingSoon';
import ExamOfficerRepeatApprovals from './pages/examOfficer/repeatApprovals';
import ExamOfficerVerifyPayments from './pages/examOfficer/verifyPayments';

// Bursar Pages
import BursarDashboard from './pages/bursar/dashboard';
import BursarRevenue from './pages/bursar/revenue';
import BursarRepeatFees from './pages/bursar/repeatExamFees';
import BursarMahapolaManagement from './pages/bursar/MahapolaManagement';
import HodMedicalApprovals from './pages/hod/MedicalApprovals';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <div className="min-h-screen text-slate-900 bg-slate-50">
          <Routes>
            {/* Login Page - No navbar needed for auth pages */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

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
        <Route path="medical" element={<StudentMedicalForm />} />
        <Route path="mahapola" element={<StudentMahapolaForm />} />
        <Route path="mahapola-details" element={<StudentMahapolaDetails />} />
        
        {/* Placeholder Routes for Screenshot Requirements */}
        <Route path="departments" element={<FacultyDepartments />} />
        <Route path="staff-directory" element={<StaffDirectory />} />
        <Route path="medium" element={<ChangeMedium />} />
        <Route path="summary/gpa" element={<CreditProgress />} />
        <Route path="summary/credits" element={<CreditProgress />} />
        <Route path="add-claim" element={<StudentClaims />} />
        <Route path="staff-claim" element={<StudentClaims />} />
        <Route path="claim-history" element={<StudentClaims />} />
        <Route path="pending-claims" element={<StudentClaims />} />
        <Route path="bank-settings" element={<BankSettings />} />
      </Route>

      {/* Lecturer Routes */}
      <Route path="lecturer" element={<PrivateRoute role="lecturer" />}>
        <Route path="dashboard" element={<LecturerDashboard />} />
        <Route path="files" element={<LecturerFiles />} />
        <Route path="subjectMaterials" element={<LecturerSubjectMaterials />} />
        <Route path="progress" element={<LecturerProgress />} />
        <Route path="timetable" element={<LecturerTimetable />} />
        <Route path="notifications" element={<LecturerNotifications />} />
        <Route path="profile" element={<LecturerProfile />} />
        <Route path="attendance" element={<LecturerAttendance />} />
        <Route path="attendance-details" element={<LecturerAttendanceDetails />} />
        <Route path="assignments" element={<LecturerAssignmentsPage />} />
        <Route path="enrollment" element={<LecturerEnrollment />} />
        <Route path="results" element={<LecturerResults />} />
        <Route path="repeats" element={<LecturerRepeatApprovals />} />
        <Route path="subject/:id/assessments" element={<SubjectAssessments />} />
        <Route path="subject/:id/attendance" element={<SubjectAttendanceSessions />} />
      </Route>


      {/* Registrar Routes */}
      <Route path="registrar" element={<PrivateRoute role={["admin", "registrar"]} />}>
        <Route path="dashboard" element={<RegistrarDashboard />} />
        <Route path="users" element={<RegistrarUsers />} />
        <Route path="results" element={<RegistrarResults />} />
        <Route path="timetables" element={<RegistrarTimetables />} />
        <Route path="files" element={<RegistrarFiles />} />
        <Route path="notifications" element={<RegistrarNotifications />} />
        <Route path="repeats" element={<RegistrarRepeatApprovals />} />
        <Route path="attendance" element={<RegistrarAttendanceDetails />} />
        <Route path="medical" element={<RegistrarMedicalApprovals />} />
        <Route path="profile" element={<RegistrarProfile />} />
      </Route>

      {/* HOD Routes */}
      <Route path="hod" element={<PrivateRoute role="hod" />}>
        <Route path="dashboard" element={<HodDashboard />} />
        <Route path="subjects" element={<HodSubjects />} />
        <Route path="lecturers" element={<RegistrarLecturerManagement />} />
        <Route path="staff" element={<HodStaff />} />
        <Route path="students" element={<HodStudents />} />
        <Route path="enrollment" element={<LecturerEnrollment />} />
        <Route path="subject/:id/assessments" element={<SubjectAssessments />} />
        <Route path="subject/:id/attendance" element={<SubjectAttendanceSessions />} />
        <Route path="results" element={<HodResults />} />
        <Route path="files" element={<HodFiles />} />
        <Route path="timetable" element={<HodTimetable />} />
        <Route path="notifications" element={<HodNotifications />} />
        <Route path="repeats" element={<HodRepeatApprovals />} />
        <Route path="attendance-review" element={<HODAttendanceReview />} />
        <Route path="medical" element={<HodMedicalApprovals />} />
        <Route path="profile" element={<HodProfile />} />
      </Route>

      {/* Dean Routes */}
      <Route path="dean" element={<PrivateRoute role="dean" />}>
        <Route path="dashboard" element={<DeanDashboard />} />
        <Route path="faculty" element={<DeanFaculty />} />
        <Route path="hods" element={<DeanHods />} />
        <Route path="roster" element={<FacultyRoster />} />
        <Route path="audit" element={<DeanAudit />} />
        <Route path="reports" element={<DeanReports />} />
        <Route path="attendance" element={<RegistrarAttendanceDetails />} />
        <Route path="profile" element={<HodProfile />} />
      </Route>

      <Route path="bursar" element={<PrivateRoute role="bursar" />}>
        <Route path="dashboard" element={<BursarDashboard />} />
        <Route path="revenue" element={<BursarRevenue />} />
        <Route path="repeats" element={<BursarRepeatFees />} />
        <Route path="mahapola" element={<BursarMahapolaManagement />} />
        <Route path="profile" element={<RegistrarProfile />} />
      </Route>


      {/* Exam Officer Routes */}
      <Route path="exam_officer" element={<PrivateRoute role="exam_officer" />}>
        <Route path="dashboard" element={<ExamOfficerDashboard />} />
        <Route path="certification" element={<ExamOfficerCertification />} />
        <Route path="repeats" element={<ExamOfficerRepeatApprovals />} />
        <Route path="verify-payments" element={<ExamOfficerVerifyPayments />} />
        <Route path="profile" element={<RegistrarProfile />} />
      </Route>


      {/* Redirect /admin to /registrar for consistency */}
      <Route path="admin/*" element={<Navigate to="/registrar/dashboard" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import {
  FiHome, FiBook, FiAward, FiFile, FiUser, FiUsers, FiCalendar, FiSettings, FiLogOut,
  FiChevronLeft, FiChevronRight, FiBell, FiUpload, FiBarChart2, FiStar, FiTrendingUp,
  FiCheckSquare, FiActivity, FiDollarSign, FiMessageSquare, FiClipboard,
  FiRefreshCw, FiPlus
} from 'react-icons/fi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('');

  useEffect(() => {
    const path = location.pathname.split('/')[2] || 'dashboard';
    setActiveItem(path);
  }, [location]);

  if (!user) return null;

  const handleLogout = () => logout();

  const getNavItems = () => {
    const common = [{ name: 'Dashboard', path: 'dashboard', icon: FiHome }];
    switch (user.role) {
      case 'student':
        return [...common,
        { name: 'My Subjects', path: 'subjects', icon: FiBook },
        { name: 'My Results', path: 'results', icon: FiAward },
        { name: 'Attendance', path: 'attendance', icon: FiCheckSquare },
        { name: 'Assignments', path: 'assignments', icon: FiClipboard },
        { name: 'Fees & Finance', path: 'fees', icon: FiDollarSign },
        { name: 'Course Feedback', path: 'feedback', icon: FiMessageSquare },
        { name: 'Registration', path: 'registration', icon: FiPlus },
        { name: 'Repeat Exams', path: 'repeats', icon: FiRefreshCw },
        { name: 'Study Materials', path: 'files', icon: FiFile },
        { name: 'Exam Timetable', path: 'timetable', icon: FiCalendar },
        { name: 'Notifications', path: 'notifications', icon: FiBell },
        { name: 'My Profile', path: 'profile', icon: FiUser }
        ];
      case 'lecturer':
        return [...common,
        { name: 'My Subjects', path: 'subjects', icon: FiBook },
        { name: 'Mark Attendance', path: 'attendance', icon: FiCheckSquare },
        { name: 'Academic Grading', path: 'assignments', icon: FiAward },
        { name: 'Upload Materials', path: 'files', icon: FiUpload },
        { name: 'Subject Materials', path: 'subjectMaterials', icon: FiFile },
        { name: 'Progress', path: 'progress', icon: FiTrendingUp },
        { name: 'Exam Schedule', path: 'timetable', icon: FiCalendar },
        { name: 'Student Results', path: 'results', icon: FiBarChart2 },
        { name: 'Repeat Approvals', path: 'repeats', icon: FiRefreshCw },
        { name: 'Notifications', path: 'notifications', icon: FiBell },
        { name: 'My Profile', path: 'profile', icon: FiUser }
        ];
      case 'admin':
        return [...common,
        { name: 'User Management', path: 'users', icon: FiUsers },
        { name: 'Lecturer Management', path: 'lecturers', icon: FiUsers },
        { name: 'Subject Management', path: 'subjects', icon: FiBook },
        { name: 'Result Management', path: 'results', icon: FiAward },
        { name: 'Timetable Management', path: 'timetables', icon: FiCalendar },
        { name: 'File Management', path: 'files', icon: FiFile },
        { name: 'Repeat Approvals', path: 'repeats', icon: FiRefreshCw },
        { name: 'Notifications', path: 'notifications', icon: FiBell },
        { name: 'My Profile', path: 'profile', icon: FiUser }
        ];
      case 'hod':
        return [...common,
        { name: 'My Subjects', path: 'subjects', icon: FiBook },
        { name: 'Staff Directory', path: 'staff', icon: FiUsers },
        { name: 'Student Details', path: 'students', icon: FiUser },
        { name: 'Student Results', path: 'results', icon: FiBarChart2 },
        { name: 'Materials', path: 'files', icon: FiFile },
        { name: 'Exam Timetable', path: 'timetable', icon: FiCalendar },
        { name: 'Repeat Approvals', path: 'repeats', icon: FiRefreshCw },
        { name: 'Notifications', path: 'notifications', icon: FiBell },
        { name: 'My Profile', path: 'profile', icon: FiUser }
        ];
      case 'dean':
        return [...common,
        { name: 'Faculty Oversight', path: 'faculty', icon: FiActivity },
        { name: 'HOD Management', path: 'hods', icon: FiUsers },
        { name: 'Quality Audit', path: 'audit', icon: FiCheckSquare },
        { name: 'Reports', path: 'reports', icon: FiBarChart2 },
        { name: 'My Profile', path: 'profile', icon: FiUser }
        ];
      case 'registrar':
        return [...common,
        { name: 'Enrollment', path: 'enrollment', icon: FiUsers },
        { name: 'Curriculum', path: 'curriculum', icon: FiBook },
        { name: 'Transcripts', path: 'transcripts', icon: FiFile },
        { name: 'My Profile', path: 'profile', icon: FiUser }
        ];
      case 'bursar':
        return [...common,
        { name: 'Revenue', path: 'revenue', icon: FiDollarSign },
        { name: 'Student Accounts', path: 'accounts', icon: FiTrendingUp },
        { name: 'Repeat Fees', path: 'repeats', icon: FiRefreshCw },
        { name: 'Refunds', path: 'refunds', icon: FiActivity },
        { name: 'My Profile', path: 'profile', icon: FiUser }
        ];
      case 'exam_officer':
        return [...common,
        { name: 'Result Processing', path: 'results', icon: FiAward },
        { name: 'Timetables', path: 'timetables', icon: FiCalendar },
        { name: 'Repeat Approvals', path: 'repeats', icon: FiRefreshCw },
        { name: 'Verify Payments', path: 'verify-payments', icon: FiCheckSquare },
        { name: 'Certificates', path: 'certification', icon: FiFile },
        { name: 'My Profile', path: 'profile', icon: FiUser }
        ];
      default: return common;
    }
  };

  const navItems = getNavItems();

  const getUserInitials = () =>
    user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'student': return 'from-blue-600 to-purple-600';
      case 'lecturer': return 'from-green-600 to-teal-600';
      case 'admin': return 'from-purple-600 to-pink-600';
      case 'hod': return 'from-yellow-500 to-amber-500';
      case 'dean': return 'from-red-600 to-rose-700';
      case 'registrar': return 'from-cyan-600 to-blue-500';
      case 'bursar': return 'from-emerald-600 to-green-500';
      case 'exam_officer': return 'from-indigo-600 to-violet-700';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'student': return <FiStar className="h-3 w-3" />;
      case 'lecturer': return <FiBook className="h-3 w-3" />;
      case 'admin': return <FiSettings className="h-3 w-3" />;
      case 'hod': return <FiUsers className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900 bg-opacity-20 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out
        ${isOpen ? 'w-60' : 'w-18'} bg-white border-r border-slate-200/70 shadow-[0_30px_120px_-80px_rgba(15,23,42,0.08)] text-slate-800 flex flex-col`}
      >
        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-2 top-16 bg-white rounded-full p-2 shadow-lg border border-slate-200/80 hover:bg-slate-50 hidden lg:block transition-all duration-200"
        >
          {isOpen ? <FiChevronLeft className="h-4 w-4 text-gray-600" /> :
            <FiChevronRight className="h-4 w-4 text-gray-600" />}
        </button>

        {/* Logo */}
        <div className={`flex items-center justify-center h-16 border-b border-slate-200/70 ${isOpen ? 'px-3' : 'px-1'}`}>
          <div className={`bg-gradient-to-r ${getRoleColor()} rounded-3xl flex items-center justify-center
            ${isOpen ? 'w-11 h-11' : 'w-12 h-12'}`}>
            <span className="text-white font-bold text-lg truncate">LMS</span>
          </div>
          {isOpen && (
            <span className="ml-3 font-semibold text-slate-900 text-sm truncate">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal
            </span>
          )}
        </div>

        {/* User info */}
        <div className={`border-b border-gray-200 py-3 ${isOpen ? 'px-3' : 'px-1'}`}>
          <div className="flex items-center min-w-0">
            <div className={`bg-gradient-to-r ${getRoleColor()} rounded-full flex items-center justify-center overflow-hidden
              ${isOpen ? 'w-10 h-10' : 'w-8 h-8'}`}>
              {user.profilePicture ? (
                <img
                  src={getImageUrl(user.profilePicture)}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm truncate">{getUserInitials()}</span>
              )}
            </div>
            {isOpen && (
              <div className="ml-2 min-w-0 overflow-hidden">
                <p className="font-medium text-gray-800 text-sm truncate">{user.name}</p>
                <p className="text-xs text-gray-500 flex items-center truncate">
                  {getRoleIcon()} <span className="ml-1 capitalize truncate">{user.role}</span>
                </p>
              </div>
            )}
          </div>
        </div>



        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeItem === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={`/${user.role}/${item.path}`}
                    className={`flex items-center mx-1 px-3 py-3 rounded-3xl transition-all duration-200
                      ${isActive ? `bg-gradient-to-r ${getRoleColor()} text-white shadow-[0_18px_60px_-30px_rgba(59,130,246,0.75)]` : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                    title={!isOpen ? item.name : ''}
                  >
                    <Icon className={`h-4 w-4 ${isOpen ? 'mr-2' : 'mx-auto'}`} />
                    {isOpen && <span className="text-sm truncate">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-200 py-2">
          <ul className="space-y-1">
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center w-full mx-1 px-3 py-2 rounded-md transition-all duration-200 text-red-600 hover:bg-red-50"
                title={!isOpen ? 'Logout' : ''}
              >
                <FiLogOut className={`h-4 w-4 ${isOpen ? 'mr-2' : 'mx-auto'}`} />
                {isOpen && <span className="text-sm truncate">Logout</span>}
              </button>
            </li>
          </ul>
        </div>

        {!isOpen && (
          <div className="py-1 text-center">
            <p className="text-xs text-gray-400 truncate">v1.0.0</p>
          </div>
        )}
      </aside>

      {/* Main content padding */}
      <div className={`transition-all duration-300 ${isOpen ? 'lg:ml-52' : 'lg:ml-16'}`} />
    </>
  );
};

export default Sidebar;
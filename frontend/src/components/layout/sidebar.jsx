import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import {
  FiHome, FiBook, FiAward, FiFile, FiUser, FiUsers, FiCalendar, FiSettings, FiLogOut,
  FiChevronLeft, FiChevronRight, FiBell, FiUpload, FiBarChart2, FiStar, FiTrendingUp,
  FiCheckSquare, FiActivity, FiDollarSign, FiMessageSquare, FiClipboard,
  FiRefreshCw, FiPlus, FiBriefcase, FiLayers, FiChevronDown, FiChevronUp, FiAlertCircle,
  FiCreditCard, FiFileText
} from 'react-icons/fi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('');
  const [expandedMenus, setExpandedMenus] = useState({});
  const [lecturerSubjects, setLecturerSubjects] = useState([]);

  useEffect(() => {
    const path = location.pathname.split('/')[2] || 'dashboard';
    // If we are in a nested path like /lecturer/subject/123/assessments, handle active state cleanly
    setActiveItem(path);
  }, [location]);

  useEffect(() => {
    if (user?.role === 'lecturer' || user?.role === 'hod') {
      const fetchSubjects = async () => {
        try {
          const res = await api.get(`/api/subjects/lecturer/${user.id || user._id}`);
          if (res.data?.subjects) {
            setLecturerSubjects(res.data.subjects);
          }
        } catch (error) {
          console.error("Failed to load lecturer subjects for sidebar", error);
        }
      };
      fetchSubjects();
    }
  }, [user]);

  if (!user) return null;

  const handleLogout = () => logout();

  const toggleSecondaryMenu = (menuName) => {
    setExpandedMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
    if (!isOpen) {
      toggleSidebar();
    }
  };

  const getNavItems = () => {
    const common = [{ name: 'Dashboard', path: 'dashboard', icon: FiHome }];

    switch (user.role) {
      case 'lecturer':
        // Dynamically build "My Modules" category
        const dynamicSubjects = lecturerSubjects.map(subject => ({
          name: subject.courseCode || subject.code || 'Module',
          icon: FiBook,
          isAccordion: true,
          subItems: [
            { name: 'Assessments', path: `subject/${subject._id}/assessments`, icon: FiClipboard },
            { name: 'Attendance', path: `subject/${subject._id}/attendance`, icon: FiCheckSquare }
          ]
        }));

        return [
          { category: 'Main', items: common },
          {
            category: 'My Modules',
            items: dynamicSubjects.length > 0 ? dynamicSubjects : [{ name: 'No Modules', path: '#', icon: FiAlertCircle }]
          },
          {
            category: 'Academics',
            items: [
              { name: 'Subject Materials', path: 'subjectMaterials', icon: FiBook },
              { name: 'Assignments', path: 'assignments', icon: FiClipboard },
              { name: 'File Storage', path: 'files', icon: FiUpload },
              { name: 'Exam Schedule', path: 'timetable', icon: FiCalendar },
            ]
          },
          {
            category: 'Student Management',
            items: [
              { name: 'Subject Enrollment', path: 'enrollment', icon: FiUsers },
              { name: 'Global Attendance', path: 'attendance-details', icon: FiCheckSquare },
              { name: 'Student Results', path: 'results', icon: FiStar },
              { name: 'Progress', path: 'progress', icon: FiTrendingUp },
            ]
          },
          {
            category: 'Approvals & Admin',
            items: [
              { name: 'Repeat Approvals', path: 'repeats', icon: FiRefreshCw },
              { name: 'Notifications', path: 'notifications', icon: FiBell },
              { name: 'My Profile', path: 'profile', icon: FiUser }
            ]
          }
        ];
      case 'student':
        return [
          { category: 'Main', items: common },
          {
            category: 'Resources',
            items: [
              {
                name: 'Faculty',
                icon: FiActivity,
                isAccordion: true,
                subItems: [
                  { name: 'Departments', path: 'departments', icon: FiLayers },
                  { name: 'Staff Directory', path: 'staff-directory', icon: FiUsers },
                ]
              },
            ]
          },
          {
            category: 'Personal',
            items: [
              {
                name: 'Student',
                icon: FiUsers,
                isAccordion: true,
                subItems: [
                  { name: 'Photo Update', path: 'profile', icon: FiUser },
                  { name: 'Download', path: 'files', icon: FiUpload },
                  { name: 'Enrollment', path: 'registration', icon: FiPlus },
                  { name: 'Change Medium', path: 'medium', icon: FiLayers },
                  { name: 'Subject Registration', path: 'subjects', icon: FiBook },
                  { name: 'Exam Application', path: 'repeats', icon: FiClipboard },
                  { name: 'Exam Timetable', path: 'timetable', icon: FiCalendar },
                  { name: 'My Assessment Marks', path: 'assessments', icon: FiStar },
                  { name: 'My Attendance', path: 'attendance', icon: FiCheckSquare },
                  { name: 'Mahapola/Bursary History', path: 'mahapola-details', icon: FiBriefcase },
                  { name: 'Feedback', path: 'feedback', icon: FiMessageSquare },
                ]
              },
              {
                name: 'Summary',
                icon: FiFileText,
                isAccordion: true,
                subItems: [
                  { name: 'GPA Calculator', path: 'summary/gpa', icon: FiTrendingUp },
                  { name: 'Credit Progress', path: 'summary/credits', icon: FiBarChart2 },
                ]
              },
            ]
          },
          {
            category: 'Finance',
            items: [
              {
                name: 'No Claim',
                icon: FiCreditCard,
                isAccordion: true,
                subItems: [
                  { name: 'Add Student Claim', path: 'add-claim', icon: FiPlus },
                  { name: 'Add Staff Claim', path: 'staff-claim', icon: FiUsers },
                  { name: 'Claim History', path: 'claim-history', icon: FiRefreshCw },
                  { name: 'Pending Claims', path: 'pending-claims', icon: FiActivity },
                ]
              }
            ]
          },
          {
            category: 'Administration',
            items: [
              {
                name: 'Site Administration',
                icon: FiSettings,
                isAccordion: true,
                subItems: [
                  { name: 'Bank Account Setting', path: 'bank-settings', icon: FiSettings },
                ]
              }
            ]
          }
        ];
      case 'admin':
        return [
          { category: 'Main', items: common },
          {
            category: 'Personnel', items: [
              { name: 'User Management', path: 'users', icon: FiUsers },

            ]
          },
          {
            category: 'Academic Registry', items: [
              { name: 'Result Management', path: 'results', icon: FiAward },
              { name: 'Attendance Mgmt', path: 'attendance', icon: FiCheckSquare },
              { name: 'Timetable Mgmt', path: 'timetables', icon: FiCalendar },
            ]
          },
          {
            category: 'Approval Desk', items: [
              { name: 'Repeat Approvals', path: 'repeats', icon: FiRefreshCw },
              { name: 'Medical Approvals', path: 'medical', icon: FiActivity },
            ]
          },
          {
            category: 'System', items: [
              { name: 'Notifications', path: 'notifications', icon: FiBell },
              { name: 'My Profile', path: 'profile', icon: FiUser }
            ]
          }
        ];
      case 'hod':
        const hodDynamicSubjects = lecturerSubjects.map(subject => ({
          name: subject.courseCode || subject.code || 'Module',
          icon: FiBook,
          isAccordion: true,
          subItems: [
            { name: 'Assessments', path: `subject/${subject._id}/assessments`, icon: FiClipboard },
            { name: 'Attendance', path: `subject/${subject._id}/attendance`, icon: FiCheckSquare }
          ]
        }));

        return [
          { category: 'Main', items: common },
          {
            category: 'Portfolio Management', items: [
              { name: 'Curriculum & Subjects', path: 'subjects', icon: FiLayers },
              { name: 'Staff Assignments', path: 'lecturers', icon: FiBriefcase },
              { name: 'Student Roster', path: 'students', icon: FiUsers },
              { name: 'Staff Directory', path: 'staff', icon: FiUsers },
            ]
          },
          {
            category: 'Academic Review', items: [
              { name: 'Attendance Oversight', path: 'attendance-review', icon: FiCheckSquare },
              { name: 'Teaching Progress', path: 'progress', icon: FiActivity },
              { name: 'Student Results', path: 'results', icon: FiTrendingUp },
              { name: 'Medical Approvals', path: 'medical', icon: FiActivity },
              { name: 'Repeat Registrations', path: 'repeats', icon: FiRefreshCw },
            ]
          },
          {
            category: 'My Teaching Office', items: [
              ...(hodDynamicSubjects.length > 0 ? hodDynamicSubjects : []),
              { name: 'Course Enrollment', path: 'enrollment', icon: FiPlus },
              { name: 'Lecture materials', path: 'files', icon: FiUpload },
            ]
          },
          {
            category: 'Administration', items: [
              { name: 'Exam Timetable', path: 'timetable', icon: FiCalendar },
              { name: 'Notifications', path: 'notifications', icon: FiBell },
              { name: 'My Profile', path: 'profile', icon: FiUser }
            ]
          }
        ];
      case 'dean':
        return [...common,
        { name: 'Faculty Oversight', path: 'faculty', icon: FiActivity },
        { name: 'HOD Management', path: 'hods', icon: FiUsers },
        { name: 'Faculty Roster', path: 'roster', icon: FiUsers },
        { name: 'Attendance Oversight', path: 'attendance', icon: FiCheckSquare },
        { name: 'Quality Audit', path: 'audit', icon: FiCheckSquare },
        { name: 'Exam Timetable', path: 'timetables', icon: FiCalendar },
        { name: 'Reports', path: 'reports', icon: FiBarChart2 },
        { name: 'My Profile', path: 'profile', icon: FiUser }
        ];
      case 'registrar':
        return [...common,
        { name: 'Enrollment', path: 'enrollment', icon: FiUsers },
        { name: 'Curriculum', path: 'curriculum', icon: FiBook },
        { name: 'Transcripts', path: 'transcripts', icon: FiFile },
        { name: 'Timetable Mgmt', path: 'timetables', icon: FiCalendar },
        { name: 'My Profile', path: 'profile', icon: FiUser }
        ];
      case 'bursar':
        return [...common,
        { name: 'Revenue', path: 'revenue', icon: FiDollarSign },
        { name: 'Student Accounts', path: 'accounts', icon: FiTrendingUp },
        { name: 'Repeat Fees', path: 'repeats', icon: FiRefreshCw },
        { name: 'Mahapola Bursary', path: 'mahapola', icon: FiDollarSign },
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

  const navStructure = getNavItems();

  const isCategorized = navStructure.length > 0 && navStructure[0].hasOwnProperty('category');

  const getUserInitials = () =>
    user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getRoleColor = () => {
    return 'from-red-700 to-red-800';
  };

  const renderNavItem = (item, parentCategoryIndex = null, itemIndex = null) => {
    const Icon = item.icon || FiSettings;

    if (item.isAccordion) {
      const isExpanded = expandedMenus[item.name] || false;
      return (
        <li key={`acc-${item.name}-${itemIndex}`} className="mb-1">
          <button
            onClick={() => toggleSecondaryMenu(item.name)}
            className={`w-full flex items-center mx-2 px-3 py-2.5 rounded-xl transition-all duration-300 group
                 ${isExpanded ? 'bg-red-900 text-white' : 'text-red-100 hover:bg-red-900/50 hover:text-white'}`}
          >
            <Icon className={`h-[18px] w-[18px] ${isOpen ? 'mr-3' : 'mx-auto'} text-red-200 group-hover:text-white transition-colors`} />
            {isOpen && <span className="text-[14px] font-medium tracking-wide truncate">{item.name}</span>}
            {isOpen && (
              <span className="ml-auto">
                {isExpanded ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4 text-red-300" />}
              </span>
            )}
          </button>

          {isExpanded && isOpen && (
            <ul className="mt-1 ml-6 space-y-1 border-l border-slate-200 pl-3">
              {item.subItems.map((subItem, subIdx) => {
                const SubIcon = subItem.icon;
                const isSubActive = location.pathname.includes(subItem.path);
                return (
                  <li key={`sub-${subIdx}`}>
                    <Link
                      to={`/${user.role === 'admin' ? 'registrar' : user.role}/${subItem.path}`}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors text-xs font-semibold
                            ${isSubActive ? `text-white bg-red-800` : 'text-red-200 hover:bg-red-900/50 hover:text-white'}`}
                    >
                      <SubIcon className="h-3.5 w-3.5 mr-2" />
                      {subItem.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }

    // Fallback standard render
    const isActive = activeItem === item.path || location.pathname.includes(item.path);
    return (
      <li key={`std-${item.path}-${itemIndex}`} className="mb-1">
        <Link
          to={`/${user.role === 'admin' ? 'registrar' : user.role}/${item.path}`}
          className={`flex items-center mx-2 px-3 py-2.5 rounded-xl transition-all duration-300 group relative
            ${isActive
              ? `bg-gradient-to-r ${getRoleColor()} text-white shadow-md`
              : 'text-red-100 hover:bg-red-900/50 hover:text-white'}`}
          title={!isOpen ? item.name : ''}
        >
          <Icon className={`h-[18px] w-[18px] transition-transform duration-300 ${!isActive && 'group-hover:scale-110'} ${isOpen ? 'mr-3' : 'mx-auto'}`} />
          {isOpen && <span className="text-[14px] font-medium tracking-wide truncate">{item.name}</span>}
          {isActive && !isOpen && (
            <div className={`absolute top-1/2 -translate-y-1/2 -right-1 w-1.5 h-6 bg-gradient-to-b ${getRoleColor()} rounded-l-full`} />
          )}
        </Link>
      </li>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-20'} bg-red-950 border-r border-red-900 shadow-md text-slate-100 flex flex-col`}
      >
        <button
          onClick={toggleSidebar}
          className={`absolute -right-4 top-10 bg-red-900 rounded-full w-8 h-8 flex items-center justify-center shadow-md border border-red-800 hover:bg-red-800 hover:scale-110 transition-all duration-300 z-50 lg:flex hidden group`}
          aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <div className="text-red-100 transition-transform duration-500 group-hover:text-white">
            {isOpen ? <FiChevronLeft className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}
          </div>
        </button>

        <div className={`flex items-center justify-center py-6 border-b border-red-900/50 ${isOpen ? 'px-4' : 'px-2'}`}>
          <div className={`bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-red-900/50
            ${isOpen ? 'w-10 h-10' : 'w-10 h-10'}`}>
            <img src="/esn.webp" alt="EUSL Logo" className="w-full h-full object-contain" />
          </div>
          {isOpen && (
            <div className="ml-3 flex flex-col">
              <span className="font-bold text-white text-[15px] leading-tight">EUSL Portal</span>
              <span className="text-xs text-red-200 font-medium capitalize tracking-wide">{['admin', 'registrar'].includes(user.role) ? 'Registrar' : user.role}</span>
            </div>
          )}
        </div>

        <div className={`py-4 ${isOpen ? 'px-4' : 'px-2'} mb-2`}>
          <div className={`flex items-center ${!isOpen && 'justify-center'} p-2 rounded-2xl bg-red-900/40 border border-red-800/50`}>
            <div className={`relative bg-gradient-to-tr ${getRoleColor()} rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm
              ${isOpen ? 'w-10 h-10' : 'w-9 h-9'}`}>
              {user.profilePicture ? (
                <img
                  src={getImageUrl(user.profilePicture)}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">{getUserInitials()}</span>
              )}
              {isOpen && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>}
            </div>
            {isOpen && (
              <div className="ml-3 min-w-0 flex-1">
                <p className="font-semibold text-white text-sm truncate">{user.name}</p>
                <p className="text-[11px] text-red-200 font-medium truncate flex items-center mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></span> Online
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto minimal-scrollbar pb-6">
          <ul className="space-y-1">
            {isCategorized ? (
              navStructure.map((categoryGroup, index) => (
                <React.Fragment key={`cat-${index}`}>
                  {isOpen && index !== 0 && (
                    <li className="px-5 pt-4 pb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">{categoryGroup.category}</span>
                    </li>
                  )}
                  {!isOpen && index !== 0 && <li className="my-3 border-t border-red-900/50 mx-4"></li>}

                  {categoryGroup.items.map((item, idx) => renderNavItem(item, index, idx))}
                </React.Fragment>
              ))
            ) : (
              navStructure.map((item, idx) => renderNavItem(item, null, idx))
            )}
          </ul>
        </nav>

        <div className="p-3 border-t border-red-900/50 bg-red-950 mt-auto">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-200 group
              ${isOpen ? 'bg-red-900 text-red-100 hover:bg-red-800 hover:text-white' : 'justify-center text-red-200 hover:bg-red-800 hover:text-white'}`}
            title={!isOpen ? 'Logout' : ''}
          >
            <FiLogOut className={`h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-x-1 ${isOpen ? 'mr-3' : ''}`} />
            {isOpen && <span className="text-[14px] font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${isOpen ? 'lg:pl-64' : 'lg:pl-20'}`} />
    </>
  );
};

export default Sidebar;
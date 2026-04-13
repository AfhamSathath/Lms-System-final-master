import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import {
  FiBook, FiUsers, FiFile, FiCalendar, FiTrendingUp, FiUpload,
  FiChevronRight, FiLayers, FiCheckCircle, FiClock, FiAlertCircle, FiActivity,
  FiMoreVertical, FiBell, FiSettings
} from 'react-icons/fi';

const LecturerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    subjects: [],
    files: [],
    assignments: []
  });
  
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [todaysSchedule, setTodaysSchedule] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const lecturerId = user?.id || user?._id;
      
      // We wrap these loosely to not block the whole dashboard if one fails
      const fetchWithCatch = (promise, defaultVal) => promise.catch(e => {
        console.error("Dashboard fetch error:", e);
        return { data: defaultVal };
      });

      const [subjectsRes, filesRes, assignmentsRes, repeatRes, timetableRes] = await Promise.all([
        fetchWithCatch(api.get(`/api/subjects/lecturer/${lecturerId}`), { subjects: [] }),
        fetchWithCatch(api.get('/api/files'), { files: [] }),
        fetchWithCatch(api.get(`/api/lecturer-assignments/lecturer/${lecturerId}`), { data: [] }),
        fetchWithCatch(api.get('/api/repeat-registration/lecturer/pending'), { data: [] }),
        fetchWithCatch(api.get('/api/timetables/upcoming'), { data: [] })
      ]);

      const subjects = subjectsRes.data?.subjects || [];
      const pendingRepeats = Array.isArray(repeatRes.data?.data) ? repeatRes.data?.data : [];
      let schedule = Array.isArray(timetableRes.data?.data) ? timetableRes.data?.data : [];

      // Filter timetable for items relevant to this lecturer (or their subjects)
      if (schedule.length > 0) {
          const subjectIds = subjects.map(s => s._id);
          schedule = schedule.filter(item => 
             (item.lecturer && item.lecturer === lecturerId) || 
             (item.subject && subjectIds.includes(item.subject._id || item.subject))
          ).slice(0, 5); // take max 5 upcoming
      }

      setStats({
        subjects: subjects,
        files: filesRes.data?.files || [],
        assignments: assignmentsRes.data?.data || []
      });
      
      setPendingApprovals(pendingRepeats);
      
      // Transform incoming timetable to match UI schema
      const formattedSchedule = schedule.length > 0 ? schedule.map((item, idx) => {
        // Just mocked time bounds parsing for display simplicity if actual date is absent
        const isCurrent = idx === 0; // The closest upcoming one
        let timeStr = 'TBA';
        if(item.date) timeStr = new Date(item.date).toLocaleDateString();
        if(item.startTime) timeStr = item.startTime;
        return {
          time: timeStr,
          subject: item.subject?.name || item.title || 'Lecture',
          location: item.location || item.room || 'TBA',
          type: item.type || 'Lecture',
          current: isCurrent
        };
      }) : [];
      
      setTodaysSchedule(formattedSchedule);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const activeStudentsCount = stats.subjects.reduce((sum, s) => sum + (s.enrolledStudents || 0), 0);
  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header / Welcome Section */}
        <div className="relative rounded-[2.5rem] p-8 md:p-12 overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl pointer-events-none">
             <div className="w-96 h-96 bg-white rounded-full mix-blend-overlay"></div>
          </div>
          <div className="absolute -bottom-10 -left-10 p-12 opacity-20 pointer-events-none">
             <div className="w-64 h-64 bg-emerald-400 rounded-full blur-3xl mix-blend-screen"></div>
          </div>

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div className="text-white space-y-3 max-w-2xl">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium mb-2">
                <FiClock className="mr-2 h-4 w-4" /> {formattedDate}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-100">
                Welcome back, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-emerald-50 text-lg md:text-xl font-medium opacity-90">
                You have <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-md mx-1">{pendingApprovals.length} pending actions</span> requiring your attention today.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-4 xl:mt-0">
              <Link to="/lecturer/attendance" className="bg-white hover:bg-emerald-50 text-emerald-700 px-6 py-3.5 rounded-2xl transition-all duration-300 font-semibold shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1 flex items-center group">
                <FiCheckCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> Mark Attendance
              </Link>
              <Link to="/lecturer/files" className="bg-emerald-800/40 hover:bg-emerald-800/60 backdrop-blur-md text-white border border-emerald-400/30 px-6 py-3.5 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:-translate-y-1 flex items-center group">
                <FiUpload className="mr-2 h-5 w-5 group-hover:-translate-y-1 transition-transform" /> Upload Materials
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <FiBook className="h-6 w-6" />
              </div>
              {stats.subjects.length > 0 && <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Active</span>}
            </div>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{stats.subjects.length}</h3>
            <p className="text-slate-500 font-medium text-sm mt-1">Total Subjects Administered</p>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <FiUsers className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{activeStudentsCount}</h3>
            <p className="text-slate-500 font-medium text-sm mt-1">Total Enrolled Students</p>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                <FiFile className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{stats.files.length}</h3>
            <p className="text-slate-500 font-medium text-sm mt-1">Study Materials Uploaded</p>
          </div>

          <Link to="/lecturer/repeats" className="block outline-none">
            <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 rounded-[2rem] p-6 shadow-lg shadow-orange-500/30 text-white hover:-translate-y-1 transition-all duration-300 group cursor-pointer overflow-hidden h-full">
               <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-150 transition-transform duration-700">
                 <FiAlertCircle className="h-24 w-24 -mt-6 -mr-6" />
               </div>
               <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl">
                    <FiActivity className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">{pendingApprovals.length}</h3>
                <p className="font-medium text-orange-50 text-sm mt-1 mb-3">Pending Approvals</p>
                <span className="inline-flex text-xs font-bold uppercase tracking-wider items-center text-white/90 group-hover:text-white">
                  View Now <FiChevronRight className="ml-1 opacity-70" />
                </span>
               </div>
            </div>
          </Link>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: My Subjects */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">My Modules</h2>
                  <p className="text-slate-500 text-sm mt-1">Currently allocated subjects for this semester</p>
                </div>
                </div>

              {stats.subjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {stats.subjects.slice(0, 4).map((subject, idx) => (
                    <Link to={`/lecturer/subject/${subject._id}/assessments`} key={subject._id || idx} className="block group relative p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300">
                      <div className="bg-white w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100 text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-50 transition-all">
                        <FiLayers className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg mb-1 leading-tight group-hover:text-emerald-700 transition-colors">{subject.name}</h3>
                      <p className="text-emerald-600 font-semibold text-sm mb-3">{subject.code}</p>
                      
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-500">
                         <span className="flex items-center"><FiUsers className="mr-1.5" /> {subject.enrolledStudents || 0} Students</span>
                         <span className="bg-slate-100 rounded-md px-2 py-0.5 text-xs font-medium">Sem {subject.semester}</span>
                      </div>
                      
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-2 text-slate-400 hover:text-emerald-600 bg-white rounded-full shadow-sm">
                           <FiMoreVertical />
                         </button>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 rounded-[2rem] bg-slate-50 border border-slate-100 border-dashed">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 mb-4">
                     <FiBook className="h-8 w-8" />
                   </div>
                   <h3 className="text-lg font-semibold text-slate-700">No Subjects Allocated</h3>
                   <p className="text-slate-500 text-sm mt-1">You haven't been allocated any subjects for the current semester.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Schedule & Tasks */}
          <div className="space-y-8">
            
            {/* Today's Schedule Box */}
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(15,23,42,0.05)] border border-slate-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                  <FiCalendar className="mr-2 text-emerald-500" /> Itinerary
                </h2>
                <Link to="/lecturer/timetable" className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">Full</Link>
              </div>
              
              {todaysSchedule.length > 0 ? (
                  <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {todaysSchedule.map((item, idx) => (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3 pl-8 md:p-0">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${item.current ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-y-1/2 top-1/2 text-xs font-semibold z-10 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600`}>
                           {item.current ? <FiClock className="h-4 w-4" /> : <span className="w-2.5 h-2.5 bg-slate-300 rounded-full group-hover:bg-emerald-500 transition-colors"></span>}
                        </div>
                        
                        <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border transition-all ${item.current ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-100 group-hover:border-slate-200'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold ${item.current ? 'text-emerald-600' : 'text-slate-500'}`}>{item.time}</span>
                            {item.current && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{item.subject}</h4>
                          <p className="text-xs text-slate-500 flex items-center truncate">
                            {item.location}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
              ) : (
                  <div className="text-center py-6">
                     <div className="inline-flex rounded-full bg-slate-50 p-4 text-slate-400 mb-2">
                       <FiCheckCircle className="h-8 w-8" />
                     </div>
                     <p className="text-slate-500 font-medium">No upcoming schedule found.</p>
                  </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-slate-900 rounded-[2.5rem] shadow-xl p-8 text-white relative overflow-hidden">
               <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-b from-teal-400 to-emerald-500 rounded-full opacity-20 blur-3xl"></div>
               <h2 className="text-xl font-bold mb-4 z-10 relative">Quick Tools</h2>
               <div className="grid grid-cols-2 gap-3 relative z-10">
                 <Link to="/lecturer/results" className="bg-white/10 hover:bg-white/20 border border-white/5 p-4 rounded-2xl text-center transition-all group">
                   <FiActivity className="mx-auto h-6 w-6 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
                   <span className="text-xs font-semibold block">Results</span>
                 </Link>
                 <Link to="/lecturer/notifications" className="bg-white/10 hover:bg-white/20 border border-white/5 p-4 rounded-2xl text-center transition-all group">
                   <FiBell className="mx-auto h-6 w-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                   <span className="text-xs font-semibold block">Alerts</span>
                 </Link>
                 <Link to="/lecturer/timetable" className="bg-white/10 hover:bg-white/20 border border-white/5 p-4 rounded-2xl text-center transition-all group">
                   <FiCalendar className="mx-auto h-6 w-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                   <span className="text-xs font-semibold block">Timetable</span>
                 </Link>
                 <Link to="/lecturer/profile" className="bg-white/10 hover:bg-white/20 border border-white/5 p-4 rounded-2xl text-center transition-all group">
                   <FiSettings className="mx-auto h-6 w-6 text-slate-300 mb-2 group-hover:scale-110 transition-transform" />
                   <span className="text-xs font-semibold block">Settings</span>
                 </Link>
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default LecturerDashboard;
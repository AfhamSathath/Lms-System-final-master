import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/Authcontext';
import Loader from '../../components/common/loader';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import { format } from 'date-fns';

const LecturerTimetable = () => {
  const { user } = useAuth();
  const [allTimetables, setAllTimetables] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [1, 2];

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('api/timetables/upcoming');
        setAllTimetables(res.data.timetables || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    let filtered = allTimetables;
    if (selectedYear !== 'all') filtered = filtered.filter(t => t.year === selectedYear);
    if (selectedSemester !== 'all') filtered = filtered.filter(t => t.semester === parseInt(selectedSemester));
    setTimetables(filtered);
  }, [allTimetables, selectedYear, selectedSemester]);

  const isSupervising = (t) => {
    return t.supervisors?.some(sup => sup._id === user?._id || sup === user?._id);
  };

  if (loading) return <Loader fullScreen />;

  const supervisingCount = timetables.filter(isSupervising).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Exam Schedule</h1>
          <p className="text-gray-500 mt-1">View all published exams and your assigned supervisions</p>
        </div>
        {supervisingCount > 0 && (
          <div className="bg-purple-100 border border-purple-200 text-purple-700 px-4 py-2 rounded-lg mt-4 md:mt-0 flex items-center shadow-sm">
            <span className="font-bold mr-2">{supervisingCount}</span> Assigned Supervisions
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 flex flex-wrap gap-4 border border-black">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Academic Year</label>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full border border-black rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 appearance-none bg-white">
            <option value="all">All Years</option>
            {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Semester</label>
          <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="w-full border border-black rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 appearance-none bg-white">
            <option value="all">All Semesters</option>
            {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
      </div>

      {timetables.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-black shadow-lg">
          <FiCalendar className="mx-auto text-gray-400 mb-4 h-12 w-12" />
          <p className="text-gray-600 text-lg">No upcoming exams available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {timetables.map((t) => {
            const supervising = isSupervising(t);
            return (
              <div key={t._id} className={`bg-white p-6 rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${supervising ? 'border-purple-500 bg-purple-50/30' : 'border-black'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t.subject?.name || 'Unknown Subject'}</h2>
                    <p className="text-sm font-medium text-purple-600">{t.subject?.code || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-white border border-black px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">{t.examType?.toUpperCase()}</span>
                    {supervising && (
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-md">SUPERVISING</span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <FiCalendar className="mr-3 text-purple-500 h-5 w-5" /> 
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Date</p>
                      <p className="font-semibold">{format(new Date(t.date), 'PPP')}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <FiClock className="mr-3 text-green-500 h-5 w-5" /> 
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Time</p>
                      <p className="font-semibold">{t.startTime} - {t.endTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-1 md:col-span-2">
                    <FiMapPin className="mr-3 text-red-500 h-5 w-5" /> 
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Venue</p>
                      <p className="font-semibold">{t.venue}</p>
                    </div>
                  </div>
                </div>

                {t.supervisors && t.supervisors.length > 0 && (
                   <div className="mt-4 pt-4 border-t border-gray-50 flex items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase mr-3">Team:</span>
                      <div className="flex -space-x-2">
                        {t.supervisors.map((sup, idx) => (
                          <div key={idx} className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-purple-700" title={sup.name}>
                            {sup.name?.split(' ').map(n => n[0]).join('')}
                          </div>
                        ))}
                      </div>
                      <span className="ml-3 text-xs text-gray-500">{t.supervisors.length} Supervisors</span>
                   </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LecturerTimetable;

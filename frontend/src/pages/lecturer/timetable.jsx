import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import { format } from 'date-fns';

const LecturerTimetable = () => {
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

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Exam Schedule</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-4">
        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="border border-black rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500">
          <option value="all">All Years</option>
          {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="border border-black rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500">
          <option value="all">All Semesters</option>
          {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      {timetables.length === 0 ? (
        <p className="text-gray-600">No upcoming exams available.</p>
      ) : (
        <div className="space-y-4">
          {timetables.map((t) => (
            <div key={t._id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-gray-800">{t.subject?.name || 'Unknown Subject'}</h2>
                <span className="text-sm text-gray-500">Semester {t.semester}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <div className="flex items-center">
                  <FiCalendar className="mr-1" /> {format(new Date(t.date), 'PPP')}
                </div>
                <div className="flex items-center">
                  <FiClock className="mr-1" /> {t.startTime} - {t.endTime}
                </div>
                <div className="flex items-center">
                  <FiMapPin className="mr-1" /> {t.venue}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LecturerTimetable;

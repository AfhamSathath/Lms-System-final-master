import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import { format } from 'date-fns';

const StudentTimetable = () => {
  const [allPublished, setAllPublished] = useState([]);
  const [timetablesGrouped, setTimetablesGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [1, 2];

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/api/timetables/upcoming');
        if (res?.data?.timetables && Array.isArray(res.data.timetables)) {
          const published = res.data.timetables.filter(t => !t.status || t.status === 'published');
          setAllPublished(published);
        } else {
          setAllPublished([]);
          setTimetablesGrouped({});
        }
      } catch (err) {
        console.error('Error fetching timetables:', err);
        setAllPublished([]);
        setTimetablesGrouped({});
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    let filtered = allPublished;
    if (selectedYear !== 'all') filtered = filtered.filter(t => t.year === selectedYear);
    if (selectedSemester !== 'all') filtered = filtered.filter(t => t.semester === parseInt(selectedSemester));
    
    // Group by semester
    const grouped = filtered.reduce((acc, t) => {
      const sem = t.semester ? `Semester ${t.semester}` : 'Other';
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push(t);
      return acc;
    }, {});

    // Sort each group by date
    Object.keys(grouped).forEach(sem => {
      grouped[sem].sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    setTimetablesGrouped(grouped);
  }, [allPublished, selectedYear, selectedSemester]);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Exam Timetable</h1>
      
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

      {Object.keys(timetablesGrouped).length === 0 ? (
        <p className="text-gray-600">No applicable upcoming exams found.</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(timetablesGrouped).map(([semester, exams]) => (
            <div key={semester} className="bg-white p-6 rounded-xl shadow-lg border border-black">
              <h2 className="text-2xl font-bold mb-4 text-slate-700 bg-white border border-black inline-block px-4 py-2 rounded-lg">{semester} Examinations</h2>
              <div className="space-y-4">
                {exams.map((t) => (
                  <div key={t._id} className="bg-white border-l-4 border-purple-500 p-4 rounded-r-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{t.subject?.name || 'Unknown Subject'} <span className="text-sm font-normal text-gray-500 ml-2">({t.subject?.code || 'N/A'})</span></h3>
                        <p className="text-sm text-gray-600 mt-1 capitalize">{t.examType} Exam</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700 mt-3">
                      <div className="flex items-center bg-white px-3 py-2 rounded shadow-sm">
                        <FiCalendar className="mr-2 text-purple-500" /> <span className="font-medium">{format(new Date(t.date), 'EEEE, MMMM do, yyyy')}</span>
                      </div>
                      <div className="flex items-center bg-white px-3 py-2 rounded shadow-sm">
                        <FiClock className="mr-2 text-purple-500" /> <span className="font-medium">{t.startTime} - {t.endTime}</span>
                      </div>
                      <div className="flex items-center bg-white px-3 py-2 rounded shadow-sm">
                        <FiMapPin className="mr-2 text-purple-500" /> <span className="font-medium">{t.venue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;

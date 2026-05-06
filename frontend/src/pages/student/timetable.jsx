import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import { format } from 'date-fns';
import Modal from '../../components/common/model';
import TimetableSummary from '../../components/common/TimetableSummary';
import { FiArchive } from 'react-icons/fi';


const StudentTimetable = () => {
  const [allPublished, setAllPublished] = useState([]);
  const [timetablesGrouped, setTimetablesGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [showSummary, setShowSummary] = useState(false);

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
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Exam Timetable</h1>
          <p className="text-gray-500 mt-2 text-lg">Stay prepared for your upcoming academic assessments.</p>
        </div>
        <button 
          onClick={() => setShowSummary(true)}
          className="flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all shadow-lg hover:-translate-y-1"
        >
          <FiArchive className="h-5 w-5" />
          View History Summary
        </button>
      </div>

      <Modal 
        isOpen={showSummary} 
        onClose={() => setShowSummary(false)} 
        title="Historical Timetable Summary"
        size="xl"
      >
        <TimetableSummary />
      </Modal>

      
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-10 flex flex-wrap gap-4 border border-black items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Filter by Year</label>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full border border-black rounded-xl px-4 py-3 focus:ring-4 focus:ring-purple-500/20 focus:outline-none transition-all appearance-none bg-white font-bold">
            <option value="all">All Academic Years</option>
            {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Filter by Semester</label>
          <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="w-full border border-black rounded-xl px-4 py-3 focus:ring-4 focus:ring-purple-500/20 focus:outline-none transition-all appearance-none bg-white font-bold">
            <option value="all">All Semesters</option>
            {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
      </div>

      {Object.keys(timetablesGrouped).length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <FiCalendar className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-xl font-medium">No applicable upcoming exams found.</p>
          <p className="text-gray-400 mt-1">Check back later or contact your department.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(timetablesGrouped).map(([semester, exams]) => (
            <div key={semester} className="relative">
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 pr-6 bg-white z-10">{semester} Examinations</h2>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {exams.map((t) => (
                  <div key={t._id} className="bg-white border border-black rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-md">
                        {t.examType || 'Final'}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{t.subject?.code}</span>
                    </div>
                    
                    <h3 className="text-xl font-black text-gray-900 mb-6 leading-tight group-hover:text-purple-600 transition-colors">
                      {t.subject?.name || 'Unknown Subject'}
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-2xl border border-gray-100 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                        <FiCalendar className="mr-3 text-purple-500 h-5 w-5" /> 
                        <span className="font-bold text-sm">{format(new Date(t.date), 'EEEE, MMM do, yyyy')}</span>
                      </div>
                      <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-2xl border border-gray-100 group-hover:bg-green-50 group-hover:border-green-100 transition-colors">
                        <FiClock className="mr-3 text-green-500 h-5 w-5" /> 
                        <span className="font-bold text-sm">{t.startTime} - {t.endTime}</span>
                      </div>
                      <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-2xl border border-gray-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                        <FiMapPin className="mr-3 text-red-500 h-5 w-5" /> 
                        <span className="font-bold text-sm">{t.venue}</span>
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

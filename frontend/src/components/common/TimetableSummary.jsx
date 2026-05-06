import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiFilter, FiCalendar, FiChevronDown, FiBook, FiArchive, FiPrinter, FiDownload } from 'react-icons/fi';
import { format } from 'date-fns';
import Loader from './loader';
import toast from 'react-hot-toast';

const TimetableSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    department: 'all',
    year: 'all',
    semester: 'all',
    batch: 'all'
  });
  const [metadata, setMetadata] = useState({
    departments: [],
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
    semesters: [1, 2],
    batches: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      // Fetch unique departments and batches from subjects/timetables
      const [subjectsRes, timetablesRes] = await Promise.all([
        api.get('/api/subjects'),
        api.get('/api/timetables')
      ]);
      
      const depts = [...new Set((subjectsRes.data.subjects || []).map(s => s.department).filter(Boolean))];
      const batches = [...new Set((timetablesRes.data.timetables || []).map(t => t.batch).filter(Boolean))];
      
      setMetadata(prev => ({
        ...prev,
        departments: depts,
        batches: batches
      }));
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/timetables/summary', { params: filters });
      setSummary(res.data.summary);
    } catch (err) {


      console.error('Error fetching summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await api.get('/api/timetables/export-csv-history', {
        params: filters,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Exam_History_${filters.department !== 'all' ? filters.department : 'Campus'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Historical CSV exported successfully');
    } catch (err) {
      console.error(err);
      toast.error('No historical CSV records found for this filter');
    }
  };

  const exportToPDFHistory = async () => {
    try {
      const response = await api.get('/api/timetables/export-pdf-history', {
        params: filters,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Exam_History_${filters.department !== 'all' ? filters.department : 'Campus'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Historical PDF exported successfully');
    } catch (err) {
      console.error(err);
      toast.error('No historical PDF records found for this filter');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const getFacultyName = (dept) => {
    const CS_DEPTS = ['Computer Science', 'Physical Science', 'Applied Data Science'];
    const BIZ_DEPTS = ['Languages', 'Business Management', 'Business and Management Studies', 'Languages and Communication Studies'];
    const SIDDHA_DEPTS = ['Unit of Siddha Medicine', 'Siddha Medicine'];

    const d = (dept || '').trim();
    if (CS_DEPTS.includes(d)) return 'FACULTY OF APPLIED SCIENCE';
    if (BIZ_DEPTS.includes(d)) return 'FACULTY OF COMMUNICATION AND BUSINESS STUDIES';
    if (SIDDHA_DEPTS.includes(d)) return 'FACULTY OF SIDDHA MEDICINE';
    return 'TRINCOMALEE CAMPUS';
  };

  const getSubjectDisplay = (t) => {
    if (!t.subject) return '-';
    let base = `${t.subject.code} ${t.subject.name}`;
    const cat = t.subject.category;
    if (['Practical', 'Clinical', 'Project'].includes(cat) || t.subject.name.toLowerCase().includes('practical')) {
      return `${base} (P)`;
    }
    return `${base} (T)`;
  };

  if (loading && !summary) return (
    <div className="p-20 text-center">
      <Loader />
      <p className="text-gray-400 mt-4 font-bold animate-pulse uppercase tracking-widest text-[10px]">Retrieving Formal Records...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border-2 border-black flex flex-wrap gap-3 items-end shadow-sm">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Department</label>
          <div className="relative">
            <select name="department" value={filters.department} onChange={handleFilterChange} className="w-full bg-gray-50 border border-black rounded-xl px-3 py-2.5 text-xs font-black appearance-none outline-none focus:ring-2 focus:ring-purple-500 transition-all">
              <option value="all">All Departments</option>
              {metadata.departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900" />
          </div>
        </div>
        <div className="w-32">
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Year</label>
          <div className="relative">
            <select name="year" value={filters.year} onChange={handleFilterChange} className="w-full bg-gray-50 border border-black rounded-xl px-3 py-2.5 text-xs font-black appearance-none outline-none focus:ring-2 focus:ring-purple-500">
              <option value="all">All Years</option>
              {metadata.years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900" />
          </div>
        </div>
        <div className="w-32">
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Semester</label>
          <div className="relative">
            <select name="semester" value={filters.semester} onChange={handleFilterChange} className="w-full bg-gray-50 border border-black rounded-xl px-3 py-2.5 text-xs font-black appearance-none outline-none focus:ring-2 focus:ring-purple-500">
              <option value="all">Both</option>
              {metadata.semesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900" />
          </div>
        </div>
        <div className="w-32">
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Batch</label>
          <div className="relative">
            <select name="batch" value={filters.batch} onChange={handleFilterChange} className="w-full bg-gray-50 border border-black rounded-xl px-3 py-2.5 text-xs font-black appearance-none outline-none focus:ring-2 focus:ring-purple-500">
              <option value="all">All Batches</option>
              {metadata.batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900" />
          </div>
        </div>

        <div className="ml-auto flex gap-2">
          <button 
            onClick={exportToCSV}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl border border-black font-black text-[10px] tracking-widest uppercase hover:bg-black transition-colors flex items-center gap-2 shadow-sm"
          >
            <FiDownload /> Export CSV
          </button>
          <button 
            onClick={exportToPDFHistory}
            className="bg-purple-600 text-white px-5 py-2.5 rounded-xl border border-black font-black text-[10px] tracking-widest uppercase hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FiDownload /> Export PDF
          </button>
        </div>
      </div>

      {loading ? (
         <div className="py-20 text-center"><Loader /></div>
      ) : summary?.recentOldExams?.length > 0 ? (
        <div className="bg-white border-2 border-black rounded-3xl p-8 shadow-2xl overflow-hidden print:shadow-none print:border-none max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Formal Header */}
          <div className="text-center mb-8 border-b-2 border-black pb-8">
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900">Trincomalee Campus</h2>
            <h3 className="text-lg font-bold text-gray-800">Eastern University, Sri Lanka</h3>
            <p className="text-[10px] font-bold mt-2 text-gray-500 tracking-[0.2em]">{getFacultyName(filters.department)}</p>
            <p className="text-xs font-black uppercase mt-1 text-gray-900">Department of {filters.department !== 'all' ? filters.department : 'All Departments'}</p>
            
            <div className="relative inline-block mt-10 mb-2">
              <h4 className="text-3xl font-black border-b-4 border-black px-12 py-2">Time Table</h4>
              <div className="absolute -top-4 -right-4 bg-black text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">Records</div>
            </div>

            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Examination Summary</div>


            <div className="flex flex-col md:flex-row justify-between mt-12 text-[10px] font-black uppercase tracking-widest gap-4 text-gray-900 px-4">
              <div className="text-left flex flex-col items-start">
                 <span>Examination : {filters.year !== 'all' ? filters.year.toUpperCase() : 'ALL YEARS'} {filters.semester !== 'all' ? `SEMESTER ${filters.semester}` : 'ALL SEMESTERS'}</span>
                 <span>Batch : {filters.batch !== 'all' ? filters.batch : 'ALL BATCHES'}</span>
              </div>
              <div className="text-right flex flex-col items-end">
                 <span>Venue : {[...new Set(summary.recentOldExams.map(t => t.venue))].slice(0, 3).join(', ')}</span>
                 <span>Generated: {format(new Date(), 'dd.MM.yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-black">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border-2 border-black p-4 text-left font-black uppercase text-xs w-40">Date</th>
                  <th className="border-2 border-black p-4 text-left font-black uppercase text-xs w-56">Time</th>
                  <th className="border-2 border-black p-4 text-left font-black uppercase text-xs">Subject Name</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentOldExams.sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                    <td className="border-2 border-black p-4 font-bold text-xs">
                      <div className="text-gray-900">{format(new Date(t.date), 'dd.MM.yyyy')}</div>
                      <div className="text-[9px] text-gray-400 uppercase font-black tracking-tighter mt-1">{format(new Date(t.date), 'EEEE')}</div>
                    </td>
                    <td className="border-2 border-black p-4 font-black text-indigo-600 text-xs">
                      {t.startTime} - {t.endTime}
                    </td>
                    <td className="border-2 border-black p-4">
                      <div className="font-black text-gray-900 text-xs mb-1">{getSubjectDisplay(t)}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-gray-400 uppercase border border-gray-200 px-1.5 rounded">{t.department}</span>
                        <span className="text-[8px] font-black text-gray-400 uppercase border border-gray-200 px-1.5 rounded">{t.year}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Branding */}
          <div className="mt-12 flex justify-between items-end opacity-20">
            <p className="text-[7px] font-black uppercase tracking-[0.4em]">Official Historical Data Repository • EUSL-EMS</p>
            <div className="h-px bg-gray-400 flex-1 mx-4 mb-1"></div>
            <p className="text-[7px] font-black uppercase tracking-widest">Trincomalee Campus</p>
          </div>
        </div>
      ) : (
        <div className="p-20 text-center bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-200">
          <FiArchive className="mx-auto h-20 w-20 text-gray-200 mb-6" />
          <p className="text-gray-400 text-2xl font-black uppercase tracking-tighter">No Records Found</p>
          <p className="text-gray-300 mt-2 text-sm font-medium">No examination schedules match your current filter selection.</p>

          <button onClick={() => setFilters({department:'all', year:'all', semester:'all', batch:'all'})} className="mt-8 px-8 py-3 bg-white border-2 border-black rounded-2xl text-xs font-black uppercase hover:bg-black hover:text-white transition-all shadow-lg">Reset All Filters</button>
        </div>
      )}
    </div>
  );
};

export default TimetableSummary;

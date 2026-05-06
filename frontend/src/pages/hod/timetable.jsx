import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import TimetableSummary from '../../components/common/TimetableSummary';
import { FiArchive } from 'react-icons/fi';


const HodTimetable = () => {
  const [loading, setLoading] = useState(true);
  const [timetables, setTimetables] = useState([]);
  const [showSummary, setShowSummary] = useState(false);


  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/timetables/upcoming');
      setTimetables(res.data.timetables || []);
    } catch (error) {
      console.error('HOD timetable fetch failed', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Exam Timetable</h1>
          <p className="text-gray-500 mt-1">Upcoming exam schedules for all subjects</p>
        </div>
        <button 
          onClick={() => setShowSummary(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg hover:-translate-y-1"
        >
          <FiArchive className="h-5 w-5" />
          History Summary
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


      {timetables.length === 0 ? (
        <p className="text-gray-500">No upcoming timetable entries</p>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-white border border-black">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Subject</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Exam Type</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Start</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">End</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Venue</th>
              </tr>
            </thead>
            <tbody>
              {timetables.map((item) => (
                <tr key={item._id} className="border-t border-black hover:bg-white">
                  <td className="px-4 py-3 text-sm text-gray-700">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.subject?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.examType || 'Exam'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.startTime}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.endTime}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HodTimetable;

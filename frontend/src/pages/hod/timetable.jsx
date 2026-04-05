import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';

const HodTimetable = () => {
  const [loading, setLoading] = useState(true);
  const [timetables, setTimetables] = useState([]);

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exam Timetable</h1>
        <p className="text-gray-600">Upcoming exam schedules for all subjects</p>
      </div>

      {timetables.length === 0 ? (
        <p className="text-gray-500">No upcoming timetable entries</p>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
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
                <tr key={item._id} className="border-t border-gray-200 hover:bg-gray-50">
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

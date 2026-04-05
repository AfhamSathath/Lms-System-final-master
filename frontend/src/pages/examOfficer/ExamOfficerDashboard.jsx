import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar, Clock, MapPin, Users, CheckCircle, AlertCircle,
  Download, Filter, Edit2, Eye, AlertTriangle, RefreshCw
} from 'lucide-react';

/**
 * EXAM OFFICER DASHBOARD
 * For Exam Officer / Examination Branch
 * 
 * Features:
 * - Exam scheduling & management
 * - Venue & time allocation
 * - Exam timetable generation
 * - Admission letter creation
 * - Exam statistics
 */

const ExamOfficerDashboard = () => {
  const [activeTab, setActiveTab] = useState('readyToSchedule'); // readyToSchedule, scheduled, statistics
  const [readyToSchedule, setReadyToSchedule] = useState([]);
  const [scheduledExams, setScheduledExams] = useState([]);
  const [statistics, setStatistics] = useState({
    totalExams: 0,
    scheduled: 0,
    pending: 0,
    venues: 0
  });
  const [loading, setLoading] = useState(true);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('09:00');
  const [venue, setVenue] = useState('');
  const [availableVenues] = useState([
    'Exam Hall A - Block 1',
    'Exam Hall B - Block 1',
    'Exam Hall C - Block 2',
    'Exam Hall D - Block 2',
    'Lab Theater - Block 3',
    'Presentation Room - LRC',
    'Large Hall - Sports Complex'
  ]);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/exam-officer`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setReadyToSchedule(response.data.readyToSchedule || []);
      setScheduledExams(response.data.scheduledExams || []);
      setStatistics(response.data.statistics || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleExam = async () => {
    if (!scheduleModal?.registrationId || !examDate || !venue) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/repeat-registration/${scheduleModal.registrationId}/allocate-exam`,
        {
          examDate: new Date(examDate).toISOString(),
          examTime,
          venue,
          examCode: `REPEAT-${new Date().getFullYear()}-${Math.random().toString(36).substring(7).toUpperCase()}`
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      alert('Exam scheduled successfully!');
      setScheduleModal(null);
      fetchDashboardData();
    } catch (error) {
      alert('Error scheduling exam: ' + error.message);
    }
  };

  const filteredReadyToSchedule = readyToSchedule.filter(exam =>
    (!filterDepartment || exam.department === filterDepartment) &&
    (!filterSubject || exam.subjectCode.toLowerCase().includes(filterSubject.toLowerCase()))
  );

  const filteredScheduledExams = scheduledExams.filter(exam =>
    (!filterDepartment || exam.department === filterDepartment) &&
    (!filterSubject || exam.subjectCode.toLowerCase().includes(filterSubject.toLowerCase()))
  );

  // ===== READY TO SCHEDULE TAB =====
  if (activeTab === 'readyToSchedule') {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Filter by subject code..."
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="IT">Information Technology</option>
            <option value="Business">Business Administration</option>
          </select>
        </div>

        {/* Ready to Schedule Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-blue-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fee Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReadyToSchedule.map((exam) => (
                <tr key={exam._id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{exam.studentName}</div>
                    <div className="text-gray-600">{exam.studentIndex}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{exam.subjectCode}</div>
                    <div className="text-gray-600 text-xs">{exam.subjectName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {exam.department}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                      PAID ✓
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => setScheduleModal({
                        registrationId: exam._id,
                        studentName: exam.studentName,
                        subject: exam.subjectCode
                      })}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold flex items-center gap-1"
                    >
                      <Edit2 size={14} />
                      Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReadyToSchedule.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto text-orange-500 mb-3" />
              <p className="text-gray-600">No exams ready to schedule</p>
            </div>
          )}
        </div>

        {/* Scheduling Modal */}
        {scheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Exam</h2>
              <p className="text-gray-600 mb-6">
                {scheduleModal.studentName} - {scheduleModal.subject}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Exam Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Exam Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Venue <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Venue</option>
                    {availableVenues.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setScheduleModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleExam}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== SCHEDULED EXAMS TAB =====
  if (activeTab === 'scheduled') {
    // Group by date
    const examsByDate = {};
    filteredScheduledExams.forEach(exam => {
      const date = new Date(exam.allocatedExamSlot.date).toLocaleDateString();
      if (!examsByDate[date]) examsByDate[date] = [];
      examsByDate[date].push(exam);
    });

    return (
      <div className="space-y-6">
        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Filter by subject or student..."
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2">
            <Download size={18} />
            Generate Timetable
          </button>
        </div>

        {/* Exams by Date */}
        {Object.keys(examsByDate).sort().map(date => (
          <div key={date} className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-blue-500" />
              {date}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examsByDate[date].map(exam => (
                <div key={exam._id} className="bg-white rounded-lg p-4 shadow border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{exam.subjectCode}</p>
                      <p className="text-sm text-gray-600">{exam.subjectName}</p>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Eye size={18} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={16} className="text-blue-500" />
                      <span>{exam.allocatedExamSlot.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin size={16} className="text-blue-500" />
                      <span>{exam.allocatedExamSlot.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users size={16} className="text-blue-500" />
                      <span>{exam.studentName} ({exam.studentIndex})</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex gap-2">
                    <button className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold">
                      Download Admit
                    </button>
                    <button className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 font-semibold">
                      Mark Completed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(examsByDate).length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <CheckCircle size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No scheduled exams to display</p>
          </div>
        )}
      </div>
    );
  }

  // ===== STATISTICS TAB =====
  if (activeTab === 'statistics') {
    return (
      <div className="space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 shadow border-t-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Exams</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.totalExams}</p>
              </div>
              <Calendar size={32} className="text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-3">Repeat subject exams</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow border-t-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Scheduled</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{statistics.scheduled}</p>
              </div>
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-3">Allocated exam slots</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow border-t-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{statistics.pending}</p>
              </div>
              <Clock size={32} className="text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-3">Awaiting scheduling</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow border-t-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Venues</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{statistics.venues}</p>
              </div>
              <MapPin size={32} className="text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-3">Available halls</p>
          </div>
        </div>

        {/* Venue Availability */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Venue Availability</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableVenues.map(venue => (
              <div key={venue} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-900 font-medium">{venue}</span>
                </div>
                <span className="text-xs font-bold text-gray-600">Available</span>
              </div>
            ))}
          </div>
        </div>

        {/* Exam Distribution */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Exam Schedule Distribution</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-900">Morning (09:00 - 12:00)</span>
                <span className="font-bold text-gray-900">8 exams</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-900">Afternoon (14:00 - 17:00)</span>
                <span className="font-bold text-gray-900">5 exams</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Exam Officer Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'readyToSchedule', label: `Ready to Schedule (${readyToSchedule.length})` },
          { id: 'scheduled', label: `Scheduled (${scheduledExams.length})` },
          { id: 'statistics', label: 'Statistics' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 mt-4">Loading exam data...</p>
        </div>
      ) : null}
    </div>
  );
};

export default ExamOfficerDashboard;

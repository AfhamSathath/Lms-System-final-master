import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiBook, FiUser, FiClock, FiDownload, FiSearch } from 'react-icons/fi';

const StudentSubjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState(user?.semester || 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(user?.yearOfStudy || '1st Year');

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  useEffect(() => {
    fetchSubjects();
  }, [selectedSemester, selectedYear, user]);

  // keep the selected semester in sync if the user object updates
  useEffect(() => {
    if (user?.semester) {
      setSelectedSemester(user.semester);
    }
  }, [user]);

  // dashboard state and related logic were previously present here but
  // never used. the entire section has been removed to avoid unused
  // variable warnings and stray syntax errors.

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      // load all subjects, then filter by selected semester (and department)
      const response = await api.get('/api/subjects');
      let all = (response?.data?.subjects && Array.isArray(response.data.subjects)) ? response.data.subjects : [];
      all = all.filter(sub => sub.semester === selectedSemester && sub.year === selectedYear);
      if (user?.department) {
        all = all.filter(sub => sub.department === user.department);
      }
      setSubjects(all);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]); // fallback
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Subjects</h1>
        <p className="text-gray-600 mt-2">View all subjects for each semester</p>
      </div>

      {/* Selection Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
           <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 italic">Select Academic Year</label>
           <div className="flex flex-wrap gap-3">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-tight transition-all duration-300 ${
                    selectedYear === y ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {y}
                </button>
              ))}
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
           <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 italic">Select Semester</label>
           <div className="flex flex-wrap gap-3">
              {[1, 2].map(sem => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-tight transition-all duration-300 ${
                    selectedSemester === sem ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  Semester {sem}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <label htmlFor="subject-search" className="sr-only">Search subjects</label>
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            id="subject-search"
            name="subject-search"
            type="text"
            placeholder="Search subjects by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map(subject => (
            <div key={subject._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h3 className="text-xl font-semibold text-white">{subject.name}</h3>
                <p className="text-blue-100 text-sm mt-1">{subject.code}</p>
              </div>
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <FiBook className="mr-2 text-blue-500" />
                    <span>Credits: {subject.credits}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiUser className="mr-2 text-green-500" />
                    <span>Lecturer: {subject.lecturer?.name || 'Not Assigned'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiClock className="mr-2 text-purple-500" />
                    <span>Semester: {subject.semester}</span>
                  </div>
                </div>

                {subject.description && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{subject.description}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <FiDownload className="mr-2" />
                    Materials
                  </button>
                  {subject.syllabus && (
                    <button className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                      Syllabus
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <FiBook className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No subjects found for Semester {selectedSemester}</p>
        </div>
      )}
    </div>
  );
};

export default StudentSubjects;
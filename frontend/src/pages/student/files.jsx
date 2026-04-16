import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';

import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiFile, FiDownload, FiClock, FiUser, FiBook, FiSearch, FiFilter } from 'react-icons/fi';
import { saveAs } from 'file-saver';

const StudentFiles = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const [subjects, setSubjects] = useState([]);
  const [selectedYear, setSelectedYear] = useState(user?.yearOfStudy || '1st Year');
  const [selectedSemester, setSelectedSemester] = useState(user?.semester || 1);

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [1, 2];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [searchTerm, selectedSubject, selectedYear, selectedSemester, files, subjects]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filesRes, subjectsRes] = await Promise.all([
        api.get('/api/files'),
        api.get('/api/subjects')
      ]);
      setFiles(filesRes?.data?.files || []);
      setSubjects(subjectsRes?.data?.subjects || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    // 1. First, find all subjects that match the selected year and semester
    const periodSubjects = subjects.filter(s => 
      s.year === selectedYear && s.semester === parseInt(selectedSemester)
    );
    const periodSubjectIds = periodSubjects.map(s => s._id);

    // 2. Filter files that belong to these subjects or match other criteria
    let filtered = files.filter(file => periodSubjectIds.includes(file.subject?._id));

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(file => file.subject?._id === selectedSubject);
    }

    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(file =>
        file.originalName.toLowerCase().includes(lowSearch) ||
        file.subject?.name.toLowerCase().includes(lowSearch) ||
        file.description?.toLowerCase().includes(lowSearch)
      );
    }

    setFilteredFiles(filtered);
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await api.get(`/api/files/download/${fileId}`, {
        responseType: 'blob'
      });
      saveAs(response.data, fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word')) return '📝';
    if (mimeType?.includes('presentation')) return '📊';
    if (mimeType?.includes('image')) return '🖼️';
    return '📁';
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
      <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase font-outfit">Resource Repository</h1>
            <p className="text-slate-500 mt-2 font-medium italic">Course materials, lecture notes, and supplementary files for your modules.</p>
          </div>
          
          <div className="flex gap-4">
             <div className="bg-white px-6 py-4 rounded-3xl shadow-xl border border-slate-100 hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Files</p>
                <p className="text-xl font-black text-slate-800">{filteredFiles.length}</p>
             </div>
          </div>
        </div>

        {/* Premium Academic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000">
                 <FiBook className="h-32 w-32" />
              </div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 italic">Academic Year</label>
              <div className="flex flex-wrap gap-4 relative z-10">
                 {years.map(y => (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(y)}
                      className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${
                         selectedYear === y 
                         ? 'bg-slate-900 text-white shadow-2xl scale-105' 
                         : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {y}
                    </button>
                 ))}
              </div>
           </div>

           <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-indigo-50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000">
                 <FiSearch className="h-32 w-32" />
              </div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 italic">Semester</label>
              <div className="flex flex-wrap gap-4 relative z-10">
                 {semesters.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSemester(s)}
                      className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${
                         selectedSemester === s 
                         ? 'bg-indigo-600 text-white shadow-2xl scale-105' 
                         : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      Semester {s}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex-1 relative">
              <label htmlFor="file-search" className="sr-only">Search files</label>
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="file-search"
                name="file-search"
                type="text"
                placeholder="Search files by name or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <label htmlFor="subject-filter" className="sr-only">Filter by subject</label>
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                id="subject-filter"
                name="subject-filter"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Subjects</option>
                {subjects
                  .filter(s => s.year === selectedYear && s.semester === parseInt(selectedSemester))
                  .map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Files Grid */}
        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map(file => (
              <div key={file._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{getFileIcon(file.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {file.originalName}
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    {file.subject && (
                      <div className="flex items-center text-gray-600">
                        <FiBook className="mr-2 text-blue-500 flex-shrink-0" />
                        <span className="text-sm truncate">{file.subject.name}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <FiUser className="mr-2 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Uploaded by: {file.uploadedBy?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiClock className="mr-2 text-purple-500 flex-shrink-0" />
                      <span className="text-sm">
                        {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </span>
                    </div>
                    {file.description && (
                      <p className="text-sm text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                        {file.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Size: {formatFileSize(file.size || 0)}</span>
                      <span className="text-gray-500">Downloads: {file.downloads || 0}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(file._id, file.originalName)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
                  >
                    <FiDownload className="mr-2" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <FiFile className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No files available</p>
            <p className="text-gray-400 mt-2">Check back later for study materials from your lecturers</p>
          </div>
        )}
      </div>
  );
};

export default StudentFiles;
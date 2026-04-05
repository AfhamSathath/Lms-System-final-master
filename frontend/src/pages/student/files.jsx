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
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    const params = queryString.parse(location.search);
    if (params.subject) {
      setSelectedSubject(params.subject);
    }
  }, [location.search]);


  useEffect(() => {
    filterFiles();
  }, [searchTerm, selectedSubject, files]);

  const fetchData = async () => {
    try {
      // fetch all files the student can access; backend handles public/enrollment
      const [filesRes, subjectsRes] = await Promise.all([
        api.get('/api/files'),
        api.get('/api/subjects')
      ]);
      const filelist = (filesRes?.data?.files && Array.isArray(filesRes.data.files)) ? filesRes.data.files : [];
      let sublist = (subjectsRes?.data?.subjects && Array.isArray(subjectsRes.data.subjects)) ? subjectsRes.data.subjects : [];
      
      // Filter subjects by selected year/semester
      sublist = sublist.filter(s => s.year === selectedYear && s.semester === selectedSemester);
      
      setFiles(filelist);
      setFilteredFiles(filelist.filter(f => sublist.some(s => s._id === f.subject?._id)));
      setSubjects(sublist);
    } catch (error) {
      console.error('Error fetching data:', error);
      setFiles([]);
      setFilteredFiles([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = files;

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(file => file.subject?._id === selectedSubject);
    }

    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight font-outfit uppercase">Learning Materials</h1>
            <p className="text-slate-500 mt-2 font-medium italic">{selectedYear} - Semester {selectedSemester} Resource Hub</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
              <div className="flex bg-white p-1.5 rounded-2xl shadow-xl border border-slate-50">
                 {years.map(y => (
                    <button 
                      key={y}
                      onClick={() => setSelectedYear(y)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                        selectedYear === y ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {y.split(' ')[0]}
                    </button>
                 ))}
              </div>

              <div className="flex bg-white p-1.5 rounded-2xl shadow-xl border border-slate-50">
                 {semesters.map(s => (
                    <button 
                      key={s}
                      onClick={() => setSelectedSemester(s)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                        selectedSemester === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Sem {s}
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
                {subjects.map(subject => (
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
    </div>
  );
};

export default StudentFiles;
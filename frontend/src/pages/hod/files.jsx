import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import toast from 'react-hot-toast';

const HodFiles = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState(null);
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const deptRes = await api.get('/api/departments');
      const dept = deptRes.data.departments?.[0];
      setDepartment(dept);
      if (!dept) {
        setFiles([]);
        return;
      }

      const result = await api.get(`/api/subject-files/department/${dept._id}`);
      setFiles(result.data.files || []);
    } catch (error) {
      console.error('HOD files load failed', error);
      toast.error('Unable to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileInput || !subject || !title) {
      return toast.error('Please provide title, subject, and file');
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileInput);
      formData.append('title', title);
      formData.append('subject', subject);
      if (department?._id) formData.append('department', department._id);

      await api.post('/api/subject-files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('File uploaded successfully');
      setTitle('');
      setSubject('');
      setFileInput(null);
      loadFiles();
    } catch (error) {
      console.error('Upload failed', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Department Materials</h1>
        <p className="text-gray-600">Department: {department?.name || 'Not assigned'}</p>
      </div>

      <form onSubmit={handleUpload} className="grid gap-4 mb-6 md:grid-cols-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="File title"
          className="border border-gray-300 rounded-lg px-3 py-2"
          required
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject name"
          className="border border-gray-300 rounded-lg px-3 py-2"
          required
        />
        <input
          type="file"
          onChange={(e) => setFileInput(e.target.files[0])}
          className="border border-gray-300 rounded-lg px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={uploading}
          className="bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Title</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Subject</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Uploaded By</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-gray-500">No files uploaded yet</td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file._id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">{file.title}</td>
                  <td className="px-4 py-3">
                    {file.subject?.name || file.subject || '-'} 
                    {file.subject?.department ? ` (${file.subject.department})` : ''}
                  </td>
                  <td className="px-4 py-3">{file.uploadedBy?.name || file.uploadedBy || '-'}</td>
                  <td className="px-4 py-3">{new Date(file.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/subject-files/download/${file._id}`}
                      className="text-purple-600 hover:text-purple-800"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HodFiles;

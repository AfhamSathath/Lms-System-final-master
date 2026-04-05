import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';

const HodStudents = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState(user?.department || '');

  useEffect(() => {
    if (user?.department) {
      fetchStudents();
    } else {
      setLoading(false);
    }
  }, [user?.department]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/auth/users?role=student');
      const allStudents = res.data.users || [];
      const departmentNames = [user.department].filter(Boolean).map((value) => value.toString().trim().toLowerCase());
      const filtered = allStudents.filter((student) => {
        const studentDept = (student.department || '').toString().trim().toLowerCase();
        return departmentNames.includes(studentDept);
      });
      setStudents(filtered);
      setDepartment(user.department);
    } catch (error) {
      console.error('Failed to load department students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(search.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    student.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
          <p className="text-gray-600">Department: {department || 'Not assigned yet'}</p>
          <p className="text-sm text-gray-500 mt-1">Only student records are shown here.</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students..."
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-80"
        />
      </div>

      <div className="grid gap-6 mb-8 sm:grid-cols-2 xl:grid-cols-3">
        <div className="bg-white rounded-xl shadow-lg p-5 border border-slate-200">
          <p className="text-sm text-gray-500 uppercase tracking-[0.24em] mb-2">Total students</p>
          <p className="text-3xl font-semibold text-slate-900">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 border border-slate-200">
          <p className="text-sm text-gray-500 uppercase tracking-[0.24em] mb-2">Active students</p>
          <p className="text-3xl font-semibold text-slate-900">{students.filter((s) => s.isActive).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 border border-slate-200">
          <p className="text-sm text-gray-500 uppercase tracking-[0.24em] mb-2">Student IDs</p>
          <p className="text-3xl font-semibold text-slate-900">{students.filter((s) => s.studentId).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-x-auto border border-slate-200">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 text-sm font-semibold text-gray-600">Name</th>
              <th className="px-4 py-4 text-sm font-semibold text-gray-600">Student ID</th>
              <th className="px-4 py-4 text-sm font-semibold text-gray-600">Email</th>
              <th className="px-4 py-4 text-sm font-semibold text-gray-600">Year</th>
              <th className="px-4 py-4 text-sm font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No students found</td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-700">{student.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{student.studentId || '-'}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{student.email}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{student.yearOfStudy || 'N/A'}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-800">{student.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HodStudents;

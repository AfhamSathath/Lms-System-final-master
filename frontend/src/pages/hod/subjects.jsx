import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';

const HodSubjects = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      let departmentKey = user.department;
      let dept = null;

      if (!departmentKey) {
        const res = await api.get('/api/departments');
        dept = res.data.departments?.[0];
        departmentKey = dept?.name || dept?.code || dept?._id;
      } else {
        const res = await api.get(`/api/departments/${encodeURIComponent(departmentKey)}`);
        dept = res.data.department;
      }

      if (!departmentKey || !dept) {
        setSubjects([]);
        setDepartment(null);
        setLoading(false);
        return;
      }

      setDepartment(dept);
      const subjectsRes = await api.get(`/api/departments/${encodeURIComponent(departmentKey)}/courses`);
      setSubjects(subjectsRes.data.courses || []);
    } catch (error) {
      console.error('HOD subjects error', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((sub) =>
    sub.name?.toLowerCase().includes(search.toLowerCase()) ||
    sub.courseCode?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HOD Subjects</h1>
          <p className="text-gray-600">Department: {department?.name || 'Not assigned yet'}</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects..."
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-80"
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Code</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Level</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Semester</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Assigned Lecturer</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-gray-500">No subjects found</td>
              </tr>
            ) : (
              filteredSubjects.map((subject) => (
                <tr key={subject._id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{subject.courseCode || subject.code || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{subject.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{subject.level || subject.year || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{subject.semester || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{subject.lecturerName || subject.lecturer || 'Unassigned'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HodSubjects;

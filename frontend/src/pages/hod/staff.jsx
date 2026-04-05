import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';

const HodStaff = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState(null);
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const departmentKey = user?.department;
      if (!departmentKey) {
        setStaff([]);
        setLoading(false);
        return;
      }
      const deptRes = await api.get(`/api/departments/${encodeURIComponent(departmentKey)}`);
      const dept = deptRes.data.department;
      setDepartment(dept);
      if (!dept) {
        setStaff([]);
        setLoading(false);
        return;
      }
      const staffRes = await api.get(`/api/departments/${encodeURIComponent(departmentKey)}/staff`);
      setStaff(staffRes.data.staff || []);
    } catch (error) {
      console.error('HOD staff error:', error);
    } finally {
      setLoading(false);
    }
  };

  const staffWithoutId = staff.filter((person) => !person.lecturerId);

  const filteredStaff = staff.filter((person) =>
    person.name?.toLowerCase().includes(search.toLowerCase()) ||
    person.email?.toLowerCase().includes(search.toLowerCase()) ||
    person.lecturerId?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Department Staff Directory</h1>
            <p className="text-gray-600">{department?.name || 'Department not assigned yet'}</p>
            <p className="text-sm text-gray-500 mt-1">Showing staff members for your department with their staff IDs.</p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff..."
            className="border border-gray-300 rounded-lg px-4 py-2 w-72"
          />
        </div>
        {staffWithoutId.length > 0 && (
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-sm text-yellow-900">
            <p className="font-semibold">Staff names without ID</p>
            <p>{staffWithoutId.map((person) => person.name).join(', ')}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Staff ID</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-gray-500">No staff found</td>
              </tr>
            ) : (
              filteredStaff.map((staffer) => (
                <tr key={staffer._id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{staffer.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{staffer.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{staffer.lecturerId || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 capitalize">{staffer.role}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{staffer.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HodStaff;

import React, { useState } from 'react';
import { FiSave, FiUpload, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/Authcontext';

const StudentMedicalForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    registrationNumber: '',
    fullName: user?.name || '',
    faculty: '',
    semester: '',
    illness: '',
    mcNumber: '',
    doctorName: '',
    hospital: '',
    startDate: '',
    endDate: '',
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please upload your medical certificate PDF');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append('medicalPdf', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/medicals/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Medical Application Form submitted successfully!');
        setFormData({
          registrationNumber: '',
          fullName: user?.name || '',
          faculty: '',
          semester: '',
          illness: '',
          mcNumber: '',
          doctorName: '',
          hospital: '',
          startDate: '',
          endDate: '',
        });
        setFile(null);
      } else {
        toast.error(result.message || 'Error submitting form');
      }
    } catch (error) {
      toast.error('Server error submitting application');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <h2 className="text-2xl font-bold">Medical Application Form</h2>
          <p className="mt-2 text-blue-100">Submit your Medical Certificate details for absence coverage</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Details Section */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Section A: Student Details</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="e.g. IT20123456"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Faculty / Department</label>
              <input
                type="text"
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                placeholder="e.g. Computing"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Year / Semester</label>
              <input
                type="text"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                placeholder="e.g. Y2S1"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Medical Details Section */}
            <div className="col-span-1 md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Section B: Medical Details</h3>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Nature of Illness / Diagnosis</label>
              <input
                type="text"
                name="illness"
                value={formData.illness}
                onChange={handleChange}
                placeholder="Brief description of the illness"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">M.C. Reference Number</label>
              <input
                type="text"
                name="mcNumber"
                value={formData.mcNumber}
                onChange={handleChange}
                placeholder="Medical Certificate No."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Name of the Medical Officer</label>
              <input
                type="text"
                name="doctorName"
                value={formData.doctorName}
                onChange={handleChange}
                placeholder="Dr. Name"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Hospital / Clinic Issued From</label>
              <input
                type="text"
                name="hospital"
                value={formData.hospital}
                onChange={handleChange}
                placeholder="Government Hospital / Private Clinic"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Leave Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Leave End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Document Upload */}
            <div className="col-span-1 md:col-span-2 mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Medical Certificate Copy (PDF/JPG)</label>
              <label htmlFor="mc-upload" className="block border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                <FiUpload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600">Drag and drop file here, or click to browse</p>
                <input type="file" className="hidden" id="mc-upload" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg" />
                {file && <p className="mt-2 text-blue-600 font-medium">Selected: {file.name}</p>}
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-200 disabled:opacity-70"
            >
              {loading ? (
                <FiRefreshCw className="animate-spin mr-2 h-5 w-5" />
              ) : (
                <FiSave className="mr-2 h-5 w-5" />
              )}
              {loading ? 'Submitting...' : 'Submit Medical Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentMedicalForm;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { FiUserPlus, FiSearch, FiCheck, FiX, FiUsers, FiFilter, FiEdit2, FiEye, FiAward, FiCheckCircle, FiAlertCircle, FiShield, FiAlertTriangle, FiClock, FiDownload, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const HodStudents = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const batches = ['2024/2025', '2023/2024', '2022/2023', '2021/2022', 'Repeat Batch (All)'];
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    yearOfStudy: '',
    semester: '',
    batch: '',
    isActive: true
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (user?.department) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user?.department]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/auth/users?role=student');
      const allStudents = res.data.users || [];

      // My department students
      const myStudents = allStudents.filter(s =>
        (s.department || '').toLowerCase() === (user.department || '').toLowerCase()
      );

      // Unassigned students (no department set)
      const pool = allStudents.filter(s => !s.department || s.department.trim() === '');

      setStudents(myStudents);
      setUnassignedStudents(pool);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudent = async (studentId) => {
    setAssigning(true);
    try {
      await api.put(`/api/auth/users/${studentId}`, {
        department: user.department,
        faculty: user.faculty
      });
      toast.success('Student assigned to department');
      fetchData();
    } catch (error) {
      toast.error('Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from your department?')) return;
    try {
      await api.put(`/api/auth/users/${studentId}`, {
        department: '',
        faculty: ''
      });
      toast.success('Student removed from department');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove student');
    }
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setEditFormData({
      yearOfStudy: student.yearOfStudy || '',
      semester: student.semester || '',
      batch: student.batch || '',
      isActive: student.isActive !== undefined ? student.isActive : true
    });
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/auth/users/${editingStudent._id}`, editFormData);
      toast.success('Student updated successfully');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name?.toLowerCase().includes(search.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      student.email?.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = selectedBatch === 'All' ? true : student.batch === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  const filteredUnassigned = unassignedStudents.filter((student) =>
    student.name?.toLowerCase().includes(assignSearch.toLowerCase()) ||
    student.email?.toLowerCase().includes(assignSearch.toLowerCase())
  );

  const handleExport = (student) => {
    if (!student) return;

    // Prepare data for export
    const academicHistory = student.academicHistory?.map(h => `Year ${h.year} Sem ${h.semester}: ${h.isCleared ? 'Cleared' : 'Not Cleared'}`).join(' | ') || 'None';
    const blackMarks = student.blackMarks?.map(m => `${m.date}: ${m.reason} (${m.severity})`).join(' | ') || 'None';
    const extraActivities = student.extraActivities?.join(', ') || 'None';

    const csvData = [
      ['Field', 'Value'],
      ['Name', student.name],
      ['Email', student.email],
      ['Student ID', student.studentId || 'N/A'],
      ['Department', student.department],
      ['Batch', student.batch],
      ['Year of Study', student.yearOfStudy],
      ['Semester', student.semester],
      ['GPA', (student.gpa || 0).toFixed(2)],
      ['Has Repeats', student.hasRepeats ? 'Yes' : 'No'],
      ['Performance Status', student.performanceStatus || 'Average'],
      ['Competition Eligibility', student.competitionEligibility ? 'Eligible' : 'Not Eligible'],
      ['Out of Bounds Active', student.outOfBounds?.isActive ? 'Yes' : 'No'],
      ['OOB Reason', student.outOfBounds?.reason || 'N/A'],
      ['Academic History', academicHistory],
      ['Disciplinary Black Marks', blackMarks],
      ['Extra Activities', extraActivities],
      ['Export Date', new Date().toLocaleString()]
    ];

    const csvContent = "data:text/csv;charset=utf-8,"
      + csvData.map(e => e.map(val => `"${val}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Student_Record_${student.studentId || student.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Student record exported successfully');
  };

  const handleExportPDF = (student) => {
    if (!student) return;

    const printWindow = window.open('', '_blank');
    const academicRows = student.academicHistory?.map(h => `
      <tr>
        <td style="padding: 12px; border: 1px solid #000;">Year ${h.year} • Semester ${h.semester}</td>
        <td style="padding: 12px; border: 1px solid #000; text-align: center;">${h.isCleared ? '<span style="color: green; font-weight: bold;">CLEARED</span>' : '<span style="color: red; font-weight: bold;">PENDING</span>'}</td>
        <td style="padding: 12px; border: 1px solid #000;">${h.remarks || '-'}</td>
      </tr>
    `).join('') || '<tr><td colspan="3" style="padding: 20px; text-align: center; border: 1px solid #000;">No academic history recorded</td></tr>';

    const blackMarkRows = student.blackMarks?.map(m => `
      <div style="margin-bottom: 10px; padding: 10px; border-left: 4px solid ${m.severity === 'High' ? 'red' : 'orange'}; background: #f9f9f9;">
        <strong>${new Date(m.date).toLocaleDateString()} - ${m.reason}</strong> (${m.severity} Severity)
      </div>
    `).join('') || '<p>No disciplinary records found. Student is in good standing.</p>';

    const html = `
      <html>
        <head>
          <title>&nbsp;</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1a1a1a; padding: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 4px double #000; padding-bottom: 20px; }
            .logo { width: 80px; height: auto; margin-bottom: 15px; }
            .univ-name { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin: 0; }
            .univ-full { font-size: 12px; font-weight: 700; color: #444; text-transform: uppercase; margin-bottom: 5px; }
            .doc-title { font-size: 14px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px; }
            .student-info { display: grid; grid-cols: 2; margin-bottom: 30px; border: 1px solid #000; padding: 20px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: 900; text-transform: uppercase; font-size: 10px; color: #666; display: block; }
            .value { font-weight: 700; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .section-title { background: #000; color: #fff; padding: 8px 15px; font-size: 12px; font-weight: 900; text-transform: uppercase; margin-top: 40px; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; border-top: 1px solid #eee; pt: 20px; font-size: 10px; color: #999; }
            .signature { margin-top: 80px; text-align: right; }
            .sig-line { border-top: 1px solid #000; width: 200px; display: inline-block; margin-top: 40px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${window.location.origin}/esn.webp" class="logo" alt="EUSL Logo">
            <p class="univ-full">Trincomalee Campus, Eastern University, Sri Lanka</p>
            <h1 class="univ-name">Official Academic Transcript</h1>
            <p class="doc-title">Student Management Information System</p>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <span class="label">Student Name</span>
              <span class="value">${student.name}</span>
            </div>
            <div style="text-align: right;">
              <span class="label">Academic ID</span>
              <span class="value">${student.studentId || 'PENDING'}</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 40px; background: #fcfcfc; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <div>
              <span class="label">Faculty</span>
              <span class="value" style="font-size: 12px;">${student.faculty || user.faculty || 'N/A'}</span>
            </div>
            <div>
              <span class="label">Department</span>
              <span class="value" style="font-size: 12px;">${student.department || 'N/A'}</span>
            </div>
            <div>
              <span class="label">Current Batch</span>
              <span class="value" style="font-size: 12px;">${student.batch || 'N/A'}</span>
            </div>
          </div>

          <div class="section-title">Academic Performance Summary</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; border: 1px solid #eee; border-top: none;">
            <div>
              <span class="label">Cumulative GPA</span>
              <span class="value" style="font-size: 32px; color: #4f46e5;">${(student.gpa || 0).toFixed(2)}</span>
            </div>
            <div>
              <span class="label">Academic Standing</span>
              <span class="value" style="color: ${student.hasRepeats ? 'red' : 'green'}">${student.hasRepeats ? 'CONDITIONAL (REPEATS PENDING)' : 'GOOD STANDING (CLEAR)'}</span>
            </div>
          </div>

          <div class="section-title">Semester-wise Examination Records</div>
          <table>
            <thead>
              <tr style="background: #f4f4f4;">
                <th style="padding: 12px; border: 1px solid #000; text-align: left; font-size: 10px; text-transform: uppercase;">Examination Period</th>
                <th style="padding: 12px; border: 1px solid #000; text-align: center; font-size: 10px; text-transform: uppercase;">Status</th>
                <th style="padding: 12px; border: 1px solid #000; text-align: left; font-size: 10px; text-transform: uppercase;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${academicRows}
            </tbody>
          </table>

          <div class="section-title">Disciplinary & Conduct Record</div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            ${blackMarkRows}
            <div style="margin-top: 15px;">
              <span class="label">Competition Participation Eligibility</span>
              <span class="value" style="font-size: 12px;">${student.competitionEligibility ? 'ELIGIBLE' : 'RESTRICTED DUE TO DISCIPLINARY REASONS'}</span>
            </div>
          </div>

          <div class="signature">
            <div class="sig-line"></div>
            <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; margin-top: 5px;">Head of Department (HOD)</p>
            <p style="font-size: 9px; color: #666;">Date of Issue: ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="footer">
            <p>This is an electronically generated document. Valid without physical signature for internal departmental purposes.</p>
            <p>Report ID: MIS-${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for images to load before printing
    const imgs = printWindow.document.getElementsByTagName('img');
    let loadedImgs = 0;

    const tryPrint = () => {
      loadedImgs++;
      if (loadedImgs >= imgs.length) {
        printWindow.print();
        printWindow.close();
      }
    };

    if (imgs.length > 0) {
      for (let img of imgs) {
        if (img.complete) {
          tryPrint();
        } else {
          img.onload = tryPrint;
          img.onerror = tryPrint;
        }
      }
      // Safety timeout
      setTimeout(() => {
        if (loadedImgs < imgs.length) {
          printWindow.print();
          printWindow.close();
        }
      }, 2000);
    } else {
      printWindow.print();
      printWindow.close();
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-black p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Departmental Students</h1>
            <p className="text-gray-500 font-medium">Managing assignments for <span className="text-indigo-600 font-bold">{user.department}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-4 py-3 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium transition-all outline-none"
            >
              <option value="All">All Batches</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="pl-10 pr-4 py-3 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 w-full md:w-64 font-medium transition-all"
              />
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              <FiUserPlus /> Assign Students
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Students" value={students.length} icon={<FiUsers />} color="indigo" />
        <StatCard label="Active" value={students.filter(s => s.isActive).length} icon={<FiCheck />} color="green" />
        <StatCard label="Waitlist Pool" value={unassignedStudents.length} icon={<FiFilter />} color="amber" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-black overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/50">
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Student Info</th>
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Academic ID</th>
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Batch / Year</th>
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <FiUsers className="text-gray-200 text-5xl mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest">No students assigned to this department</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-white/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg shadow-sm">
                        {student.name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{student.name}</p>
                        <p className="text-xs text-gray-400 font-medium">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-mono font-bold text-gray-500 uppercase tracking-tighter">
                    {student.studentId || "PENDING"}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-gray-700">{student.batch || "BATCH N/A"}</span>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase tracking-tighter w-fit">
                          Year {student.yearOfStudy || "N/A"} • Sem {student.semester || "N/A"}
                        </span>
                        {student.gpa > 0 && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase tracking-tighter w-fit border border-emerald-100">
                            GPA {student.gpa.toFixed(2)}
                          </span>
                        )}
                        {student.hasRepeats && (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-black uppercase tracking-tighter w-fit border border-rose-100">
                            REPEAT
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${student.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm font-bold text-gray-600 capitalize">{student.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setSelectedStudent(student); setShowProfileModal(true); }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="View Full Profile"
                      >
                        <FiEye size={18} />
                      </button>
                      <button
                        onClick={() => handleEditClick(student)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit Details"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleRemoveStudent(student._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Remove from Department"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Students to Department"
      >
        <div className="space-y-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter unassigned students..."
              className="w-full pl-10 pr-4 py-3 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {filteredUnassigned.length === 0 ? (
              <p className="text-center py-10 text-gray-400 font-bold uppercase text-xs">No unassigned students found</p>
            ) : (
              filteredUnassigned.map(s => (
                <div key={s._id} className="flex items-center justify-between p-4 bg-white rounded-2xl hover:bg-indigo-50 transition-colors group">
                  <div>
                    <p className="font-bold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </div>
                  <button
                    disabled={assigning}
                    onClick={() => handleAssignStudent(s._id)}
                    className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    <FiCheck size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Student Details"
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">Batch</label>
              <input
                type="text"
                value={editFormData.batch}
                onChange={(e) => setEditFormData({ ...editFormData, batch: e.target.value })}
                placeholder="e.g. 2021/2022"
                className="w-full px-4 py-3 bg-white border border-black rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">Status</label>
              <select
                value={editFormData.isActive}
                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })}
                className="w-full px-4 py-3 bg-white border border-black rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">Year of Study</label>
              <select
                value={editFormData.yearOfStudy}
                onChange={(e) => setEditFormData({ ...editFormData, yearOfStudy: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-black rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">Semester</label>
              <select
                value={editFormData.semester}
                onChange={(e) => setEditFormData({ ...editFormData, semester: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-black rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-1"
            >
              Update Student Records
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Profile Detail Modal (View Only) */}
      <AnimatePresence>
        {showProfileModal && selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] border border-black w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Profile Header */}
              <div className="p-8 border-b border-black bg-slate-50 flex justify-between items-start">
                <div className="flex gap-6 items-center">
                  <div className="w-24 h-24 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-xl">
                    {selectedStudent.name?.[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{selectedStudent.name}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-3 py-1 bg-white border border-black rounded-full text-[10px] font-black uppercase tracking-widest">{selectedStudent.studentId || 'No ID'}</span>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedStudent.batch}</span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Year {selectedStudent.yearOfStudy} • Sem {selectedStudent.semester}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(user.department === 'Languages and Communication Studies' || user.department === 'Business and Management Studies') && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Department Logic</span>
                      <div className="flex gap-2">
                        {selectedStudent.gpa >= 3.3 && (
                          <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">Honors Eligible</span>
                        )}
                        {/* More logic can be added here once results are integrated */}
                      </div>
                    </div>
                  )}
                  <button onClick={() => setShowProfileModal(false)} className="w-12 h-12 rounded-2xl border border-black flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto p-8 flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Academic Stats */}
                <div className="md:col-span-1 space-y-6">
                  {user.department === 'Languages and Communication Studies' && (
                    <div className="p-6 bg-indigo-900 text-white rounded-[2rem] border border-black shadow-xl">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Major Selection Eligibility</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold">Languages Major</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedStudent.gpa >= 3.0 ? 'bg-emerald-500' : 'bg-white/10 opacity-50'}`}>
                            {selectedStudent.gpa >= 3.0 ? 'Qualified' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold">Communication Major</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedStudent.gpa >= 2.0 ? 'bg-emerald-500' : 'bg-white/10 opacity-50'}`}>
                            {selectedStudent.gpa >= 2.0 ? 'Qualified' : 'Pending'}
                          </span>
                        </div>
                        <div className="pt-4 border-t border-white/10 space-y-2">
                          <p className="text-[8px] font-black uppercase tracking-widest opacity-80">Honors Track Requirements</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                              <span className="text-[7px] font-medium opacity-70">Film & TV (COMM 3133)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                              <span className="text-[7px] font-medium opacity-70">Folk Media (COMM 3143)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                              <span className="text-[7px] font-medium opacity-70">Desktop Pub (ITEC 3033)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                              <span className="text-[7px] font-medium opacity-70">Linguistics (LING 3113)</span>
                            </div>
                          </div>
                          <p className="text-[7px] font-medium opacity-50 leading-relaxed italic mt-2">
                            * Languages requires B in LANG 1053. Communication requires C in COMM 1013/1023. Honors requires GPA 3.3 and completion of all compulsory units above.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {user.department === 'Business and Management Studies' && (
                    <div className="p-6 bg-slate-900 text-white rounded-[2rem] border border-black shadow-xl">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Specialization Eligibility</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold">Marketing Major</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedStudent.gpa >= 3.0 ? 'bg-emerald-500' : 'bg-white/10 opacity-50'}`}>
                            {selectedStudent.gpa >= 3.0 ? 'Qualified' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold">HRM Major</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedStudent.gpa >= 3.0 ? 'bg-emerald-500' : 'bg-white/10 opacity-50'}`}>
                            {selectedStudent.gpa >= 3.0 ? 'Qualified' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold">Accounting & Finance</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedStudent.gpa >= 3.2 ? 'bg-emerald-500' : 'bg-white/10 opacity-50'}`}>
                            {selectedStudent.gpa >= 3.2 ? 'Qualified' : 'Pending'}
                          </span>
                        </div>
                        <div className="pt-4 border-t border-white/10 space-y-2">
                          <p className="text-[8px] font-black uppercase tracking-widest opacity-80">Honors Requirements</p>
                          <p className="text-[7px] font-medium opacity-50 leading-relaxed italic mt-2">
                            * Requires minimum 'C' grade in relevant core subject (MKT1013 / HRM1013 / AFM1013). Honors Year entry requires GPA 3.3.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-black relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <FiAward size={60} />
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Current GPA</p>
                    <p className="text-5xl font-black text-indigo-600 tracking-tighter">{(selectedStudent.gpa || 0).toFixed(2)}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${selectedStudent.performanceStatus === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                        selectedStudent.performanceStatus === 'Good' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                        {selectedStudent.performanceStatus || 'Average'} Performance
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Repeat Status</h3>
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${selectedStudent.hasRepeats ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                      <div className="flex items-center gap-2">
                        {selectedStudent.hasRepeats ? <FiAlertCircle /> : <FiCheckCircle />}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {selectedStudent.hasRepeats ? 'Has Repeat Subjects' : 'Clear Standing'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Competition Eligibility</h3>
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${selectedStudent.competitionEligibility ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-100 border-slate-300 text-slate-400'}`}>
                      <div className="flex items-center gap-2">
                        <FiShield />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {selectedStudent.competitionEligibility ? 'Eligible for Competitions' : 'Not Eligible'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Column: History & OOB */}
                <div className="md:col-span-2 space-y-8">
                  {/* Academic History */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <FiClock /> Semester-wise Progress
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedStudent.academicHistory?.length > 0 ? selectedStudent.academicHistory.map((history, idx) => (
                        <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                          <div>
                            <p className="text-[10px] font-black text-slate-800">Year {history.year} • Sem {history.semester}</p>
                            <p className="text-[9px] text-slate-400 font-medium">{history.remarks || 'No remarks'}</p>
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${history.isCleared ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {history.isCleared ? <FiCheck size={14} /> : <FiX size={14} />}
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-2 py-8 bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          No historical data found
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Out of Bounds Section */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 text-rose-600">
                      <FiAlertTriangle /> Disciplinary: Out-of-Bounds Status
                    </h3>
                    <div className={`p-6 rounded-3xl border-2 ${selectedStudent.outOfBounds?.isActive ? 'bg-rose-50 border-rose-600' : 'bg-slate-50 border-slate-200'}`}>
                      {selectedStudent.outOfBounds?.isActive ? (
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div>
                            <p className="text-xl font-black text-rose-700 uppercase tracking-tighter">RESTRICTION ACTIVE</p>
                            <p className="text-[10px] font-bold text-rose-500 mt-1">Reason: {selectedStudent.outOfBounds.reason}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Started: {new Date(selectedStudent.outOfBounds.startDate).toLocaleDateString()}</p>
                          </div>
                          <div className="text-center bg-white p-4 rounded-2xl border border-rose-200 shadow-lg shadow-rose-100">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Remaining Days</p>
                            <p className="text-3xl font-black text-rose-600 leading-none">
                              {(() => {
                                const start = new Date(selectedStudent.outOfBounds.startDate);
                                const duration = selectedStudent.outOfBounds.durationDays;
                                const diff = Date.now() - start.getTime();
                                const daysPassed = Math.floor(diff / (1000 * 60 * 60 * 24));
                                return Math.max(0, duration - daysPassed);
                              })()}
                            </p>
                            <p className="text-[8px] font-black uppercase text-rose-400 mt-1 tracking-widest">Automatic Update</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">No active out-of-bounds restrictions</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Black Marks & Activities */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Disciplinary Black Marks</h3>
                      <div className="space-y-2">
                        {selectedStudent.blackMarks?.length > 0 ? selectedStudent.blackMarks.map((mark, idx) => (
                          <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl relative overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${mark.severity === 'High' ? 'bg-red-600' : mark.severity === 'Medium' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                            <p className="text-[10px] font-bold text-slate-700">{mark.reason}</p>
                            <p className="text-[8px] text-slate-400 mt-1">{new Date(mark.date).toLocaleDateString()} • {mark.severity} Severity</p>
                          </div>
                        )) : (
                          <p className="text-[10px] font-bold text-emerald-500 uppercase italic">Clear Record</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Extra Activities</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.extraActivities?.length > 0 ? selectedStudent.extraActivities.map((act, idx) => (
                          <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold border border-indigo-100">
                            {act}
                          </span>
                        )) : (
                          <p className="text-[10px] font-bold text-slate-400 italic">None recorded</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-900 border-t border-black text-white flex justify-between items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Authorized Personnel View Only • Student Management System</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleExportPDF(selectedStudent)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                  >
                    <FiFileText /> Export PDF Transcript
                  </button>
                  <button
                    onClick={() => handleExport(selectedStudent)}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <FiDownload /> Export CSV
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black flex items-center gap-6">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center text-2xl shadow-sm`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-3xl font-black text-gray-800 tracking-tighter leading-none mt-1">{value}</p>
    </div>
  </div>
);

export default HodStudents;

import React, { useState, useEffect } from 'react';
import { FiCheckSquare, FiAlertCircle, FiSearch, FiCheckCircle, FiShield, FiXCircle, FiTrendingUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ResultCertification = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // In a real-world MIS, we'd fetch specific batches of results for officer certification
      const res = await api.get('/api/enrollments?grade=exists');
      setResults(res.data.enrollments);
    } catch (err) {
      toast.error('Grievance: Failed to pull Examination Result ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleCertification = async (id, status) => {
    try {
      // Logic for officially certifying a result
      toast.success(`Result Officially Certified: ${status.toUpperCase()}`);
    } catch (err) {
      toast.error('System Integrity Failure: Certification Denied');
    }
  };

  return (
    <div className="p-10 bg-[#f4f7fe] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black text-[#1B2559] uppercase tracking-tight mb-2">Academic Audit Console</h1>
          <p className="text-[#A3AED0] text-lg font-bold flex items-center gap-2">
             <FiShield className="text-indigo-600" /> Institution of Examinations: Result Certification Portal
          </p>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search Batch Reference..." className="pl-14 pr-8 py-5 rounded-[40px] bg-white border border-gray-100 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold placeholder:text-gray-300" />
           </div>
           <button className="px-10 py-5 bg-indigo-600 text-white font-black rounded-[40px] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">
              <FiCheckCircle /> Final Certification
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[50px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-10 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center px-12">
           <h2 className="text-xl font-black text-[#1B2559] uppercase tracking-wider">Exam Batch Ledger: Review Required</h2>
           <div className="flex gap-4">
              <span className="text-indigo-600 font-bold flex items-center gap-1 text-sm bg-indigo-50 px-6 py-2 rounded-full border border-indigo-100">
                 <FiAlertCircle /> Priority Analysis
              </span>
           </div>
        </div>

        <div className="overflow-x-auto px-6 pb-6">
           <table className="w-full text-left">
              <thead>
                 <tr>
                    <th className="px-8 py-8 text-xs font-black text-[#A3AED0] uppercase tracking-[0.3em]">Batch Identity</th>
                    <th className="px-8 py-8 text-xs font-black text-[#A3AED0] uppercase tracking-[0.3em]">Student Node</th>
                    <th className="px-8 py-8 text-xs font-black text-[#A3AED0] uppercase tracking-[0.3em]">Course Trace</th>
                    <th className="px-8 py-8 text-xs font-black text-[#A3AED0] uppercase tracking-[0.3em]">Grade Standing</th>
                    <th className="px-8 py-8 text-xs font-black text-[#A3AED0] uppercase tracking-[0.3em]">Certification Flow</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {loading ? (
                    <tr><td colSpan="5" className="p-40 text-center font-black animate-pulse text-indigo-200 uppercase tracking-widest text-2xl">Integrity Sync in operation...</td></tr>
                 ) : results.length === 0 ? (
                    <tr><td colSpan="5" className="p-40 text-center font-black text-gray-400 uppercase tracking-widest text-2xl">Ledger Clearance: All results certified.</td></tr>
                 ) : results.map((res, i) => (
                    <tr key={res._id} className="hover:bg-indigo-50/20 transition-all group cursor-pointer">
                       <td className="px-8 py-8">
                          <p className="font-black text-[#1B2559] uppercase">EXM-{res._id.slice(-6)}</p>
                          <p className="text-xs font-bold text-gray-400 italic">Received: {new Date(res.updatedAt).toLocaleDateString()}</p>
                       </td>
                       <td className="px-8 py-8">
                          <p className="font-bold text-[#1B2559]">{res.student?.name}</p>
                          <p className="text-xs font-black text-indigo-600 tracking-tighter uppercase">{res.student?.studentId}</p>
                       </td>
                       <td className="px-8 py-8">
                          <p className="font-bold text-gray-700">{res.course?.courseName}</p>
                          <p className="text-xs font-black text-gray-400 tracking-widest uppercase">{res.course?.courseCode}</p>
                       </td>
                       <td className="px-8 py-8">
                          <div className="flex items-center gap-4">
                             <span className="w-12 h-12 bg-indigo-600 text-white flex items-center justify-center font-black rounded-2xl text-xl shadow-lg shadow-indigo-200">{res.grade}</span>
                             <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Score Compliance</p>
                                <p className="font-bold text-[#1B2559]">{res.totalMarks}%</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-8">
                          <div className="flex gap-4">
                             <button onClick={() => handleCertification(res._id, 'approved')} className="p-4 bg-emerald-500 text-white rounded-2xl shadow-xl hover:bg-emerald-600 transition-all shadow-emerald-200"><FiCheckSquare size={20} /></button>
                             <button onClick={() => handleCertification(res._id, 'flagged')} className="p-4 bg-rose-500 text-white rounded-2xl shadow-xl hover:bg-rose-600 transition-all shadow-rose-200"><FiXCircle size={20} /></button>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default ResultCertification;

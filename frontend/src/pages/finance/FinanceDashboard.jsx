import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle,
  Download, Filter, Calendar, User, Eye, AlertTriangle
} from 'lucide-react';

/**
 * FINANCE DASHBOARD
 * For Bursar / Finance Officer
 * 
 * Features:
 * - Payment overview & analytics
 * - Pending payments tracking
 * - Payment history & reconciliation
 * - Revenue analytics
 * - Payment confirmation workflow
 */

const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, pending, history, analytics
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingPayments, setPendingPayments] = useState([]);
  const [confirmedPayments, setConfirmedPayments] = useState([]);
  const [overviewData, setOverviewData] = useState({
    totalExpected: 0,
    totalReceived: 0,
    pendingAmount: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);
  const [paymentProofModal, setPaymentProofModal] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [filterMonth]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/finance`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: { month: filterMonth }
        }
      );

      setPendingPayments(response.data.pendingPayments || []);
      setConfirmedPayments(response.data.confirmedPayments || []);
      setOverviewData(response.data.overview || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (registrationId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/repeat-registration/${registrationId}/fee-paid`,
        {
          paymentReference: paymentProofModal.reference,
          paymentProof: paymentProofModal.proof
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      alert('Payment confirmed successfully!');
      setPaymentProofModal(null);
      fetchDashboardData();
    } catch (error) {
      alert('Error confirming payment: ' + error.message);
    }
  };

  const filteredPendingPayments = pendingPayments.filter(p =>
    p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.studentIndex.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ===== OVERVIEW TAB =====
  if (activeTab === 'overview') {
    const chartData = [
      { name: 'Expected', value: overviewData.totalExpected },
      { name: 'Received', value: overviewData.totalReceived },
      { name: 'Pending', value: overviewData.pendingAmount },
      { name: 'Overdue', value: overviewData.overdue }
    ];

    const percentageData = [
      { name: 'Received', value: Math.round((overviewData.totalReceived / (overviewData.totalExpected || 1)) * 100) },
      { name: 'Pending', value: Math.round((overviewData.pendingAmount / (overviewData.totalExpected || 1)) * 100) },
      { name: 'Overdue', value: Math.round((overviewData.overdue / (overviewData.totalExpected || 1)) * 100) }
    ];

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Expected</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  LKR {overviewData.totalExpected.toLocaleString()}
                </p>
              </div>
              <DollarSign size={32} className="text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-3">From all approved registrations</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Amount Received</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  LKR {overviewData.totalReceived.toLocaleString()}
                </p>
              </div>
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-3">Successfully reconciled</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Pending Payment</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  LKR {overviewData.pendingAmount.toLocaleString()}
                </p>
              </div>
              <Clock size={32} className="text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-3">Awaiting student payment</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Overdue</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  LKR {overviewData.overdue.toLocaleString()}
                </p>
              </div>
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-3">Past due date</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Payment Status */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Payment Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `LKR ${value.toLocaleString()}`} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart - Payment Distribution */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Payment Distribution (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={percentageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-3">Financial Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {((overviewData.totalReceived / (overviewData.totalExpected || 1)) * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Registrations</p>
              <p className="text-2xl font-bold text-gray-900">
                {(filteredPendingPayments.length + confirmedPayments.length)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Paid Registrations</p>
              <p className="text-2xl font-bold text-green-600">
                {confirmedPayments.length}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredPendingPayments.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== PENDING PAYMENTS TAB =====
  if (activeTab === 'pending') {
    return (
      <div className="space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by student name, index, or subject code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Months</option>
            <option value="2026-05">May 2026</option>
            <option value="2026-04">April 2026</option>
            <option value="2026-03">March 2026</option>
          </select>
        </div>

        {/* Pending Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fee Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPendingPayments.map((payment) => {
                const daysOverdue = Math.max(0, Math.floor((new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24)));
                const isOverdue = daysOverdue > 0;

                return (
                  <tr key={payment._id} className={isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{payment.studentName}</div>
                      <div className="text-gray-600">{payment.studentIndex}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{payment.subjectCode}</div>
                      <div className="text-gray-600 text-xs">{payment.subjectName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      LKR {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(payment.dueDate).toLocaleDateString()}
                      {isOverdue && (
                        <div className="text-red-600 text-xs font-bold mt-1">
                          {daysOverdue} days overdue
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${
                        isOverdue ? 'bg-red-500' : 'bg-orange-500'
                      }`}>
                        {isOverdue ? 'OVERDUE' : 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setPaymentProofModal({
                          registrationId: payment._id,
                          student: payment.studentName,
                          reference: '',
                          proof: ''
                        })}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold"
                      >
                        Verify Payment
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredPendingPayments.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
              <p className="text-gray-600">No pending payments</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== PAYMENT HISTORY TAB =====
  if (activeTab === 'history') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Payment Ref</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date Paid</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {confirmedPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{payment.studentName}</div>
                    <div className="text-gray-600">{payment.studentIndex}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {payment.subjectCode}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    LKR {payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {payment.paymentReference}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(payment.paymentReceivedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                      PAID
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ===== PAYMENT PROOF MODAL =====
  if (paymentProofModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify Payment</h2>
          <p className="text-gray-600 mb-4">
            Confirming payment for: <strong>{paymentProofModal.student}</strong>
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Payment Reference
              </label>
              <input
                type="text"
                value={paymentProofModal.reference}
                onChange={(e) => setPaymentProofModal({
                  ...paymentProofModal,
                  reference: e.target.value
                })}
                placeholder="e.g., BANK_TRX_123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Payment Proof (File path/URL)
              </label>
              <input
                type="text"
                value={paymentProofModal.proof}
                onChange={(e) => setPaymentProofModal({
                  ...paymentProofModal,
                  proof: e.target.value
                })}
                placeholder="/uploads/receipt.pdf"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setPaymentProofModal(null)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConfirmPayment(paymentProofModal.registrationId)}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
            >
              Confirm Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
        <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2">
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'pending', label: 'Pending Payments' },
          { id: 'history', label: 'Payment History' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 mt-4">Loading data...</p>
        </div>
      ) : null}
    </div>
  );
};

export default FinanceDashboard;

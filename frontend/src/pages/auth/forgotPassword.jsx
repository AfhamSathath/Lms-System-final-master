import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      if (response.data.success) {
        setSubmitted(true);
        toast.success('Reset link sent to your email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Navbar */}
      <nav className="w-full bg-white shadow-sm border-b border-black fixed top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-start">
          <div className="flex items-center space-x-4">
            <img src="/esn.webp" alt="Eastern University Logo" className="h-14 w-14 object-contain rounded-full shadow-sm bg-white p-1 border border-black" />
            <h1 className="text-slate-900 text-lg sm:text-2xl font-bold tracking-wide uppercase">
              Trincomalee Campus Eastern University MIS Portal
            </h1>
          </div>
        </div>
      </nav>

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-2">
              Forgot Password?
            </h2>
            <p className="text-lg text-slate-500">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-black">
            {!submitted ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-3 uppercase tracking-widest">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 border border-black rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-900 transition-all font-medium"
                      placeholder="Enter your registered email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-4 px-4 rounded-lg shadow-sm text-sm font-black text-white bg-red-900 hover:bg-red-800 border border-black focus:outline-none transition-all transform hover:-translate-y-0.5 disabled:opacity-50 uppercase tracking-widest"
                >
                  {loading ? 'Processing...' : 'Send Reset Link'}
                </button>

                <div className="text-center mt-6">
                  <Link to="/login" className="inline-flex items-center text-sm font-bold text-slate-600 hover:text-red-900 transition-all gap-2">
                    <FiArrowLeft /> Back to Login
                  </Link>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="flex justify-center mb-6 text-emerald-600">
                  <FiCheckCircle className="h-16 w-16" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Check your email</h3>
                <p className="text-slate-600 mb-8">
                  We've sent a password reset link to <strong className="text-slate-900">{email}</strong>.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-red-900 font-bold hover:underline transition-all"
                >
                  Didn't receive the email? Click to retry
                </button>
                <div className="mt-8">
                  <Link to="/login" className="inline-flex items-center text-sm font-bold text-slate-600 hover:text-red-900 transition-all gap-2">
                    <FiArrowLeft /> Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

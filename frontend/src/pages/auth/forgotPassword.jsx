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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white bg-opacity-20 backdrop-blur-lg mb-4">
             <div className="bg-white p-4 rounded-full shadow-lg">
                <FiMail className="h-8 w-8 text-indigo-600" />
             </div>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-2">
            Forgot Password?
          </h2>
          <p className="text-lg text-white text-opacity-90">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border border-white border-opacity-20">
          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-white mb-3 uppercase tracking-widest">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-white text-opacity-60" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border border-white border-opacity-20 rounded-2xl bg-white bg-opacity-10 text-white placeholder-white placeholder-opacity-40 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                    placeholder="Enter your registered email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none transition-all transform hover:scale-105 disabled:opacity-50 uppercase tracking-widest"
              >
                {loading ? 'Processing...' : 'Send Reset Link'}
              </button>

              <div className="text-center">
                <Link to="/login" className="inline-flex items-center text-sm font-bold text-white hover:text-opacity-80 transition-all gap-2">
                  <FiArrowLeft /> Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
              <div className="flex justify-center mb-6 text-emerald-400">
                <FiCheckCircle className="h-16 w-16" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Check your email</h3>
              <p className="text-white text-opacity-80 mb-8">
                We've sent a password reset link to <strong>{email}</strong>.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-white font-bold underline hover:text-opacity-100 transition-all"
              >
                Didn't receive the email? Click to retry
              </button>
              <div className="mt-8">
                <Link to="/login" className="inline-flex items-center text-sm font-bold text-white hover:text-opacity-80 transition-all gap-2">
                  <FiArrowLeft /> Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

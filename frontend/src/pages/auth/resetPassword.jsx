import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      const response = await api.put(`/api/auth/reset-password/${token}`, {
        password: formData.password,
      });

      if (response.data.success) {
        setSubmitted(true);
        toast.success('Password reset successfully');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
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
              Reset Password
            </h2>
            <p className="text-lg text-slate-500">
              Securely update your portal credentials.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-black">
            {!submitted ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3 uppercase tracking-widest">
                    New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-12 pr-12 py-4 border border-black rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-900 transition-all font-mono"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3 uppercase tracking-widest">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
                    <input
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-12 pr-12 py-4 border border-black rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-900 transition-all font-mono"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-4 px-4 rounded-lg shadow-sm text-sm font-black text-white bg-red-900 hover:bg-red-800 border border-black focus:outline-none transition-all transform hover:-translate-y-0.5 disabled:opacity-50 uppercase tracking-widest"
                >
                  {loading ? 'Securing Update...' : 'Update Password'}
                </button>

                <div className="text-center mt-6">
                  <Link to="/login" className="inline-flex items-center text-sm font-bold text-slate-600 hover:text-red-900 transition-all gap-2">
                    Back to Login
                  </Link>
                </div>
              </form>
            ) : (
              <div className="text-center py-10">
                <div className="flex justify-center mb-6 text-emerald-600">
                  <FiCheckCircle className="h-16 w-16" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 uppercase tracking-widest">Success!</h3>
                <p className="text-slate-600 mb-8 font-medium">
                  Your password has been securely updated. Redirecting to login...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

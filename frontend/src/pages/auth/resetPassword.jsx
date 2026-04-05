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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-800 via-purple-700 to-pink-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white bg-opacity-20 backdrop-blur-lg mb-4 shadow-xl">
             <div className="bg-white p-4 rounded-full shadow-lg">
                <FiLock className="h-8 w-8 text-pink-600" />
             </div>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
            Reset Password
          </h2>
          <p className="text-lg text-white text-opacity-80">
            Securely update your portal credentials.
          </p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border border-white border-opacity-20 animate-fade-in">
          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-black text-white mb-3 uppercase tracking-widest">
                  New Password
                </label>
                <div className="relative">
                  <FiLock className="absolute top-1/2 left-4 -translate-y-1/2 text-white/50" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-12 py-4 border border-white/20 rounded-2xl bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-all font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-white mb-3 uppercase tracking-widest">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute top-1/2 left-4 -translate-y-1/2 text-white/50" />
                  <input
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-12 py-4 border border-white/20 rounded-2xl bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-all font-mono"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 rounded-2xl shadow-xl text-sm font-black text-white bg-gradient-to-r from-pink-600 to-indigo-600 hover:scale-105 active:scale-95 transition-all transform disabled:opacity-50 uppercase tracking-widest"
              >
                {loading ? 'Securing Update...' : 'Update Password'}
              </button>
            </form>
          ) : (
            <div className="text-center py-10">
              <div className="flex justify-center mb-6 text-emerald-400">
                <FiCheckCircle className="h-20 w-20 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-widest">Success!</h3>
              <p className="text-white text-opacity-80 mb-8 font-medium">
                Your password has been securely updated. Redirecting to login...
              </p>
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 animate-loading-bar"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaEyeSlash, FaUser, FaLock, FaShieldAlt } from 'react-icons/fa';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.identifier, formData.password);
      
      if (result.success && result.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (result.success && result.user.role !== 'admin') {
        setError(`This is an Admin login page. You are logged in as ${result.user.role}. Please use the correct login page.`);
        setLoading(false);
      } else {
        setError('Admin account required');
        setLoading(false);
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100 p-4">
      <div className="bg-dark-200 rounded-2xl p-8 max-w-md w-full border border-red-500/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-3xl font-bold">
            <span className="text-white">MIKA</span>
            <span className="text-red-500">-BET</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Admin Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-gray-400 text-sm block mb-2">Email or Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-500" />
              </div>
              <input
                type="text"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                className="w-full bg-dark-100 text-white pl-10 pr-4 py-3 rounded-lg border border-red-500/20 focus:border-red-500 outline-none transition"
                placeholder="Enter your email or username"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-dark-100 text-white pl-10 pr-12 py-3 rounded-lg border border-red-500/20 focus:border-red-500 outline-none transition"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition"
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-400 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>

          <div className="text-center">
            <p className="text-gray-400 text-sm">
              <Link to="/login" className="text-gold-500 hover:underline">
                Player Login
              </Link>
              {' | '}
              <Link to="/agent/login" className="text-blue-500 hover:underline">
                Agent Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
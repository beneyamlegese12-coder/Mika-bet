import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaEyeSlash, FaUser, FaLock, FaGamepad } from 'react-icons/fa';

const Login = () => {
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
      if (result.success && result.user.role === 'player') {
        navigate('/');
      } else if (result.success && result.user.role !== 'player') {
        setError(`This is a Player login page. Please use the ${result.user.role} login page.`);
        setLoading(false);
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100 p-4">
      <div className="bg-dark-200 rounded-2xl p-8 max-w-md w-full border border-gold-500/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">??</div>
          <h1 className="text-3xl font-bold">
            <span className="text-white">MIKA</span>
            <span className="text-gold-500">-BET</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Player Login</p>
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
                className="w-full bg-dark-100 text-white pl-10 pr-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition"
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
                className="w-full bg-dark-100 text-white pl-10 pr-12 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition"
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
            className="w-full bg-gold-500 text-dark-100 font-bold py-3 rounded-lg hover:bg-gold-400 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login as Player'}
          </button>

          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-gold-500 hover:underline font-semibold">
                Register
              </Link>
            </p>
            <p className="text-gray-400 text-sm mt-2">
              <Link to="/admin/login" className="text-red-500 hover:underline">
                Admin Login
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

export default Login;

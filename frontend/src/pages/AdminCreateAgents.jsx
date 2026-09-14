import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaUserPlus, FaUserTie, FaCrown, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminCreateAgents = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'agent',
    balance: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        role: formData.role,
        balance: parseFloat(formData.balance) || 0,
      };

      console.log('📤 Sending:', payload);

      const response = await api.post('/admin/create-agent', payload);

      if (response.data.success) {
        toast.success(`✅ ${formData.role} created successfully!`);
        setFormData({
          username: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          role: 'agent',
          balance: 0,
        });
      }
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">👥 Create Agents & SuperAgents</h1>

      <div className="bg-dark-200 rounded-2xl p-6 border border-gold-500/20">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="text-gray-400 text-sm block mb-2">Role *</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Agent Button */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'agent' })}
                className={`p-4 rounded-lg border-2 transition ${
                  formData.role === 'agent'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gold-500/20 bg-dark-100 hover:border-gold-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FaUserTie className="text-blue-500 text-2xl" />
                  <div className="text-left">
                    <p className="text-white font-semibold">Agent</p>
                    <p className="text-gray-400 text-xs">Can handle players</p>
                  </div>
                </div>
              </button>

              {/* SuperAgent Button */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'superagent' })}
                className={`p-4 rounded-lg border-2 transition ${
                  formData.role === 'superagent'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gold-500/20 bg-dark-100 hover:border-gold-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FaCrown className="text-purple-500 text-2xl" />
                  <div className="text-left">
                    <p className="text-white font-semibold">SuperAgent</p>
                    <p className="text-gray-400 text-xs">Can handle agents</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
              placeholder="Enter username"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
              placeholder="Enter email address"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
              placeholder="+251 912 345 678"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
              placeholder="Min 8 characters"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
              placeholder="Confirm password"
              required
            />
          </div>

          {/* Initial Balance */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Initial Balance (ETB)</label>
            <div className="relative">
              <input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                min="0"
                step="100"
                className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">ETB</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 text-dark-100 py-3 rounded-lg font-bold hover:bg-gold-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-dark-100"></div>
                Creating...
              </>
            ) : (
              <>
                <FaUserPlus /> Create {formData.role === 'superagent' ? 'SuperAgent' : 'Agent'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateAgents;
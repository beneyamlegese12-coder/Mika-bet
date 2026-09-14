import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaUsers, FaTrophy, FaWallet, FaGamepad } from 'react-icons/fa';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBets: 0,
    totalRevenue: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/users');
      setRecentUsers(response.data.data.slice(0, 5));
      setStats({
        totalUsers: response.data.data.length,
        totalBets: 0,
        totalRevenue: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setRecentUsers(response.data.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">🛡️ Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark-200 p-4 rounded-lg border border-gold-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <FaUsers className="text-gold-500 text-3xl" />
          </div>
        </div>
        <div className="bg-dark-200 p-4 rounded-lg border border-gold-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Bets</p>
              <p className="text-2xl font-bold text-white">{stats.totalBets}</p>
            </div>
            <FaTrophy className="text-gold-500 text-3xl" />
          </div>
        </div>
        <div className="bg-dark-200 p-4 rounded-lg border border-gold-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Revenue</p>
              <p className="text-2xl font-bold text-green-500">{stats.totalRevenue} ETB</p>
            </div>
            <FaWallet className="text-gold-500 text-3xl" />
          </div>
        </div>
        <div className="bg-dark-200 p-4 rounded-lg border border-gold-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Games</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
            <FaGamepad className="text-gold-500 text-3xl" />
          </div>
        </div>
      </div>

      <div className="bg-dark-200 rounded-lg p-6 border border-gold-500/20">
        <h2 className="text-lg font-bold text-white mb-4">Recent Users</h2>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : recentUsers.length === 0 ? (
          <p className="text-gray-400">No users found</p>
        ) : (
          <div className="space-y-2">
            {recentUsers.map((u) => (
              <div key={u._id} className="flex justify-between items-center bg-dark-100 p-3 rounded-lg">
                <div>
                  <p className="text-white">{u.username}</p>
                  <p className="text-gray-400 text-sm">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  u.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                  u.role === 'agent' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-green-500/20 text-green-500'
                }`}>
                  {u.role || 'player'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
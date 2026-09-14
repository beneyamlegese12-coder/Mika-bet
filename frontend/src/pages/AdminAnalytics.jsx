import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FaUsers, FaTrophy, FaWallet, FaCalendar, 
  FaArrowUp, FaArrowDown, FaChartLine, FaDownload,
  FaEye, FaEyeSlash
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week'); // week, month, year
  const [stats, setStats] = useState({
    users: { total: 0, new: 0, active: 0 },
    bets: { total: 0, pending: 0, won: 0, lost: 0 },
    revenue: { total: 0, deposits: 0, withdrawals: 0, profit: 0 },
    games: { total: 0, popular: [] },
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics?period=${period}`);
      setStats(response.data.data);
      setRecentActivity(response.data.recentActivity || []);
      setTopUsers(response.data.topUsers || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await api.get(`/admin/analytics/export?period=${period}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-report-${period}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString() || 0;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white">📊 Analytics & Reports</h1>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-dark-200 text-white px-4 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 12 Months</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={exportReport}
            className="bg-gold-500 text-dark-100 px-4 py-2 rounded-lg font-semibold hover:bg-gold-400 transition flex items-center gap-2"
          >
            <FaDownload /> Export Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Users Card */}
            <div className="bg-dark-200 p-4 rounded-xl border border-gold-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.users?.total || 0}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-green-500 text-xs flex items-center">
                      <FaArrowUp className="mr-1" size={10} />
                      {stats.users?.new || 0} new
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <FaUsers className="text-blue-400 text-2xl" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Active: {stats.users?.active || 0}
              </div>
            </div>

            {/* Bets Card */}
            <div className="bg-dark-200 p-4 rounded-xl border border-gold-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Bets</p>
                  <p className="text-2xl font-bold text-white">{stats.bets?.total || 0}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-green-500 text-xs flex items-center">
                      <FaArrowUp className="mr-1" size={10} />
                      {stats.bets?.won || 0} won
                    </span>
                    <span className="text-red-500 text-xs flex items-center">
                      <FaArrowDown className="mr-1" size={10} />
                      {stats.bets?.lost || 0} lost
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center">
                  <FaTrophy className="text-gold-400 text-2xl" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Pending: {stats.bets?.pending || 0}
              </div>
            </div>

            {/* Revenue Card */}
            <div className="bg-dark-200 p-4 rounded-xl border border-gold-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(stats.revenue?.total)} ETB
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-green-500 text-xs">
                      Deposits: {formatCurrency(stats.revenue?.deposits)} ETB
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <FaWallet className="text-green-400 text-2xl" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Profit: {formatCurrency(stats.revenue?.profit)} ETB
              </div>
            </div>

            {/* Games Card */}
            <div className="bg-dark-200 p-4 rounded-xl border border-gold-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Games Played</p>
                  <p className="text-2xl font-bold text-white">{stats.games?.total || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <FaChartLine className="text-purple-400 text-2xl" />
                </div>
              </div>
              {stats.games?.popular?.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Popular: {stats.games.popular.slice(0, 3).map(g => g.name).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity & Top Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-dark-200 rounded-xl p-6 border border-gold-500/20">
              <h2 className="text-lg font-bold text-white mb-4">🕐 Recent Activity</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No recent activity</p>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 bg-dark-100 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'bet' ? 'bg-gold-500' :
                        activity.type === 'deposit' ? 'bg-green-500' :
                        activity.type === 'withdraw' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{activity.message}</p>
                        <p className="text-gray-500 text-xs">{formatDate(activity.timestamp)}</p>
                      </div>
                      {activity.amount && (
                        <span className={`text-sm font-bold ${
                          activity.amount > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {activity.amount > 0 ? '+' : ''}{activity.amount} ETB
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-dark-200 rounded-xl p-6 border border-gold-500/20">
              <h2 className="text-lg font-bold text-white mb-4">🏆 Top Users</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {topUsers.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No user data available</p>
                ) : (
                  topUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-dark-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-gold-500 text-dark-100' :
                          index === 1 ? 'bg-gray-400 text-dark-100' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-dark-300 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{user.username}</p>
                          <p className="text-gray-500 text-xs">{user.bets} bets</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gold-500 text-sm font-bold">{user.totalWon} ETB</p>
                        <p className="text-gray-500 text-xs">{user.winRate}% win rate</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
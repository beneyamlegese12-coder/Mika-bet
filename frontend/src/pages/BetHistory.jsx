import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaTrophy, FaTimes, FaClock, FaSearch, FaFilter } from 'react-icons/fa';

const BetHistory = () => {
  const { user } = useAuth();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    won: 0,
    lost: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchBets();
    fetchStats();
  }, []);

  const fetchBets = async () => {
    try {
      const response = await api.get('/bets');
      setBets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/bets/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredBets = bets.filter(bet => {
    if (filter === 'all') return true;
    if (filter === 'won') return bet.status === 'WON';
    if (filter === 'lost') return bet.status === 'LOST';
    if (filter === 'pending') return bet.status === 'PENDING';
    return true;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'WON':
        return <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs">✅ Won</span>;
      case 'LOST':
        return <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs">❌ Lost</span>;
      case 'PENDING':
        return <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs">⏳ Pending</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs">{status}</span>;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">📊 Bet History</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark-200 p-4 rounded-lg border border-gold-500/20">
          <p className="text-gray-400 text-sm">Total Bets</p>
          <p className="text-2xl font-bold text-white">{stats.totalBets || 0}</p>
        </div>
        <div className="bg-dark-200 p-4 rounded-lg border border-green-500/20">
          <p className="text-gray-400 text-sm">Won</p>
          <p className="text-2xl font-bold text-green-500">{stats.totalWon || 0}</p>
        </div>
        <div className="bg-dark-200 p-4 rounded-lg border border-red-500/20">
          <p className="text-gray-400 text-sm">Lost</p>
          <p className="text-2xl font-bold text-red-500">{stats.totalLost || 0}</p>
        </div>
        <div className="bg-dark-200 p-4 rounded-lg border border-yellow-500/20">
          <p className="text-gray-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.totalPending || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            filter === 'all'
              ? 'bg-gold-500 text-dark-100'
              : 'bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            filter === 'pending'
              ? 'bg-yellow-500 text-dark-100'
              : 'bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('won')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            filter === 'won'
              ? 'bg-green-500 text-dark-100'
              : 'bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300'
          }`}
        >
          Won
        </button>
        <button
          onClick={() => setFilter('lost')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            filter === 'lost'
              ? 'bg-red-500 text-dark-100'
              : 'bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300'
          }`}
        >
          Lost
        </button>
      </div>

      {/* Bet List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      ) : filteredBets.length === 0 ? (
        <div className="text-center py-12 bg-dark-200 rounded-xl">
          <p className="text-gray-400">No bets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBets.map((bet) => (
            <div
              key={bet._id}
              className="bg-dark-200 rounded-xl p-4 border border-gold-500/10 hover:border-gold-500/30 transition"
            >
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">{bet.match?.league || 'Unknown'}</span>
                    {getStatusBadge(bet.status)}
                  </div>
                  <p className="text-white font-semibold mt-1">
                    {bet.match?.homeTeam || 'Unknown'} vs {bet.match?.awayTeam || 'Unknown'}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    <span className="text-gold-500">Selection: {bet.selection}</span>
                    <span className="text-gray-400">Odds: {bet.odds?.toFixed(2)}</span>
                    <span className="text-gray-400">Stake: {bet.amount} ETB</span>
                    <span className="text-green-500">Potential: {bet.potentialWin?.toFixed(2)} ETB</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    {formatDate(bet.placedAt)}
                  </p>
                </div>
                <div className="text-right">
                  {bet.status === 'WON' && (
                    <p className="text-green-500 font-bold">
                      +{bet.potentialWin?.toFixed(2)} ETB
                    </p>
                  )}
                  {bet.status === 'LOST' && (
                    <p className="text-red-500 font-bold">
                      -{bet.amount} ETB
                    </p>
                  )}
                  {bet.status === 'PENDING' && (
                    <p className="text-yellow-500 font-bold">Pending</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BetHistory;

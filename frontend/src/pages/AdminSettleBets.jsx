import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaCheck, FaTimes, FaClock, FaSearch, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminSettleBets = () => {
  const { user } = useAuth();
  const [bets, setBets] = useState([]);
  const [filteredBets, setFilteredBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBets();
  }, []);

  const fetchBets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/bets');
      setBets(response.data.data || []);
      setFilteredBets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bets:', error);
      toast.error('Failed to fetch bets');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (status) => {
    setFilter(status);
    if (status === 'all') {
      setFilteredBets(bets);
    } else {
      setFilteredBets(bets.filter(bet => bet.status === status));
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    const filtered = bets.filter(bet =>
      bet.user?.username?.toLowerCase().includes(value) ||
      bet.user?.email?.toLowerCase().includes(value) ||
      bet.match?.homeTeam?.toLowerCase().includes(value) ||
      bet.match?.awayTeam?.toLowerCase().includes(value)
    );
    setFilteredBets(filtered);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'WON':
        return <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs flex items-center gap-1"><FaCheck /> Won</span>;
      case 'LOST':
        return <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs flex items-center gap-1"><FaTimes /> Lost</span>;
      case 'PENDING':
        return <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs flex items-center gap-1"><FaClock /> Pending</span>;
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

  const stats = {
    total: bets.length,
    pending: bets.filter(b => b.status === 'PENDING').length,
    won: bets.filter(b => b.status === 'WON').length,
    lost: bets.filter(b => b.status === 'LOST').length,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">💰 All Bets</h1>
        <div className="flex gap-3 text-sm">
          <span className="text-gray-400">Total: <span className="text-white font-bold">{stats.total}</span></span>
          <span className="text-yellow-400">Pending: <span className="text-white font-bold">{stats.pending}</span></span>
          <span className="text-green-400">Won: <span className="text-white font-bold">{stats.won}</span></span>
          <span className="text-red-400">Lost: <span className="text-white font-bold">{stats.lost}</span></span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search by user or match..."
            value={search}
            onChange={handleSearch}
            className="w-full bg-dark-200 text-white pl-10 pr-4 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === 'all' ? 'bg-gold-500 text-dark-100' : 'bg-dark-200 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilter('PENDING')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === 'PENDING' ? 'bg-yellow-500 text-dark-100' : 'bg-dark-200 text-gray-400 hover:text-white'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilter('WON')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === 'WON' ? 'bg-green-500 text-dark-100' : 'bg-dark-200 text-gray-400 hover:text-white'
            }`}
          >
            Won
          </button>
          <button
            onClick={() => handleFilter('LOST')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === 'LOST' ? 'bg-red-500 text-dark-100' : 'bg-dark-200 text-gray-400 hover:text-white'
            }`}
          >
            Lost
          </button>
        </div>
      </div>

      {/* Bets Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading bets...</p>
        </div>
      ) : filteredBets.length === 0 ? (
        <div className="text-center py-12 bg-dark-200 rounded-xl">
          <p className="text-gray-400">No bets found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Match</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Selection</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Odds</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Stake</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Potential Win</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Placed</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Settled</th>
              </tr>
            </thead>
            <tbody>
              {filteredBets.map((bet) => (
                <tr key={bet._id} className="border-b border-gold-500/10 hover:bg-dark-200/50 transition">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{bet.user?.username}</p>
                      <p className="text-gray-400 text-xs">{bet.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {bet.match?.homeTeam} vs {bet.match?.awayTeam}
                    {bet.match && bet.match.homeScore !== undefined && bet.match.homeScore !== null && (
                      <span className="text-xs text-gray-500 block">
                        Score: {bet.match.homeScore} - {bet.match.awayScore}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gold-500 text-sm font-bold">{bet.selection}</td>
                  <td className="px-4 py-3 text-white text-sm">{bet.odds?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-white text-sm">{bet.amount} ETB</td>
                  <td className="px-4 py-3 text-green-500 text-sm font-bold">{bet.potentialWin?.toFixed(2)} ETB</td>
                  <td className="px-4 py-3">{getStatusBadge(bet.status)}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(bet.placedAt)}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {bet.settledAt ? formatDate(bet.settledAt) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminSettleBets;
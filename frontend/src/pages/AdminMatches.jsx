import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaHandshake } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [formData, setFormData] = useState({
    league: '',
    homeTeam: '',
    awayTeam: '',
    homeOdds: '',
    drawOdds: '',
    awayOdds: '',
    kickoff: '',
    status: 'UPCOMING',
    homeScore: '',
    awayScore: '',
  });

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/matches');
      setMatches(response.data.data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openCreateModal = () => {
    setEditingMatch(null);
    setFormData({
      league: '',
      homeTeam: '',
      awayTeam: '',
      homeOdds: '',
      drawOdds: '',
      awayOdds: '',
      kickoff: '',
      status: 'UPCOMING',
      homeScore: '',
      awayScore: '',
    });
    setShowModal(true);
  };

  const openEditModal = (match) => {
    setEditingMatch(match);
    setFormData({
      league: match.league || '',
      homeTeam: match.homeTeam || '',
      awayTeam: match.awayTeam || '',
      homeOdds: match.homeOdds || '',
      drawOdds: match.drawOdds || '',
      awayOdds: match.awayOdds || '',
      kickoff: match.kickoff ? new Date(match.kickoff).toISOString().slice(0, 16) : '',
      status: match.status || 'UPCOMING',
      homeScore: match.homeScore || '',
      awayScore: match.awayScore || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        homeOdds: parseFloat(formData.homeOdds),
        awayOdds: parseFloat(formData.awayOdds),
        drawOdds: formData.drawOdds ? parseFloat(formData.drawOdds) : null,
        homeScore: formData.homeScore ? parseInt(formData.homeScore) : null,
        awayScore: formData.awayScore ? parseInt(formData.awayScore) : null,
      };

      if (editingMatch) {
        const response = await api.put(`/admin/matches/${editingMatch._id}`, payload);

        if (payload.status === 'FINISHED' && editingMatch.status !== 'FINISHED') {
          const settleResponse = await api.post(`/admin/matches/${editingMatch._id}/settle`);
          toast.success(`✅ Match updated and ${settleResponse.data.data.settledCount} bets settled!`);
        } else {
          toast.success('✅ Match updated successfully!');
        }
      } else {
        await api.post('/admin/matches', payload);
        toast.success('✅ Match created successfully!');
      }

      setShowModal(false);
      fetchMatches();
    } catch (error) {
      console.error('Error saving match:', error);
      toast.error('❌ Failed to save match: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;

    try {
      await api.delete(`/admin/matches/${matchId}`);
      toast.success('✅ Match deleted successfully!');
      fetchMatches();
    } catch (error) {
      console.error('Error deleting match:', error);
      toast.error('❌ Failed to delete match');
    }
  };

  const handleSettle = async (matchId) => {
    if (!window.confirm('Settle all pending bets for this match?')) return;

    try {
      const response = await api.post(`/admin/matches/${matchId}/settle`);
      toast.success(`✅ ${response.data.data.settledCount} bets settled!`);
      fetchMatches();
    } catch (error) {
      console.error('Error settling bets:', error);
      toast.error('❌ Failed to settle bets: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'LIVE':
        return <span className="bg-red-500 text-white px-2 py-1 rounded text-xs animate-pulse">🔴 LIVE</span>;
      case 'HALFTIME':
        return <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">⏸️ HALFTIME</span>;
      case 'FINISHED':
        return <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">✅ FINISHED</span>;
      case 'CANCELLED':
        return <span className="bg-red-700 text-white px-2 py-1 rounded text-xs">❌ CANCELLED</span>;
      default:
        return <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">📅 UPCOMING</span>;
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">⚽ Match Management</h1>
        <button
          onClick={openCreateModal}
          className="bg-gold-500 text-dark-100 px-4 py-2 rounded-lg font-semibold hover:bg-gold-400 transition flex items-center gap-2"
        >
          <FaPlus /> Create Match
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading matches...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 bg-dark-200 rounded-xl">
          <p className="text-gray-400">No matches found. Create your first match!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">League</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Home vs Away</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Odds</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Kickoff</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match._id} className="border-b border-gold-500/10 hover:bg-dark-200/50 transition">
                  <td className="px-4 py-3 text-white text-sm">{match.league}</td>
                  <td className="px-4 py-3">
                    <span className="text-white text-sm">{match.homeTeam}</span>
                    <span className="text-gray-500 mx-2">vs</span>
                    <span className="text-white text-sm">{match.awayTeam}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-sm">
                      <span className="text-gold-500">{match.homeOdds?.toFixed(2)}</span>
                      {match.drawOdds && <span className="text-gold-500">{match.drawOdds?.toFixed(2)}</span>}
                      <span className="text-gold-500">{match.awayOdds?.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white text-sm font-bold">
                      {match.homeScore !== null ? match.homeScore : '-'} - {match.awayScore !== null ? match.awayScore : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(match.status)}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(match.kickoff)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(match)}
                        className="text-blue-400 hover:text-blue-300 transition p-1"
                        title="Edit"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(match._id)}
                        className="text-red-400 hover:text-red-300 transition p-1"
                        title="Delete"
                      >
                        <FaTrash size={18} />
                      </button>
                      {match.status === 'FINISHED' && (
                        <button
                          onClick={() => handleSettle(match._id)}
                          className="text-green-400 hover:text-green-300 transition p-1"
                          title="Settle Bets"
                        >
                          <FaHandshake size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gold-500/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingMatch ? '✏️ Edit Match' : '➕ Create Match'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">League *</label>
                  <input
                    type="text"
                    name="league"
                    value={formData.league}
                    onChange={handleInputChange}
                    className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                  >
                    <option value="UPCOMING">📅 UPCOMING</option>
                    <option value="LIVE">🔴 LIVE</option>
                    <option value="HALFTIME">⏸️ HALFTIME</option>
                    <option value="FINISHED">✅ FINISHED</option>
                    <option value="CANCELLED">❌ CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Home Team *</label>
                  <input
                    type="text"
                    name="homeTeam"
                    value={formData.homeTeam}
                    onChange={handleInputChange}
                    className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Away Team *</label>
                  <input
                    type="text"
                    name="awayTeam"
                    value={formData.awayTeam}
                    onChange={handleInputChange}
                    className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Home Odds *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="homeOdds"
                    value={formData.homeOdds}
                    onChange={handleInputChange}
                    className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Draw Odds</label>
                  <input
                    type="number"
                    step="0.01"
                    name="drawOdds"
                    value={formData.drawOdds}
                    onChange={handleInputChange}
                    className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Away Odds *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="awayOdds"
                    value={formData.awayOdds}
                    onChange={handleInputChange}
                    className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Kickoff Time *</label>
                <input
                  type="datetime-local"
                  name="kickoff"
                  value={formData.kickoff}
                  onChange={handleInputChange}
                  className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Home Score</label>
                  <input
                    type="number"
                    name="homeScore"
                    value={formData.homeScore}
                    onChange={handleInputChange}
                    className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                    placeholder="Leave empty if not started"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Away Score</label>
                  <input
                    type="number"
                    name="awayScore"
                    value={formData.awayScore}
                    onChange={handleInputChange}
                    className="w-full bg-dark-100 text-white px-3 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                    placeholder="Leave empty if not started"
                  />
                </div>
              </div>

              {editingMatch && editingMatch.status !== 'FINISHED' && formData.status === 'FINISHED' && (
                <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 p-3 rounded-lg text-sm">
                  ⚠️ Marking as FINISHED will automatically settle all pending bets for this match.
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gold-500 text-dark-100 py-2 rounded-lg font-semibold hover:bg-gold-400 transition flex items-center justify-center gap-2"
                >
                  <FaSave /> {editingMatch ? 'Update Match' : 'Create Match'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-dark-100 text-gray-400 py-2 rounded-lg font-semibold hover:bg-dark-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMatches;
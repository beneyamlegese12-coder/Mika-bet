import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBetContext } from '../context/BetContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import MatchCard from '../components/betting/MatchCard';
import BetSlip from '../components/betting/BetSlip';
import { FaSync, FaCircle } from 'react-icons/fa';

const Home = () => {
  const { user } = useAuth();
  const { bets } = useBetContext();
  const { isConnected, onMatchUpdate, onBetPlaced } = useSocket();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMatches();
    fetchStats();
  }, []);

  // Socket listeners for live updates
  useEffect(() => {
    const unsubscribeMatch = onMatchUpdate((data) => {
      console.log('?? Match updated:', data);
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match._id === data.matchId 
            ? { ...match, ...data.updates }
            : match
        )
      );
    });

    const unsubscribeBet = onBetPlaced((data) => {
      console.log('?? Bet placed:', data);
      fetchStats();
    });

    return () => {
      if (unsubscribeMatch) unsubscribeMatch();
      if (unsubscribeBet) unsubscribeBet();
    };
  }, [onMatchUpdate, onBetPlaced]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/matches');
      setMatches(response.data.data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
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

  const filteredMatches = matches.filter(match => {
    if (filter === 'live') return match.status === 'LIVE' || match.status === 'HALFTIME';
    if (filter === 'upcoming') return match.status === 'UPCOMING';
    return true;
  });

  const liveMatches = matches.filter(m => m.status === 'LIVE' || m.status === 'HALFTIME');
  const upcomingMatches = matches.filter(m => m.status === 'UPCOMING');

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* WebSocket Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm">
            <FaCircle className={isConnected ? 'text-green-500' : 'text-red-500'} size={10} />
            <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
              {isConnected ? '?? Live Updates Connected' : '?? Disconnected'}
            </span>
          </div>
          <button
            onClick={fetchMatches}
            className="text-gray-400 hover:text-gold-500 transition"
            title="Refresh matches"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-gold-500/10 to-dark-200 rounded-2xl p-6 mb-8 border border-gold-500/20">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.firstName || user?.username}! ??
          </h1>
          <p className="text-gray-400 mt-1">Ready to place your bets?</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-dark-100/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Balance</p>
              <p className="text-gold-500 text-xl font-bold">{user?.balance?.toLocaleString()} ETB</p>
            </div>
            <div className="bg-dark-100/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Total Bets</p>
              <p className="text-white text-xl font-bold">{stats?.totalBets || 0}</p>
            </div>
            <div className="bg-dark-100/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Win Rate</p>
              <p className="text-green-500 text-xl font-bold">{stats?.winRate?.toFixed(1) || 0}%</p>
            </div>
            <div className="bg-dark-100/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Total Won</p>
              <p className="text-green-500 text-xl font-bold">{stats?.winAmount?.toLocaleString() || 0} ETB</p>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                filter === 'all'
                  ? 'bg-gold-500 text-dark-100'
                  : 'bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                filter === 'live'
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300'
              }`}
            >
              ?? Live ({liveMatches.length})
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                filter === 'upcoming'
                  ? 'bg-blue-500 text-white'
                  : 'bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300'
              }`}
            >
              ?? Upcoming ({upcomingMatches.length})
            </button>
          </div>
        </div>

        {/* Matches Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-dark-200 rounded-xl p-4 animate-pulse h-48"></div>
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-12 bg-dark-200 rounded-xl">
            <p className="text-gray-400">No matches available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map(match => (
              <MatchCard key={match._id} match={match} />
            ))}
          </div>
        )}
      </div>

      {/* Bet Slip - Sticky */}
      <div className="w-80 hidden lg:block flex-shrink-0">
        <BetSlip />
      </div>
    </div>
  );
};

export default Home;
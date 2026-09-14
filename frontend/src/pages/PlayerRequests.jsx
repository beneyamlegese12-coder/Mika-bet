import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { 
  FaClock, FaCheck, FaTimes, FaFilter, FaEye, 
  FaUserCheck, FaPhone, FaEnvelope, FaUniversity 
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const PlayerRequests = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [depositRequests, setDepositRequests] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('deposits');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleDepositAccepted = () => {
      toast.info('📩 Deposit request accepted!');
      fetchRequests();
    };

    const handleDepositRejected = (data) => {
      toast.info(`❌ Deposit request rejected: ${data.reason}`);
      fetchRequests();
    };

    const handleDepositCompleted = () => {
      fetchRequests();
    };

    const handleWithdrawAccepted = () => {
      toast.info('📩 Withdrawal request accepted!');
      fetchRequests();
    };

    const handleWithdrawRejected = (data) => {
      toast.info(`❌ Withdrawal request rejected: ${data.reason}`);
      fetchRequests();
    };

    socket.on('deposit-accepted', handleDepositAccepted);
    socket.on('deposit-rejected', handleDepositRejected);
    socket.on('deposit-completed', handleDepositCompleted);
    socket.on('withdraw-accepted', handleWithdrawAccepted);
    socket.on('withdraw-rejected', handleWithdrawRejected);

    return () => {
      socket.off('deposit-accepted', handleDepositAccepted);
      socket.off('deposit-rejected', handleDepositRejected);
      socket.off('deposit-completed', handleDepositCompleted);
      socket.off('withdraw-accepted', handleWithdrawAccepted);
      socket.off('withdraw-rejected', handleWithdrawRejected);
    };
  }, [socket]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [deposits, withdraws] = await Promise.all([
        api.get('/player/deposits'),
        api.get('/player/withdrawals'),
      ]);
      setDepositRequests(deposits.data.data || []);
      setWithdrawRequests(withdraws.data.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING':
        return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs flex items-center gap-1"><FaClock /> Pending</span>;
      case 'PROCESSING':
        return <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs flex items-center gap-1">Processing</span>;
      case 'PAYMENT_SENT':
        return <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs flex items-center gap-1">Payment Sent</span>;
      case 'COMPLETED':
        return <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs flex items-center gap-1"><FaCheck /> Completed</span>;
      case 'REJECTED':
        return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs flex items-center gap-1"><FaTimes /> Rejected</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs">{status}</span>;
    }
  };

  const getFilteredRequests = () => {
    const requests = activeTab === 'deposits' ? depositRequests : withdrawRequests;
    
    if (filter === 'all') return requests;
    if (filter === 'pending') return requests.filter(r => r.status === 'PENDING' || r.status === 'PROCESSING');
    if (filter === 'completed') return requests.filter(r => r.status === 'COMPLETED');
    if (filter === 'rejected') return requests.filter(r => r.status === 'REJECTED');
    return requests;
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

  const filteredRequests = getFilteredRequests();

  const getStatusCounts = (type) => {
    const requests = type === 'deposits' ? depositRequests : withdrawRequests;
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'PENDING' || r.status === 'PROCESSING').length,
      completed: requests.filter(r => r.status === 'COMPLETED').length,
      rejected: requests.filter(r => r.status === 'REJECTED').length,
    };
  };

  const depositCounts = getStatusCounts('deposits');
  const withdrawCounts = getStatusCounts('withdraws');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">📋 My Requests</h1>

      {/* Tabs */}
      <div className="flex border-b border-gold-500/20 mb-6">
        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'deposits'
              ? 'text-gold-500 border-b-2 border-gold-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Deposits ({depositCounts.total})
        </button>
        <button
          onClick={() => setActiveTab('withdraws')}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'withdraws'
              ? 'text-gold-500 border-b-2 border-gold-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Withdrawals ({withdrawCounts.total})
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
        <div className="bg-dark-200 p-3 rounded-lg border border-gold-500/20 text-center">
          <p className="text-gray-400">Total</p>
          <p className="text-white font-bold">{activeTab === 'deposits' ? depositCounts.total : withdrawCounts.total}</p>
        </div>
        <div className="bg-dark-200 p-3 rounded-lg border border-yellow-500/20 text-center">
          <p className="text-gray-400">Pending</p>
          <p className="text-yellow-400 font-bold">{activeTab === 'deposits' ? depositCounts.pending : withdrawCounts.pending}</p>
        </div>
        <div className="bg-dark-200 p-3 rounded-lg border border-green-500/20 text-center">
          <p className="text-gray-400">Completed</p>
          <p className="text-green-400 font-bold">{activeTab === 'deposits' ? depositCounts.completed : withdrawCounts.completed}</p>
        </div>
        <div className="bg-dark-200 p-3 rounded-lg border border-red-500/20 text-center">
          <p className="text-gray-400">Rejected</p>
          <p className="text-red-400 font-bold">{activeTab === 'deposits' ? depositCounts.rejected : withdrawCounts.rejected}</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded text-sm transition ${
            filter === 'all'
              ? 'bg-gold-500 text-dark-100'
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded text-sm transition ${
            filter === 'pending'
              ? 'bg-yellow-500 text-dark-100'
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1 rounded text-sm transition ${
            filter === 'completed'
              ? 'bg-green-500 text-dark-100'
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-3 py-1 rounded text-sm transition ${
            filter === 'rejected'
              ? 'bg-red-500 text-dark-100'
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-dark-200 rounded-xl">
          <p className="text-gray-400">No {activeTab} requests found</p>
          <p className="text-gray-500 text-sm mt-1">Start a new {activeTab === 'deposits' ? 'deposit' : 'withdrawal'} request</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div key={req._id} className="bg-dark-200 rounded-xl p-4 border border-gold-500/10 hover:border-gold-500/30 transition">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">
                      {req.amount} ETB
                    </span>
                    {getStatusBadge(req.status)}
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    Requested: {formatDate(req.requestedAt)}
                  </p>
                  
                  {/* Agent Info - Show when accepted/processing */}
                  {(req.status === 'PROCESSING' || req.status === 'PAYMENT_SENT' || req.status === 'COMPLETED') && (
                    <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-xs text-gray-400">Handled by:</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 text-xs font-bold">
                          {req.handlerId?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <span className="text-white text-sm font-medium">{req.handlerId?.username || 'Agent'}</span>
                      </div>
                      {req.handlerId?.phone && (
                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                          <FaPhone size={10} /> {req.handlerId.phone}
                        </p>
                      )}
                      {req.handlerId?.email && (
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                          <FaEnvelope size={10} /> {req.handlerId.email}
                        </p>
                      )}
                      {/* Show Bank Info if available */}
                      {req.handlerBankInfo?.bankName && (
                        <div className="mt-1 p-1 bg-blue-500/10 rounded text-xs">
                          <p className="text-gray-400">Bank: <span className="text-white">{req.handlerBankInfo.bankName}</span></p>
                          <p className="text-gray-400">Account: <span className="text-white">{req.handlerBankInfo.accountNumber}</span></p>
                          <p className="text-gray-400">Holder: <span className="text-white">{req.handlerBankInfo.accountHolder}</span></p>
                        </div>
                      )}
                    </div>
                  )}

                  {req.rejectedReason && (
                    <p className="text-red-400 text-xs mt-1">
                      Reason: {req.rejectedReason}
                    </p>
                  )}
                  {req.completedAt && (
                    <p className="text-gray-400 text-xs">
                      Completed: {formatDate(req.completedAt)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {req.status === 'PENDING' && (
                    <span className="text-yellow-400 text-xs flex items-center gap-1">
                      <FaClock /> Waiting for agent
                    </span>
                  )}
                  {req.status === 'PROCESSING' && (
                    <span className="text-blue-400 text-xs flex items-center gap-1">
                      <FaEye /> Being processed
                    </span>
                  )}
                  {req.status === 'COMPLETED' && (
                    <span className="text-green-400 text-xs flex items-center gap-1">
                      <FaCheck /> Done
                    </span>
                  )}
                  {req.status === 'REJECTED' && (
                    <span className="text-red-400 text-xs flex items-center gap-1">
                      <FaTimes /> Rejected
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        {isConnected ? '🟢 Live Updates' : '🔴 Reconnecting...'}
      </div>
    </div>
  );
};

export default PlayerRequests;
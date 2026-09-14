import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { 
  FaUsers, FaWallet, FaCheck, FaClock, 
  FaUniversity, FaUser, FaCrown, FaShieldAlt,
  FaSearch, FaEye, FaCheckCircle, FaArrowUp, FaArrowDown,
  FaArrowRight, FaCheckDouble, FaMoneyBillWave
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AgentDashboard = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [incomingRequests, setIncomingRequests] = useState({
    pending: [],
    processing: [],
    paymentSent: [],
    completed: []
  });
  
  const [outgoingRequests, setOutgoingRequests] = useState({
    pending: [],
    processing: [],
    paymentSent: [],
    completed: []
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmRequestId, setConfirmRequestId] = useState(null);
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });
  const [paymentInfo, setPaymentInfo] = useState({
    senderName: '',
    referenceNumber: '',
  });
  const [activeTab, setActiveTab] = useState('incoming');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getRoleDisplay = () => {
    if (user?.role === 'admin') return 'Admin';
    if (user?.role === 'superagent') return '⭐ SuperAgent';
    if (user?.role === 'agent') return 'Agent';
    return 'Player';
  };

  const getHandlesRole = () => {
    if (user?.role === 'admin') return 'superagent';
    if (user?.role === 'superagent') return 'agent';
    if (user?.role === 'agent') return 'player';
    return null;
  };

  const getReportsToDisplay = () => {
    if (user?.role === 'admin') return '';
    if (user?.role === 'superagent') return 'Admin';
    if (user?.role === 'agent') return 'SuperAgent';
    return '';
  };

  const getHandlesDisplay = () => {
    if (user?.role === 'admin') return 'SuperAgents';
    if (user?.role === 'superagent') return 'Agents';
    if (user?.role === 'agent') return 'Players';
    return '';
  };

  useEffect(() => {
    fetchAllRequests();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handlePaymentSubmitted = () => {
      toast.info('📩 Payment submitted!');
      fetchAllRequests();
    };

    const handleDepositCompleted = () => {
      toast.success('✅ Deposit completed!');
      fetchAllRequests();
    };

    const handleNewRequest = (data) => {
      toast.info(`💰 New deposit request: ${data.amount} ETB`);
      fetchAllRequests();
    };

    socket.on('payment-submitted', handlePaymentSubmitted);
    socket.on('deposit-completed', handleDepositCompleted);
    socket.on('new-deposit-request', handleNewRequest);

    return () => {
      socket.off('payment-submitted', handlePaymentSubmitted);
      socket.off('deposit-completed', handleDepositCompleted);
      socket.off('new-deposit-request', handleNewRequest);
    };
  }, [socket]);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      
      const depositsResponse = await api.get('/agent/deposits');
      const allRequests = depositsResponse.data.data || [];
      
      console.log('📋 All requests from API:', allRequests);
      console.log('👤 User ID:', user?._id);
      console.log('👤 User Role:', user?.role);
      
      const handlesRole = getHandlesRole();
      
      const incoming = [];
      const outgoing = [];
      
      allRequests.forEach(req => {
        if (req.playerType === handlesRole) {
          incoming.push(req);
        }
        else if (req.playerId === user?._id || req.playerId?._id === user?._id) {
          outgoing.push(req);
        }
        else {
          const playerIdStr = req.playerId?._id?.toString() || req.playerId?.toString();
          const userIdStr = user?._id?.toString();
          if (playerIdStr === userIdStr) {
            outgoing.push(req);
          }
        }
      });
      
      const sortByStatus = (requests) => {
        return {
          pending: requests.filter(r => r.status === 'PENDING'),
          processing: requests.filter(r => r.status === 'PROCESSING'),
          paymentSent: requests.filter(r => r.status === 'PAYMENT_SENT'),
          completed: requests.filter(r => r.status === 'COMPLETED'),
        };
      };
      
      setIncomingRequests(sortByStatus(incoming));
      setOutgoingRequests(sortByStatus(outgoing));
      
      console.log('📊 Incoming Requests:', incoming.length);
      console.log('📊 Outgoing Requests:', outgoing.length);

    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await api.post(`/requests/${requestId}/accept`);
      toast.success('✅ Request accepted!');
      fetchAllRequests();
    } catch (error) {
      console.error('Accept error:', error);
      toast.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleSendBankInfo = async () => {
    if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
      toast.error('Please fill all bank details');
      return;
    }

    try {
      await api.post(`/requests/${selectedRequest._id}/bank-info`, bankInfo);
      toast.success('✅ Bank info sent! Waiting for requester to submit payment.');
      setShowBankModal(false);
      setBankInfo({ bankName: '', accountNumber: '', accountHolder: '' });
      setSelectedRequest(null);
      fetchAllRequests();
    } catch (error) {
      console.error('Bank info error:', error);
      toast.error(error.response?.data?.message || 'Failed to send bank info');
    }
  };

  const handleSubmitPaymentInfo = async () => {
    if (!paymentInfo.senderName || !paymentInfo.referenceNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await api.post(`/withdraw/${selectedRequest._id}/payment-info`, {
        senderName: paymentInfo.senderName,
        referenceNumber: paymentInfo.referenceNumber,
      });
      toast.success('✅ Payment info submitted! Requester will confirm.');
      setShowPaymentModal(false);
      setPaymentInfo({ senderName: '', referenceNumber: '' });
      setSelectedRequest(null);
      fetchAllRequests();
    } catch (error) {
      console.error('Payment info error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit payment info');
    }
  };

  const handleCompleteDeposit = (requestId) => {
    setConfirmRequestId(requestId);
    setShowConfirmModal(true);
  };

  const confirmComplete = async () => {
    try {
      const response = await api.post(`/requests/${confirmRequestId}/complete`);
      toast.success(`✅ Deposit completed!`);
      setShowConfirmModal(false);
      setConfirmRequestId(null);
      fetchAllRequests();
    } catch (error) {
      console.error('Complete error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete deposit');
      setShowConfirmModal(false);
    }
  };

  const cancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmRequestId(null);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING':
        return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs flex items-center gap-1"><FaClock /> Pending</span>;
      case 'PROCESSING':
        return <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs flex items-center gap-1"><FaEye /> Processing</span>;
      case 'PAYMENT_SENT':
        return <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs flex items-center gap-1"><FaCheckCircle /> Payment Sent</span>;
      case 'COMPLETED':
        return <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs flex items-center gap-1"><FaCheckDouble /> Completed</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs">{status}</span>;
    }
  };

  const getFilteredRequests = (requests) => {
    if (!searchTerm) return requests;
    return requests.filter(req => 
      req.playerId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.playerId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getCounts = (requestObj) => {
    return {
      pending: requestObj.pending?.length || 0,
      processing: requestObj.processing?.length || 0,
      paymentSent: requestObj.paymentSent?.length || 0,
      completed: requestObj.completed?.length || 0,
      total: (requestObj.pending?.length || 0) + (requestObj.processing?.length || 0) + (requestObj.paymentSent?.length || 0) + (requestObj.completed?.length || 0)
    };
  };

  const renderRequestsTable = (requests, emptyMessage, showActions = true) => {
    const filtered = getFilteredRequests(requests || []);
    
    if (filtered.length === 0) {
      return (
        <div className="text-center py-6 text-gray-400 text-sm">
          {emptyMessage || 'No requests'}
        </div>
      );
    }

    return (
      <div className="bg-dark-200 rounded-xl border border-gold-500/10 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-dark-300">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Requester</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Details</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Requested</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => {
              // Check if this is a deposit or withdrawal
              const isWithdrawal = req.requesterBankInfo?.bankName || req.handlerPaymentInfo?.senderName;
              const isDeposit = req.handlerBankInfo?.bankName || req.requesterPaymentInfo?.senderName;
              
              return (
                <tr key={req._id} className="border-b border-gold-500/10 hover:bg-dark-100/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 text-sm font-bold">
                        {req.playerId?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <span className="text-white text-sm font-medium">{req.playerId?.username}</span>
                        <p className="text-gray-500 text-xs">{req.playerId?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gold-500 font-bold">{req.amount} ETB</td>
                  <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {/* DEPOSIT: Requester's payment info (sender name + reference) */}
                    {req.requesterPaymentInfo?.senderName && (
                      <div className="text-xs">
                        <p className="text-white">Sender: {req.requesterPaymentInfo.senderName}</p>
                        <p className="text-gray-500">Ref: {req.requesterPaymentInfo.referenceNumber}</p>
                      </div>
                    )}
                    
                    {/* DEPOSIT: Handler's bank info (bank details to send money to) */}
                    {req.handlerBankInfo?.bankName && (
                      <div className="text-xs text-gray-500">
                        Bank: {req.handlerBankInfo.bankName}
                      </div>
                    )}
                    
                    {/* WITHDRAWAL: Requester's bank info (where to send money) */}
                    {req.requesterBankInfo?.bankName && (
                      <div className="text-xs bg-blue-500/10 p-1.5 rounded border border-blue-500/20">
                        <p className="text-blue-400 font-semibold text-xs">📤 Send money to:</p>
                        <p className="text-white text-xs">🏦 {req.requesterBankInfo.bankName}</p>
                        <p className="text-white text-xs">📋 {req.requesterBankInfo.accountNumber}</p>
                        <p className="text-white text-xs">👤 {req.requesterBankInfo.accountHolder}</p>
                      </div>
                    )}
                    
                    {/* WITHDRAWAL: Handler's payment info (after sending money) */}
                    {req.handlerPaymentInfo?.senderName && (
                      <div className="text-xs bg-green-500/10 p-1.5 rounded border border-green-500/20">
                        <p className="text-green-400 text-xs">✅ Payment sent:</p>
                        <p className="text-white text-xs">Sender: {req.handlerPaymentInfo.senderName}</p>
                        <p className="text-white text-xs">Ref: {req.handlerPaymentInfo.referenceNumber}</p>
                      </div>
                    )}
                    
                    {/* Status messages */}
                    {req.status === 'PROCESSING' && !req.requesterPaymentInfo?.senderName && !req.handlerPaymentInfo?.senderName && (
                      <span className="text-yellow-400 text-xs flex items-center gap-1">
                        <FaClock /> {isWithdrawal ? 'Waiting for handler to send money' : 'Waiting for requester to submit payment'}
                      </span>
                    )}
                    {req.status === 'PROCESSING' && req.handlerBankInfo?.bankName && !req.requesterPaymentInfo?.senderName && (
                      <span className="text-yellow-400 text-xs flex items-center gap-1">
                        <FaClock /> Waiting for requester to submit payment
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {new Date(req.requestedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {/* PENDING → ACCEPT */}
                    {req.status === 'PENDING' && showActions && (
                      <button
                        onClick={() => handleAcceptRequest(req._id)}
                        className="bg-gold-500 text-dark-100 px-4 py-1.5 rounded text-sm font-semibold hover:bg-gold-400 transition transform hover:scale-105"
                      >
                        ✅ Accept
                      </button>
                    )}
                    
                    {/* PROCESSING → SEND BANK INFO (for deposits) */}
                    {req.status === 'PROCESSING' && showActions && !req.requesterBankInfo?.bankName && (
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setShowBankModal(true);
                        }}
                        className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-blue-400 transition transform hover:scale-105"
                      >
                        📤 Send Bank Info
                      </button>
                    )}
                    
                    {/* PROCESSING → SUBMIT PAYMENT INFO (for withdrawals) */}
                    {req.status === 'PROCESSING' && showActions && req.requesterBankInfo?.bankName && (
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setShowPaymentModal(true);
                        }}
                        className="bg-purple-500 text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-purple-400 transition transform hover:scale-105"
                      >
                        💰 Send Money & Submit
                      </button>
                    )}
                    
                    {/* PAYMENT_SENT → VERIFY & COMPLETE */}
                    {req.status === 'PAYMENT_SENT' && showActions && (
                      <button
                        onClick={() => handleCompleteDeposit(req._id)}
                        className="bg-green-500 text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-green-400 transition transform hover:scale-105 animate-pulse"
                      >
                        ✅ Verify & Complete
                      </button>
                    )}
                    
                    {/* COMPLETED → DONE */}
                    {req.status === 'COMPLETED' && (
                      <span className="text-green-400 text-xs flex items-center gap-1">
                        <FaCheckDouble /> Done
                      </span>
                    )}
                    
                    {/* OUTGOING - No actions */}
                    {!showActions && req.status !== 'COMPLETED' && req.status !== 'REJECTED' && (
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <FaClock /> Waiting for {getReportsToDisplay()}
                      </span>
                    )}
                    {req.status === 'REJECTED' && (
                      <span className="text-red-400 text-xs">❌ Rejected</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const getFilteredIncoming = () => {
    if (statusFilter === 'all') {
      return [...(incomingRequests.pending || []), ...(incomingRequests.processing || []), ...(incomingRequests.paymentSent || []), ...(incomingRequests.completed || [])];
    }
    if (statusFilter === 'pending') return incomingRequests.pending || [];
    if (statusFilter === 'processing') return incomingRequests.processing || [];
    if (statusFilter === 'paymentsent') return incomingRequests.paymentSent || [];
    if (statusFilter === 'completed') return incomingRequests.completed || [];
    return [];
  };

  const getFilteredOutgoing = () => {
    if (statusFilter === 'all') {
      return [...(outgoingRequests.pending || []), ...(outgoingRequests.processing || []), ...(outgoingRequests.paymentSent || []), ...(outgoingRequests.completed || [])];
    }
    if (statusFilter === 'pending') return outgoingRequests.pending || [];
    if (statusFilter === 'processing') return outgoingRequests.processing || [];
    if (statusFilter === 'paymentsent') return outgoingRequests.paymentSent || [];
    if (statusFilter === 'completed') return outgoingRequests.completed || [];
    return [];
  };

  const incomingCounts = getCounts(incomingRequests);
  const outgoingCounts = getCounts(outgoingRequests);

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">👔 {getRoleDisplay()} Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            {user?.role === 'superagent' && (
              <span className="text-purple-400">⭐ Manage Agents • Request from Admin</span>
            )}
            {user?.role === 'agent' && (
              <span className="text-blue-400">👤 Manage Players • Request from SuperAgent</span>
            )}
            {user?.role === 'admin' && (
              <span className="text-red-400">🛡️ Manage SuperAgents</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </span>
          <div className="bg-dark-200 px-4 py-2 rounded-lg">
            <span className="text-gray-400 text-sm">Balance: </span>
            <span className="text-gold-500 font-bold">{user?.balance?.toLocaleString()} ETB</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-dark-200 p-4 rounded-lg border border-blue-500/20">
          <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
            <FaArrowDown /> Incoming ({getHandlesDisplay()})
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
              <p className="text-gray-400 text-xs">⏳ Pending</p>
              <p className="text-yellow-400 font-bold text-lg">{incomingCounts.pending}</p>
            </div>
            <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
              <p className="text-gray-400 text-xs">🔄 Processing</p>
              <p className="text-blue-400 font-bold text-lg">{incomingCounts.processing}</p>
            </div>
            <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20">
              <p className="text-gray-400 text-xs">📩 Payment Sent</p>
              <p className="text-purple-400 font-bold text-lg">{incomingCounts.paymentSent}</p>
            </div>
            <div className="bg-green-500/10 p-2 rounded border border-green-500/20">
              <p className="text-gray-400 text-xs">✅ Completed</p>
              <p className="text-green-400 font-bold text-lg">{incomingCounts.completed}</p>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Total: {incomingCounts.total}</span>
            <span className="flex items-center gap-1">
              <FaArrowRight className="text-blue-400" size={10} />
              Pending → Processing → Payment Sent → Completed
            </span>
          </div>
        </div>

        <div className="bg-dark-200 p-4 rounded-lg border border-purple-500/20">
          <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
            <FaArrowUp /> Outgoing (To {getReportsToDisplay()})
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
              <p className="text-gray-400 text-xs">⏳ Pending</p>
              <p className="text-yellow-400 font-bold text-lg">{outgoingCounts.pending}</p>
            </div>
            <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
              <p className="text-gray-400 text-xs">🔄 Processing</p>
              <p className="text-blue-400 font-bold text-lg">{outgoingCounts.processing}</p>
            </div>
            <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20">
              <p className="text-gray-400 text-xs">📩 Payment Sent</p>
              <p className="text-purple-400 font-bold text-lg">{outgoingCounts.paymentSent}</p>
            </div>
            <div className="bg-green-500/10 p-2 rounded border border-green-500/20">
              <p className="text-gray-400 text-xs">✅ Completed</p>
              <p className="text-green-400 font-bold text-lg">{outgoingCounts.completed}</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs text-center mt-2">Total: {outgoingCounts.total}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-500 text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search by user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-200 text-white pl-10 pr-4 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 border-b border-gold-500/10 pb-2">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'incoming'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              : 'text-gray-400 hover:text-white hover:bg-dark-300'
          }`}
        >
          📥 Incoming ({incomingCounts.total})
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'outgoing'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'text-gray-400 hover:text-white hover:bg-dark-300'
          }`}
        >
          📤 Outgoing ({outgoingCounts.total})
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 rounded text-xs transition ${
            statusFilter === 'all'
              ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          📋 All
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1 rounded text-xs transition ${
            statusFilter === 'pending'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          ⏳ Pending
        </button>
        <button
          onClick={() => setStatusFilter('processing')}
          className={`px-3 py-1 rounded text-xs transition ${
            statusFilter === 'processing'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          🔄 Processing
        </button>
        <button
          onClick={() => setStatusFilter('paymentsent')}
          className={`px-3 py-1 rounded text-xs transition ${
            statusFilter === 'paymentsent'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          📩 Payment Sent
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1 rounded text-xs transition ${
            statusFilter === 'completed'
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          ✅ Completed
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'incoming' && (
            <div>
              <h2 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                📥 Incoming Requests (From {getHandlesDisplay()})
                <span className="text-xs text-gray-500 font-normal">
                  {statusFilter !== 'all' ? `• Filter: ${statusFilter}` : ''}
                </span>
              </h2>
              {renderRequestsTable(
                getFilteredIncoming(),
                `No incoming requests from ${getHandlesDisplay()}`,
                true
              )}
            </div>
          )}

          {activeTab === 'outgoing' && (
            <div>
              <h2 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                📤 Outgoing Requests (To {getReportsToDisplay()})
                <span className="text-xs text-gray-500 font-normal">
                  {statusFilter !== 'all' ? `• Filter: ${statusFilter}` : ''}
                </span>
              </h2>
              {renderRequestsTable(
                getFilteredOutgoing(),
                `No outgoing requests to ${getReportsToDisplay()}`,
                false
              )}
            </div>
          )}
        </>
      )}

      {/* Send Bank Info Modal (for deposits) */}
      {showBankModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-2xl p-6 max-w-md w-full border border-gold-500/20">
            <div className="flex items-center gap-3 mb-4">
              <FaUniversity className="text-blue-400 text-2xl" />
              <h2 className="text-xl font-bold text-white">🏦 Send Bank Info</h2>
            </div>
            <div className="bg-dark-100 p-3 rounded-lg mb-4">
              <p className="text-gray-400 text-sm">Requester: <span className="text-white font-medium">{selectedRequest?.playerId?.username}</span></p>
              <p className="text-gray-400 text-sm">Amount: <span className="text-gold-500 font-bold">{selectedRequest?.amount} ETB</span></p>
              <p className="text-gray-400 text-sm">Status: <span className="text-blue-400">{selectedRequest?.status}</span></p>
              <p className="text-yellow-400 text-sm">⚠️ Requester must submit payment after receiving bank info.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={bankInfo.bankName}
                  onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                  className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                  placeholder="e.g., Commercial Bank"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Account Number *</label>
                <input
                  type="text"
                  value={bankInfo.accountNumber}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                  className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                  placeholder="e.g., 1000123456789"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Account Holder *</label>
                <input
                  type="text"
                  value={bankInfo.accountHolder}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                  className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                  placeholder="Full name"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSendBankInfo}
                className="flex-1 bg-gold-500 text-dark-100 py-2 rounded-lg font-semibold hover:bg-gold-400 transition"
              >
                Send to Requester
              </button>
              <button
                onClick={() => {
                  setShowBankModal(false);
                  setBankInfo({ bankName: '', accountNumber: '', accountHolder: '' });
                  setSelectedRequest(null);
                }}
                className="flex-1 bg-dark-100 text-gray-400 py-2 rounded-lg font-semibold hover:bg-dark-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Payment Modal - Handler sends money */}
      {showPaymentModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-2xl p-6 max-w-md w-full border border-gold-500/20">
            <div className="flex items-center gap-3 mb-4">
              <FaMoneyBillWave className="text-purple-400 text-2xl" />
              <h2 className="text-xl font-bold text-white">💰 Send Money & Submit</h2>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
              <p className="text-gray-400 text-sm">Send money to requester's bank:</p>
              <div className="mt-2 space-y-1 text-sm">
                <p className="flex justify-between"><span className="text-gray-400">Bank</span><span className="text-white">{selectedRequest?.requesterBankInfo?.bankName}</span></p>
                <p className="flex justify-between"><span className="text-gray-400">Account</span><span className="text-white">{selectedRequest?.requesterBankInfo?.accountNumber}</span></p>
                <p className="flex justify-between"><span className="text-gray-400">Holder</span><span className="text-white">{selectedRequest?.requesterBankInfo?.accountHolder}</span></p>
                <p className="flex justify-between"><span className="text-gold-500">Amount</span><span className="text-gold-500 font-bold">{selectedRequest?.amount} ETB</span></p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Your Full Name (Sender) *</label>
                <input
                  type="text"
                  value={paymentInfo.senderName}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, senderName: e.target.value })}
                  className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Reference Number *</label>
                <input
                  type="text"
                  value={paymentInfo.referenceNumber}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, referenceNumber: e.target.value.toUpperCase() })}
                  className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none uppercase"
                  placeholder="e.g., REF123456"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmitPaymentInfo}
                className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-semibold hover:bg-purple-400 transition"
              >
                Submit Payment Info
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentInfo({ senderName: '', referenceNumber: '' });
                  setSelectedRequest(null);
                }}
                className="flex-1 bg-dark-100 text-gray-400 py-2 rounded-lg font-semibold hover:bg-dark-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Complete Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-2xl p-6 max-w-md w-full border border-gold-500/20">
            <div className="flex items-center gap-3 mb-4">
              <FaCheckCircle className="text-green-400 text-2xl" />
              <h2 className="text-xl font-bold text-white">✅ Confirm</h2>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <p className="text-yellow-400 text-sm">
                ⚠️ Confirm you have received the payment from the requester and want to complete?
              </p>
              <p className="text-gray-400 text-xs mt-2">
                This will add {selectedRequest?.amount || 0} ETB to {selectedRequest?.playerId?.username}'s balance.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmComplete}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-400 transition"
              >
                Yes, Complete
              </button>
              <button
                onClick={cancelConfirm}
                className="flex-1 bg-dark-100 text-gray-400 py-2 rounded-lg font-semibold hover:bg-dark-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
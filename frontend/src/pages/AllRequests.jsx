import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { FaClock, FaCheck, FaTimes, FaEye, FaList } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AllRequests = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState('pending');
  const [requestType, setRequestType] = useState('deposits');
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });
  const [paymentInfo, setPaymentInfo] = useState({
    senderName: '',
    referenceNumber: '',
  });

  const role = user?.role || 'player';

  useEffect(() => {
    fetchRequests();
  }, [activeTab, requestType]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const refresh = () => fetchRequests();
    socket.on('new-deposit-request', refresh);
    socket.on('new-withdrawal-request', refresh);
    socket.on('deposit-accepted', refresh);
    socket.on('deposit-rejected', refresh);
    socket.on('deposit-completed', refresh);
    socket.on('withdraw-accepted', refresh);
    socket.on('withdraw-rejected', refresh);
    socket.on('withdraw-completed', refresh);

    return () => {
      socket.off('new-deposit-request', refresh);
      socket.off('new-withdrawal-request', refresh);
      socket.off('deposit-accepted', refresh);
      socket.off('deposit-rejected', refresh);
      socket.off('deposit-completed', refresh);
      socket.off('withdraw-accepted', refresh);
      socket.off('withdraw-rejected', refresh);
      socket.off('withdraw-completed', refresh);
    };
  }, [socket]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      if (role === 'player') {
        endpoint = requestType === 'deposits' ? '/player/deposits' : '/player/withdrawals';
      } else {
        endpoint = requestType === 'deposits' ? '/agent/deposits' : '/agent/withdrawals';
      }
      const response = await api.get(endpoint);
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRequests = () => {
    if (activeTab === 'pending') {
      return requests.filter(r => r.status === 'PENDING' || r.status === 'PROCESSING');
    }
    if (activeTab === 'accepted') {
      return requests.filter(r => r.status === 'PROCESSING' || r.status === 'PAYMENT_SENT');
    }
    if (activeTab === 'history') {
      return requests.filter(r => r.status === 'COMPLETED' || r.status === 'REJECTED');
    }
    return requests;
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

  const canAccept = (req) => {
    if (req.status !== 'PENDING') return false;
    if (role === 'admin' && req.playerType === 'superagent') return true;
    if (role === 'superagent' && req.playerType === 'agent') return true;
    if (role === 'agent' && req.playerType === 'player') return true;
    return false;
  };

  const canSendBankInfo = (req) => {
    return req.status === 'PROCESSING' && req.handlerId === user?._id;
  };

  const canComplete = (req) => {
    return req.status === 'PAYMENT_SENT' && req.handlerId === user?._id;
  };

  const canSubmitPayment = (req) => {
    return req.status === 'PROCESSING' && req.playerId === user?._id;
  };

  const handleAccept = async (requestId) => {
    try {
      const endpoint = requestType === 'deposits' ? `/requests/${requestId}/accept` : `/withdraw/${requestId}/accept`;
      await api.post(endpoint);
      toast.success('✅ Request accepted!');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept');
    }
  };

  const handleSendBankInfo = async (requestId) => {
    if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
      toast.error('Please fill all bank details');
      return;
    }
    try {
      await api.post(`/requests/${requestId}/bank-info`, bankInfo);
      toast.success('✅ Bank info sent!');
      setShowModal(false);
      setBankInfo({ bankName: '', accountNumber: '', accountHolder: '' });
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send bank info');
    }
  };

  const handleSubmitPayment = async (requestId) => {
    if (!paymentInfo.senderName || !paymentInfo.referenceNumber) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await api.post(`/deposit/${requestId}/payment-info`, paymentInfo);
      toast.success('✅ Payment info submitted!');
      setShowModal(false);
      setPaymentInfo({ senderName: '', referenceNumber: '' });
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit payment');
    }
  };

  const handleComplete = async (requestId) => {
    if (!window.confirm('Confirm you have received the payment?')) return;
    try {
      await api.post(`/requests/${requestId}/complete`);
      toast.success('✅ Request completed!');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete');
    }
  };

  const filteredRequests = getFilteredRequests();
  const counts = {
    pending: requests.filter(r => r.status === 'PENDING' || r.status === 'PROCESSING').length,
    accepted: requests.filter(r => r.status === 'PROCESSING' || r.status === 'PAYMENT_SENT').length,
    history: requests.filter(r => r.status === 'COMPLETED' || r.status === 'REJECTED').length,
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <FaList /> {role.charAt(0).toUpperCase() + role.slice(1)} Requests
      </h1>

      <div className="flex border-b border-gold-500/20 mb-4">
        <button
          onClick={() => setRequestType('deposits')}
          className={`px-6 py-3 font-semibold transition ${
            requestType === 'deposits' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-gray-400 hover:text-white'
          }`}
        >
          💰 Deposits
        </button>
        <button
          onClick={() => setRequestType('withdrawals')}
          className={`px-6 py-3 font-semibold transition ${
            requestType === 'withdrawals' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-gray-400 hover:text-white'
          }`}
        >
          💳 Withdrawals
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          ⏳ Pending ({counts.pending})
        </button>
        <button
          onClick={() => setActiveTab('accepted')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'accepted' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          ✅ Accepted ({counts.accepted})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'history' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50' : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          📋 History ({counts.history})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-dark-200 rounded-xl">
          <p className="text-gray-400">No {activeTab} {requestType} found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div key={req._id} className="bg-dark-200 rounded-xl p-4 border border-gold-500/10 hover:border-gold-500/30 transition">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{req.amount} ETB</span>
                    {getStatusBadge(req.status)}
                    <span className="text-xs text-gray-500">{req.playerType || 'player'}</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">{new Date(req.requestedAt).toLocaleString()}</p>
                  {req.handlerId && (
                    <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-xs text-gray-400">Handled by: <span className="text-white">{req.handlerId?.username}</span></p>
                      {req.handlerBankInfo?.bankName && activeTab !== 'pending' && (
                        <div className="mt-1 p-1 bg-blue-500/10 rounded text-xs">
                          <p className="text-gray-400">Bank: <span className="text-white">{req.handlerBankInfo.bankName}</span></p>
                          <p className="text-gray-400">Account: <span className="text-white">{req.handlerBankInfo.accountNumber}</span></p>
                        </div>
                      )}
                      {req.requesterPaymentInfo?.senderName && (
                        <div className="mt-1 p-1 bg-purple-500/10 rounded text-xs">
                          <p className="text-gray-400">Sender: <span className="text-white">{req.requesterPaymentInfo.senderName}</span></p>
                          <p className="text-gray-400">Ref: <span className="text-white">{req.requesterPaymentInfo.referenceNumber}</span></p>
                        </div>
                      )}
                    </div>
                  )}
                  {req.rejectedReason && <p className="text-red-400 text-xs mt-1">Reason: {req.rejectedReason}</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {canAccept(req) && (
                    <button onClick={() => handleAccept(req._id)} className="bg-gold-500 text-dark-100 px-3 py-1 rounded text-sm font-semibold hover:bg-gold-400 transition">
                      Accept
                    </button>
                  )}
                  {canSendBankInfo(req) && (
                    <button onClick={() => { setSelectedRequest(req); setShowModal(true); }} className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-blue-400 transition">
                      Send Bank Info
                    </button>
                  )}
                  {canSubmitPayment(req) && (
                    <button onClick={() => { setSelectedRequest(req); setShowModal(true); }} className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-green-400 transition">
                      Submit Payment
                    </button>
                  )}
                  {canComplete(req) && (
                    <button onClick={() => handleComplete(req._id)} className="bg-purple-500 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-purple-400 transition">
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-2xl p-6 max-w-md w-full border border-gold-500/20">
            <h2 className="text-xl font-bold text-white mb-4">
              {canSendBankInfo(selectedRequest) ? '🏦 Send Bank Info' : '📝 Submit Payment'}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Amount: <span className="text-gold-500 font-bold">{selectedRequest.amount} ETB</span>
            </p>
            {canSendBankInfo(selectedRequest) ? (
              <div className="space-y-3">
                <input type="text" value={bankInfo.bankName} onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })} className="w-full bg-dark-100 text-white px-4 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none" placeholder="Bank Name" />
                <input type="text" value={bankInfo.accountNumber} onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })} className="w-full bg-dark-100 text-white px-4 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none" placeholder="Account Number" />
                <input type="text" value={bankInfo.accountHolder} onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })} className="w-full bg-dark-100 text-white px-4 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none" placeholder="Account Holder" />
                <button onClick={() => handleSendBankInfo(selectedRequest._id)} className="w-full bg-gold-500 text-dark-100 py-2 rounded-lg font-semibold hover:bg-gold-400 transition">Send to Player</button>
              </div>
            ) : (
              <div className="space-y-3">
                <input type="text" value={paymentInfo.senderName} onChange={(e) => setPaymentInfo({ ...paymentInfo, senderName: e.target.value })} className="w-full bg-dark-100 text-white px-4 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none" placeholder="Your Full Name" />
                <input type="text" value={paymentInfo.referenceNumber} onChange={(e) => setPaymentInfo({ ...paymentInfo, referenceNumber: e.target.value.toUpperCase() })} className="w-full bg-dark-100 text-white px-4 py-2 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none uppercase" placeholder="Reference Number" />
                <button onClick={() => handleSubmitPayment(selectedRequest._id)} className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-400 transition">Submit Payment</button>
              </div>
            )}
            <button onClick={() => { setShowModal(false); setSelectedRequest(null); }} className="w-full mt-2 bg-dark-100 text-gray-400 py-2 rounded-lg font-semibold hover:bg-dark-300 transition">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllRequests;
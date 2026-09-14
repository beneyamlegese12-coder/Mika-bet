import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { FaClock, FaUser, FaCopy, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PlayerDeposit = () => {
  const { user, updateUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const [amount, setAmount] = useState(100);
  const [step, setStep] = useState(1);
  const [requestId, setRequestId] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [handlerInfo, setHandlerInfo] = useState(null);
  const [senderName, setSenderName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);

  const quickAmounts = [50, 100, 200, 500, 1000];

  // Get the role display name
  const getRoleDisplay = () => {
    if (user?.role === 'player') return 'Agent';
    if (user?.role === 'agent') return 'SuperAgent';
    if (user?.role === 'superagent') return 'Admin';
    return 'Handler';
  };

  // Get the handler type for the request
  const getHandlerType = () => {
    if (user?.role === 'player') return 'agent';
    if (user?.role === 'agent') return 'superagent';
    if (user?.role === 'superagent') return 'admin';
    return null;
  };

  // Join user room on mount
  useEffect(() => {
    if (socket && isConnected && user?._id) {
      socket.emit('join-user', user._id);
    }
  }, [socket, isConnected, user]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleAccepted = (data) => {
      if (data.requestId === requestId) {
        setRequestStatus('PROCESSING');
        setHandlerInfo(data.agentInfo);
        toast.success(`🎯 ${data.agentInfo?.username || 'Handler'} accepted your request!`);
        setStep(3);
      }
    };

    const handleBankInfo = (data) => {
      console.log('🏦 Bank info received:', data);
      if (data.requestId === requestId) {
        setBankInfo(data.bankInfo);
        toast.success('📋 Bank details received!');
        setStep(4);
      }
    };

    const handleCompleted = (data) => {
      if (data.requestId === requestId) {
        toast.success(`🎉 ${amount} ETB deposited successfully!`);
        setStep(6);
        if (updateUser) {
          updateUser({ ...user, balance: data.newBalance });
        }
        setTimeout(() => window.location.reload(), 1500);
      }
    };

    socket.on('deposit-accepted', handleAccepted);
    socket.on('bank-info-sent', handleBankInfo);
    socket.on('deposit-completed', handleCompleted);

    return () => {
      socket.off('deposit-accepted', handleAccepted);
      socket.off('bank-info-sent', handleBankInfo);
      socket.off('deposit-completed', handleCompleted);
    };
  }, [socket, requestId, amount, user, updateUser]);

  // Poll for updates (fallback)
  useEffect(() => {
    if (!requestId || step !== 2) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get(`/deposit/request/${requestId}`);
        const data = response.data.data;
        console.log('🔄 Polling request:', data);

        // Check if bank info exists
        if (data.handlerBankInfo?.bankName && data.status === 'PROCESSING') {
          setBankInfo(data.handlerBankInfo);
          setHandlerInfo(data.handlerId);
          toast.success('📋 Bank details received!');
          setStep(4);
          clearInterval(pollInterval);
        } else if (data.status === 'COMPLETED') {
          toast.success(`🎉 ${amount} ETB deposited successfully!`);
          setStep(6);
          clearInterval(pollInterval);
        } else if (data.status === 'REJECTED') {
          toast.error('❌ Request was rejected');
          setStep(1);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [requestId, step, amount]);

  const handleRequestDeposit = async () => {
    if (amount < 10) {
      toast.error('Minimum deposit is 10 ETB');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/deposit/request', { amount });
      if (response.data.success) {
        setRequestId(response.data.data._id);
        setRequestStatus('PENDING');
        setStep(2);
        toast.success(`✅ Deposit request submitted to ${getRoleDisplay()}!`);
        if (socket && isConnected && user?._id) {
          socket.emit('join-user', user._id);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!senderName || !referenceNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!requestId) {
      toast.error('No active request found');
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Submitting payment for request:', requestId);
      console.log('📤 Sender:', senderName);
      console.log('📤 Reference:', referenceNumber);
      
      const response = await api.post(`/deposit/${requestId}/payment-info`, {
        senderName,
        referenceNumber,
      });
      
      console.log('📥 Payment response:', response.data);
      
      if (response.data.success) {
        toast.success('✅ Payment info submitted! Waiting for verification...');
        setStep(5);
      }
    } catch (error) {
      console.error('❌ Payment submission error:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to submit payment info');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNumber = (number) => {
    if (!number) return;
    navigator.clipboard.writeText(number);
    toast.success('Account number copied to clipboard!');
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              💰 Request Deposit ({getRoleDisplay()})
            </h2>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <FaClock /> Your request will be sent to {getRoleDisplay().toLowerCase()}
              </p>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
              {quickAmounts.map((qAmount) => (
                <button
                  key={qAmount}
                  onClick={() => setAmount(qAmount)}
                  className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${
                    amount === qAmount
                      ? 'bg-gold-500 text-dark-100'
                      : 'bg-dark-100 text-gray-400 hover:bg-dark-300 hover:text-white'
                  }`}
                >
                  {qAmount} ETB
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-gray-400 text-sm block mb-2">Amount (ETB)</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="10"
                  className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">ETB</span>
              </div>
            </div>

            <button
              onClick={handleRequestDeposit}
              disabled={loading || amount < 10}
              className="w-full bg-gold-500 text-dark-100 py-3 rounded-lg font-bold hover:bg-gold-400 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : `💰 Request from ${getRoleDisplay()}`}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
            <p className="text-white text-lg font-bold mt-4">⏳ Waiting for {getRoleDisplay()}...</p>
            <p className="text-gray-400 text-sm">Your request is being reviewed</p>
            <div className="mt-4">
              <p className="text-gray-500 text-sm">Amount: <span className="text-gold-500 font-bold">{amount} ETB</span></p>
              <p className="text-gray-500 text-sm">Status: <span className="text-yellow-400">Pending</span></p>
              <p className="text-gray-500 text-sm">Request ID: <span className="text-gray-400">{requestId?.slice(-8)}</span></p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-green-500 text-lg font-bold">{getRoleDisplay()} Accepted!</p>
            <p className="text-gray-400 text-sm">Handler: <span className="text-white font-medium">{handlerInfo?.username || 'Handler'}</span></p>
            <p className="text-gray-400 text-sm">Amount: <span className="text-gold-500 font-bold">{amount} ETB</span></p>
            <div className="mt-4 animate-pulse">
              <p className="text-gray-400 text-sm">⏳ Waiting for bank details...</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4 text-center">
              <p className="text-green-400 font-bold">✅ Bank details received!</p>
              <p className="text-gray-400 text-sm">Handler: <span className="text-white">{handlerInfo?.username}</span></p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
              <p className="text-blue-400 font-semibold mb-2">📤 Send <span className="text-gold-500">{amount} ETB</span> to:</p>
              <div className="space-y-1 bg-dark-100 p-3 rounded-lg">
                <p className="flex justify-between"><span className="text-gray-400">Bank</span><span className="text-white font-medium">{bankInfo?.bankName || 'Not provided'}</span></p>
                <p className="flex justify-between"><span className="text-gray-400">Account</span><span className="text-white font-medium">{bankInfo?.accountNumber || 'Not provided'}</span></p>
                <p className="flex justify-between"><span className="text-gray-400">Holder</span><span className="text-white font-medium">{bankInfo?.accountHolder || 'Not provided'}</span></p>
              </div>
              <button
                onClick={() => handleCopyNumber(bankInfo?.accountNumber)}
                className="mt-2 text-gold-500 hover:text-gold-400 text-sm flex items-center gap-1"
              >
                <FaCopy /> Copy Account Number
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Your Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-dark-100 text-white pl-10 pr-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                    placeholder="Your full name"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Reference Number *</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                  className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none uppercase"
                  placeholder="e.g., CKU3JPX6M3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the receipt number from your payment confirmation
                </p>
              </div>
            </div>

            <button
              onClick={handleSubmitPayment}
              disabled={loading || !senderName || !referenceNumber || !requestId}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-400 transition disabled:opacity-50 mt-4"
            >
              {loading ? 'Submitting...' : '✅ I Sent the Money'}
            </button>
          </div>
        );

      case 5:
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
            <p className="text-white text-lg font-bold mt-4">⏳ Awaiting Verification</p>
            <p className="text-gray-400 text-sm">{getRoleDisplay()} is verifying your payment...</p>
            <div className="mt-4">
              <p className="text-gray-500 text-sm">Amount: <span className="text-gold-500 font-bold">{amount} ETB</span></p>
              <p className="text-gray-500 text-sm">Reference: <span className="text-gray-400">{referenceNumber}</span></p>
              <p className="text-gray-500 text-sm">Handler: <span className="text-gray-400">{handlerInfo?.username}</span></p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-green-500 text-2xl font-bold">{amount} ETB Deposited!</p>
            <p className="text-gray-400 mt-2">Your balance has been updated.</p>
            <p className="text-gold-500 font-bold text-3xl mt-4">{user?.balance?.toLocaleString()} ETB</p>
            <p className="text-gray-400 text-sm mt-2">
              Processed by: <span className="text-gold-500">{handlerInfo?.username || 'Handler'}</span>
            </p>
            <button
              onClick={() => { setStep(1); setAmount(100); setSenderName(''); setReferenceNumber(''); setBankInfo(null); setHandlerInfo(null); }}
              className="mt-6 bg-gold-500 text-dark-100 px-6 py-2 rounded-lg font-bold hover:bg-gold-400 transition"
            >
              Make Another Deposit
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">💰 Deposit</h1>

      <div className="bg-dark-200 rounded-2xl p-6 border border-gold-500/20">
        {renderStep()}
      </div>

      <div className="mt-4 bg-dark-200 rounded-xl p-4 border border-gold-500/20">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Current Balance</span>
          <span className="text-gold-500 font-bold text-xl">{user?.balance?.toLocaleString()} ETB</span>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        {isConnected ? '🟢 Connected' : '🔴 Reconnecting...'}
      </div>
    </div>
  );
};

export default PlayerDeposit;
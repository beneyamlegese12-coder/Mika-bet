import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { FaClock, FaUser, FaUniversity, FaArrowLeft, FaCopy, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PlayerWithdraw = () => {
  const { user, updateUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const [amount, setAmount] = useState(100);
  const [step, setStep] = useState(1);
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [handlerInfo, setHandlerInfo] = useState(null);
  const [handlerPaymentInfo, setHandlerPaymentInfo] = useState(null);
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  const quickAmounts = [50, 100, 200, 500, 1000];
  const minAmount = 50;

  const getRoleDisplay = () => {
    if (user?.role === 'player') return 'Agent';
    if (user?.role === 'agent') return 'SuperAgent';
    if (user?.role === 'superagent') return 'Admin';
    return 'Handler';
  };

  useEffect(() => {
    if (socket && isConnected && user?._id) {
      socket.emit('join-user', user._id);
    }
  }, [socket, isConnected, user]);

  useEffect(() => {
    if (!socket) return;

    const handleAccepted = (data) => {
      console.log('📩 Withdrawal accepted:', data);
      if (data.requestId === requestId) {
        setRequestStatus('PROCESSING');
        setHandlerInfo(data.handlerInfo);
        toast.success(`🎯 ${data.handlerInfo?.username || 'Handler'} accepted your withdrawal!`);
        setStep(3);
      }
    };

    const handlePaymentSent = (data) => {
      console.log('📩 Payment info received:', data);
      if (data.requestId === requestId) {
        setHandlerPaymentInfo(data.paymentInfo);
        toast.success('📋 Payment info received from handler!');
        setStep(4);
      }
    };

    const handleCompleted = (data) => {
      console.log('✅ Withdrawal completed:', data);
      if (data.requestId === requestId) {
        toast.success(`✅ Withdrawal completed!`);
        setStep(5);
        if (updateUser) {
          updateUser({ ...user, balance: data.newBalance });
        }
        setTimeout(() => window.location.reload(), 1500);
      }
    };

    socket.on('withdraw-accepted', handleAccepted);
    socket.on('withdraw-payment-sent', handlePaymentSent);
    socket.on('withdraw-completed', handleCompleted);

    return () => {
      socket.off('withdraw-accepted', handleAccepted);
      socket.off('withdraw-payment-sent', handlePaymentSent);
      socket.off('withdraw-completed', handleCompleted);
    };
  }, [socket, requestId, user, updateUser]);

  useEffect(() => {
    if (!requestId || step !== 2) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get(`/withdraw/request/${requestId}`);
        const data = response.data.data;
        console.log('🔄 Polling withdrawal:', data);

        if (data.status === 'PROCESSING') {
          setHandlerInfo(data.handlerId);
          toast.info('📋 Withdrawal is being processed');
          setStep(3);
          clearInterval(pollInterval);
        } else if (data.status === 'PAYMENT_SENT') {
          setHandlerPaymentInfo(data.handlerPaymentInfo);
          toast.success('📋 Payment info received!');
          setStep(4);
          clearInterval(pollInterval);
        } else if (data.status === 'COMPLETED') {
          toast.success(`✅ Withdrawal completed!`);
          setStep(5);
          clearInterval(pollInterval);
        } else if (data.status === 'REJECTED') {
          toast.error(`❌ Withdrawal rejected: ${data.rejectedReason || 'No reason provided'}`);
          setStep(1);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [requestId, step]);

  const handleRequestWithdraw = async () => {
    if (amount < minAmount) {
      toast.error(`Minimum withdrawal is ${minAmount} ETB`);
      return;
    }

    if (amount > user?.balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!bankInfo.bankName) {
      toast.error('Please select a bank');
      return;
    }
    if (!bankInfo.accountHolder) {
      toast.error('Please enter account holder name');
      return;
    }
    if (!bankInfo.accountNumber) {
      toast.error('Please enter account number');
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Submitting withdrawal request:', { amount, bankInfo });
      const response = await api.post('/withdraw/request', {
        amount,
        bankInfo,
      });
      console.log('📥 Withdrawal response:', response.data);
      
      if (response.data.success) {
        const newRequestId = response.data.data._id;
        console.log('✅ Request ID received:', newRequestId);
        setRequestId(newRequestId);
        setRequestStatus('PENDING');
        setStep(2);
        toast.success(`✅ Withdrawal request submitted to ${getRoleDisplay()}!`);
        
        if (socket && isConnected && user?._id) {
          socket.emit('join-user', user._id);
        }
      }
    } catch (error) {
      console.error('❌ Withdrawal request error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWithdrawal = async () => {
    if (!window.confirm('Confirm you have received the money from the handler?')) return;

    setLoading(true);
    try {
      console.log('📤 Completing withdrawal for request:', requestId);
      const response = await api.post(`/withdraw/${requestId}/complete`);
      console.log('📥 Complete response:', response.data);
      
      if (response.data.success) {
        toast.success('✅ Withdrawal completed successfully!');
        setStep(5);
        if (updateUser) {
          updateUser({ ...user, balance: response.data.data.requesterBalance });
        }
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error('❌ Complete error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel this withdrawal request?')) return;

    try {
      await api.delete(`/withdraw/request/${requestId}`);
      toast.info('Withdrawal request cancelled');
      setStep(1);
      setRequestId(null);
      setRequestStatus(null);
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel request');
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              💳 Request Withdrawal ({getRoleDisplay()})
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
                  min={minAmount}
                  max={user?.balance || 0}
                  className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">ETB</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Min: {minAmount} ETB</span>
                <span>Max: {user?.balance || 0} ETB</span>
                <span>Balance: {user?.balance?.toLocaleString()} ETB</span>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
              <p className="text-blue-400 font-semibold mb-3">🏦 Your Bank Details (To Receive Money)</p>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Bank Name *</label>
                  <select
                    value={bankInfo.bankName}
                    onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                    className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                  >
                    <option value="">Select Bank</option>
                    <option value="Commercial Bank of Ethiopia">Commercial Bank of Ethiopia</option>
                    <option value="Awash Bank">Awash Bank</option>
                    <option value="Dashen Bank">Dashen Bank</option>
                    <option value="Abyssinia Bank">Abyssinia Bank</option>
                    <option value="Wegagen Bank">Wegagen Bank</option>
                    <option value="Zemen Bank">Zemen Bank</option>
                    <option value="Oromia Bank">Oromia Bank</option>
                    <option value="United Bank">United Bank</option>
                    <option value="Nib Bank">Nib Bank</option>
                    <option value="Cooperative Bank">Cooperative Bank</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 text-sm block mb-1">Account Holder Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={bankInfo.accountHolder}
                      onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                      className="w-full bg-dark-100 text-white pl-10 pr-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                      placeholder="Full name as on bank account"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm block mb-1">Account Number *</label>
                  <input
                    type="text"
                    value={bankInfo.accountNumber}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                    className="w-full bg-dark-100 text-white px-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none"
                    placeholder="Bank account number"
                  />
                </div>
              </div>
            </div>

            {amount > user?.balance && (
              <p className="text-red-500 text-sm mt-2">Amount exceeds available balance</p>
            )}

            <button
              onClick={handleRequestWithdraw}
              disabled={loading || amount > user?.balance || amount < minAmount}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-400 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : `💳 Request from ${getRoleDisplay()}`}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
            <p className="text-white text-lg font-bold mt-4">⏳ Waiting for {getRoleDisplay()}...</p>
            <p className="text-gray-400 text-sm">Your withdrawal request is being reviewed</p>
            <div className="mt-4 space-y-2">
              <p className="text-gray-500 text-sm">Amount: <span className="text-gold-500 font-bold">{amount} ETB</span></p>
              <p className="text-gray-500 text-sm">Status: <span className="text-yellow-400">Pending</span></p>
              <p className="text-gray-500 text-sm">Request ID: <span className="text-gray-400">{requestId?.slice(-8) || 'N/A'}</span></p>
            </div>
            <button
              onClick={handleCancelRequest}
              className="mt-6 text-red-400 hover:text-red-300 transition text-sm flex items-center gap-2 mx-auto"
            >
              <FaArrowLeft /> Cancel Request
            </button>
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
              <p className="text-gray-400 text-sm">⏳ Waiting for payment from handler...</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4 text-center">
              <p className="text-green-400 font-bold">✅ Payment info received!</p>
              <p className="text-gray-400 text-sm">Handler: <span className="text-white">{handlerInfo?.username}</span></p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
              <p className="text-blue-400 font-semibold mb-2">📤 Payment Details:</p>
              <div className="space-y-1 bg-dark-100 p-3 rounded-lg">
                <p className="flex justify-between"><span className="text-gray-400">Sender</span><span className="text-white font-medium">{handlerPaymentInfo?.senderName || 'Not provided'}</span></p>
                <p className="flex justify-between"><span className="text-gray-400">Reference</span><span className="text-white font-medium">{handlerPaymentInfo?.referenceNumber || 'Not provided'}</span></p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <FaClock /> Confirm you have received the money to your bank account
              </p>
            </div>

            <button
              onClick={handleCompleteWithdrawal}
              disabled={loading}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-400 transition disabled:opacity-50 mt-4"
            >
              {loading ? 'Confirming...' : '✅ I Received the Money'}
            </button>
          </div>
        );

      case 5:
        return (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-green-500 text-2xl font-bold">Withdrawal Complete!</p>
            <p className="text-gray-400 mt-2">Your balance has been updated.</p>
            <p className="text-gold-500 font-bold text-3xl mt-4">{user?.balance?.toLocaleString()} ETB</p>
            <p className="text-gray-400 text-sm mt-2">
              Processed by: <span className="text-gold-500">{handlerInfo?.username || 'Handler'}</span>
            </p>
            <button
              onClick={() => { setStep(1); setAmount(100); setBankInfo({ bankName: '', accountNumber: '', accountHolder: '' }); setRequestId(null); }}
              className="mt-6 bg-gold-500 text-dark-100 px-6 py-2 rounded-lg font-bold hover:bg-gold-400 transition"
            >
              Make Another Withdrawal
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">💳 Withdraw</h1>

      <div className="bg-dark-200 rounded-2xl p-6 border border-gold-500/20">
        {renderStep()}
      </div>

      <div className="mt-4 bg-dark-200 rounded-xl p-4 border border-gold-500/20">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Available Balance</span>
          <span className="text-gold-500 font-bold text-xl">{user?.balance?.toLocaleString()} ETB</span>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        {isConnected ? '🟢 Connected' : '🔴 Reconnecting...'}
      </div>
    </div>
  );
};

export default PlayerWithdraw;
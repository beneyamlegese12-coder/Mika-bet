import React, { useState, useEffect } from 'react';
import { FaCheck, FaClock, FaTimes, FaInfo } from 'react-icons/fa';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const SimpleNotification = () => {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleEvent = (data, type, msg) => {
      addNotification(type, msg);
      if (type === 'success') toast.success(msg);
      else if (type === 'error') toast.error(msg);
      else toast.info(msg);
    };

    socket.on('deposit-accepted', (data) => {
      handleEvent(data, 'success', `🎯 Agent ${data.agentInfo?.username} accepted!`);
    });

    socket.on('bank-info-sent', () => {
      handleEvent(null, 'info', '📋 Bank details received!');
    });

    socket.on('payment-submitted', (data) => {
      handleEvent(null, 'info', `📩 Payment from ${data.paymentInfo?.senderName}`);
    });

    socket.on('deposit-completed', () => {
      handleEvent(null, 'success', '✅ Deposit completed!');
    });

    socket.on('deposit-rejected', (data) => {
      handleEvent(null, 'error', `❌ Rejected: ${data.reason}`);
    });

    socket.on('new-deposit-request', (data) => {
      handleEvent(null, 'info', `💰 New request: ${data.amount} ETB`);
    });

    return () => {
      socket.off('deposit-accepted');
      socket.off('bank-info-sent');
      socket.off('payment-submitted');
      socket.off('deposit-completed');
      socket.off('deposit-rejected');
      socket.off('new-deposit-request');
    };
  }, [socket]);

  const addNotification = (type, message) => {
    setNotifications(prev => [
      { id: Date.now(), type, message, timestamp: new Date() },
      ...prev
    ].slice(0, 10));
  };

  const clearNotifications = () => setNotifications([]);

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <FaCheck className="text-green-400" />;
      case 'error': return <FaTimes className="text-red-400" />;
      default: return <FaInfo className="text-blue-400" />;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-dark-200 rounded-xl border border-gold-500/20 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-3 border-b border-gold-500/10">
          <span className="text-white font-semibold text-sm">🔔 Updates</span>
          <button
            onClick={clearNotifications}
            className="text-gray-400 hover:text-white text-xs transition"
          >
            Clear all
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-2 p-3 border-b border-gold-500/5 ${
                notif.type === 'success' ? 'border-l-2 border-l-green-500' :
                notif.type === 'error' ? 'border-l-2 border-l-red-500' :
                'border-l-2 border-l-blue-500'
              }`}
            >
              <div className="mt-0.5">{getIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{notif.message}</p>
                <p className="text-gray-500 text-xs">
                  {new Date(notif.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 text-center border-t border-gold-500/10">
          <span className={`text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Reconnecting...'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimpleNotification;
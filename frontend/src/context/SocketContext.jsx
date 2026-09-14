import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.log('🔌 WebSocket error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinMatch = (matchId) => {
    if (socket && isConnected) {
      socket.emit('join-match', matchId);
    }
  };

  const leaveMatch = (matchId) => {
    if (socket && isConnected) {
      socket.emit('leave-match', matchId);
    }
  };

  const joinUser = (userId) => {
    if (socket && isConnected) {
      socket.emit('join-user', userId);
    }
  };

  // Deposit Events
  const onDepositAccepted = (callback) => {
    if (socket) {
      socket.on('deposit-accepted', callback);
      return () => socket.off('deposit-accepted', callback);
    }
    return null;
  };

  const onBankInfoSent = (callback) => {
    if (socket) {
      socket.on('bank-info-sent', callback);
      return () => socket.off('bank-info-sent', callback);
    }
    return null;
  };

  const onDepositCompleted = (callback) => {
    if (socket) {
      socket.on('deposit-completed', callback);
      return () => socket.off('deposit-completed', callback);
    }
    return null;
  };

  // Withdrawal Events
  const onWithdrawAccepted = (callback) => {
    if (socket) {
      socket.on('withdraw-accepted', callback);
      return () => socket.off('withdraw-accepted', callback);
    }
    return null;
  };

  const onWithdrawCompleted = (callback) => {
    if (socket) {
      socket.on('withdraw-completed', callback);
      return () => socket.off('withdraw-completed', callback);
    }
    return null;
  };

  // Match Events
  const onMatchUpdate = (callback) => {
    if (socket) {
      socket.on('match-updated', callback);
      return () => socket.off('match-updated', callback);
    }
    return null;
  };

  const onBetPlaced = (callback) => {
    if (socket) {
      socket.on('bet-placed', callback);
      return () => socket.off('bet-placed', callback);
    }
    return null;
  };

  const onBalanceUpdate = (callback) => {
    if (socket) {
      socket.on('balance-updated', callback);
      return () => socket.off('balance-updated', callback);
    }
    return null;
  };

  const value = {
    socket,
    isConnected,
    joinMatch,
    leaveMatch,
    joinUser,
    onDepositAccepted,
    onBankInfoSent,
    onDepositCompleted,
    onWithdrawAccepted,
    onWithdrawCompleted,
    onMatchUpdate,
    onBetPlaced,
    onBalanceUpdate,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
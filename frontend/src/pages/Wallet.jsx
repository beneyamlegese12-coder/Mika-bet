import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaWallet, FaArrowUp, FaArrowDown, FaHistory } from 'react-icons/fa';

const Wallet = () => {
  const { user, updateUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'DEPOSIT':
        return <FaArrowDown className="text-green-500" />;
      case 'WITHDRAW':
        return <FaArrowUp className="text-red-500" />;
      case 'BET':
        return <FaArrowUp className="text-red-500" />;
      case 'WINNING':
        return <FaArrowDown className="text-green-500" />;
      case 'BONUS':
        return <FaArrowDown className="text-gold-500" />;
      default:
        return <FaHistory className="text-gray-400" />;
    }
  };

  const getTransactionColor = (amount) => {
    if (amount > 0) return 'text-green-500';
    if (amount < 0) return 'text-red-500';
    return 'text-gray-400';
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">💳 Wallet</h1>
      
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-gold-500/20 to-dark-200 rounded-2xl p-6 border border-gold-500/20 mb-6">
        <p className="text-gray-400 text-sm">Available Balance</p>
        <p className="text-4xl font-bold text-gold-500">{user?.balance?.toLocaleString()} ETB</p>
        <div className="flex gap-3 mt-4">
          <Link
            to="/deposit"
            className="bg-gold-500 text-dark-100 px-6 py-2 rounded-lg font-semibold hover:bg-gold-400 transition flex items-center gap-2"
          >
            <FaArrowDown /> Deposit
          </Link>
          <Link
            to="/withdraw"
            className="border border-red-500 text-red-500 px-6 py-2 rounded-lg font-semibold hover:bg-red-500 hover:text-white transition flex items-center gap-2"
          >
            <FaArrowUp /> Withdraw
          </Link>
        </div>
      </div>

      {/* Transaction History */}
      <h2 className="text-xl font-bold text-white mb-4 flex items-center">
        <FaHistory className="mr-2 text-gold-500" /> Transaction History
      </h2>
      
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 bg-dark-200 rounded-xl">
          <p className="text-gray-400">No transactions yet</p>
          <p className="text-gray-500 text-sm mt-1">Start by making a deposit!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.slice(0, 20).map((tx) => (
            <div key={tx._id} className="bg-dark-200 p-4 rounded-lg border border-gold-500/10 flex justify-between items-center hover:border-gold-500/30 transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-dark-100 flex items-center justify-center">
                  {getTransactionIcon(tx.type)}
                </div>
                <div>
                  <p className="text-white font-semibold">{tx.type}</p>
                  <p className="text-gray-400 text-xs">{formatDate(tx.createdAt)}</p>
                  {tx.description && (
                    <p className="text-gray-500 text-xs">{tx.description}</p>
                  )}
                </div>
              </div>
              <div className={`font-bold ${getTransactionColor(tx.amount)}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} ETB
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wallet;
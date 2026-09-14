import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaHome, FaUser, FaWallet, FaHistory,
  FaShieldAlt, 
  FaTrophy, 
  FaUsers, 
  FaHandshake, 
  FaChartLine, 
  FaUserPlus,
  FaSignOutAlt,
  FaUserTie
} from 'react-icons/fa';

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: <FaHome />, label: 'Home' },
    { path: '/profile', icon: <FaUser />, label: 'Profile' },
    { path: '/wallet', icon: <FaWallet />, label: 'Wallet' },
    { path: '/history', icon: <FaHistory />, label: 'Bet History' },
    { path: '/admin/dashboard', icon: <FaShieldAlt />, label: 'Dashboard' },
    { path: '/admin/matches', icon: <FaTrophy />, label: 'Manage Matches' },
    { path: '/admin/users', icon: <FaUsers />, label: 'Manage Users' },
    { path: '/admin/agents', icon: <FaUserPlus />, label: 'Create Agents' },
    { path: '/admin/settle-bets', icon: <FaHandshake />, label: 'Settle Bets' },
    { path: '/admin/analytics', icon: <FaChartLine />, label: 'Analytics' },
  ];

  return (
    <div className="w-64 bg-dark-200 border-r border-gold-500/20 h-screen flex flex-col">
      {/* User Info - Fixed Top */}
      <div className="flex-shrink-0 p-4 border-b border-gold-500/20">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-dark-100 font-bold text-lg">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{user?.username}</p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <div className="mt-2 text-gold-500 font-bold text-sm">
          {user?.balance?.toLocaleString()} ETB
        </div>
      </div>

      {/* SCROLLABLE MENU - This is the important part */}
      <div className="flex-1 overflow-y-auto py-2 px-3">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition ${
                isActive(item.path)
                  ? 'bg-gold-500/20 text-gold-500'
                  : 'text-gray-400 hover:bg-dark-300 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Logout - Fixed Bottom */}
      <div className="flex-shrink-0 p-3 border-t border-gold-500/10">
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition w-full"
        >
          <FaSignOutAlt className="text-lg" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
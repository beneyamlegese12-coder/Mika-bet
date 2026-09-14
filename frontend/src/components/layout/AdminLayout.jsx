import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaHome, FaUser, FaWallet, FaHistory, 
  FaShieldAlt, FaTrophy, FaUsers, FaHandshake, 
  FaChartLine, FaUserPlus, FaUserTie,
  FaSignOutAlt
} from 'react-icons/fa';

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/admin/dashboard', icon: <FaShieldAlt />, label: 'Dashboard' },
    { path: '/admin/matches', icon: <FaTrophy />, label: 'Manage Matches' },
    { path: '/admin/users', icon: <FaUsers />, label: 'Manage Users' },
    { path: '/admin/agents', icon: <FaUserPlus />, label: 'Create Agents' },
    { path: '/admin/settle-bets', icon: <FaHandshake />, label: 'Settle Bets' },
    { path: '/admin/analytics', icon: <FaChartLine />, label: 'Analytics' },
  ];

  return (
    <div className="w-64 bg-dark-200 border-r border-gold-500/20 min-h-screen flex-shrink-0">
      <div className="p-4 border-b border-gold-500/20">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-dark-100 font-bold">
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

      {/* Scrollable Menu */}
      <div className="h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                isActive(item.path)
                  ? 'bg-gold-500/20 text-gold-500'
                  : 'text-gray-400 hover:bg-dark-300 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout at bottom */}
        <div className="p-3 border-t border-gold-500/10 mt-4">
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition w-full"
          >
            <FaSignOutAlt />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
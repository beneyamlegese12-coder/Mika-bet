import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaUser, 
  FaCog, 
  FaSignOutAlt, 
  FaWallet, 
  FaHome, 
  FaHistory,
  FaTrophy,
  FaGamepad,
  FaShieldAlt,
  FaUserTie,
  FaPlusCircle,
  FaChartLine,
  FaHandshake,
  FaList,
  FaArrowUp,
  FaArrowDown,
  FaCrown
} from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-red-500/20 text-red-500';
      case 'superagent': return 'bg-purple-500/20 text-purple-500';
      case 'agent': return 'bg-blue-500/20 text-blue-500';
      default: return 'bg-green-500/20 text-green-500';
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return '🛡️';
      case 'superagent': return '⭐';
      case 'agent': return '👔';
      default: return '🎮';
    }
  };

  const navItems = [
    { name: 'HOME', path: '/' },
    { name: 'SPORT', path: '/sport' },
    { name: 'LIVE', path: '/live' },
    { name: 'GAMES', path: '/games' },
    { name: 'AVIATOR', path: '/aviator' },
  ];

  return (
    <header className="bg-dark-100 border-b border-gold-500/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              <span className="text-white">MIKA</span>
              <span className="text-gold-500">-BET</span>
            </div>
            <span className="text-xs bg-gold-500 text-dark-100 px-2 py-0.5 rounded">
              BET
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-gold-500 hover:bg-dark-200 rounded transition-all duration-300"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Side - User Info */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Balance */}
                <div className="hidden md:flex items-center bg-dark-200 px-4 py-2 rounded-lg">
                  <FaWallet className="text-gold-500 mr-2" />
                  <span className="text-white font-bold">
                    {user.balance?.toLocaleString() || 0} ETB
                  </span>
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 bg-dark-200 px-3 py-2 rounded-lg hover:bg-dark-300 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-dark-100 font-bold">
                      {user.firstName?.[0] || user.username?.[0] || 'U'}
                    </div>
                    <span className="text-white text-sm hidden md:block">
                      {user.username || user.email}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)} {user.role || 'player'}
                    </span>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-dark-200 rounded-lg shadow-xl border border-gold-500/20 overflow-hidden">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gold-500/10">
                        <p className="text-white font-semibold">{user.username}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                        <div className="flex items-center mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)} {user.role || 'player'}
                          </span>
                          <span className="ml-2 text-gold-500 font-bold">{user.balance?.toLocaleString()} ETB</span>
                        </div>
                      </div>
                      
                      {/* Navigation Links */}
                      <Link
                        to="/"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-dark-300 hover:text-white transition"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaHome className="mr-3" /> Home
                      </Link>
                      
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-dark-300 hover:text-white transition"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaUser className="mr-3" /> Profile
                      </Link>
                      
                      <Link
                        to="/wallet"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-dark-300 hover:text-white transition"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaWallet className="mr-3" /> Wallet
                      </Link>
                      
                      <Link
                        to="/deposit"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-dark-300 hover:text-white transition"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaArrowUp className="mr-3 text-green-500" /> Deposit
                      </Link>
                      
                      <Link
                        to="/withdraw"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-dark-300 hover:text-white transition"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaArrowDown className="mr-3 text-red-500" /> Withdraw
                      </Link>
                      
                      <Link
                        to="/history"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-dark-300 hover:text-white transition"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaHistory className="mr-3" /> Bet History
                      </Link>
                      
                      <Link
                        to="/requests"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-dark-300 hover:text-white transition"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaList className="mr-3" /> Requests
                      </Link>
                      
                      {/* Admin Links */}
                      {user.role === 'admin' && (
                        <>
                          <div className="border-t border-gold-500/10 px-4 py-1">
                            <p className="text-xs text-red-400 font-semibold">🔐 Admin</p>
                          </div>
                          <Link
                            to="/admin/dashboard"
                            className="flex items-center px-4 py-2 text-red-400 hover:bg-dark-300 hover:text-red-300 transition"
                            onClick={() => setShowDropdown(false)}
                          >
                            <FaShieldAlt className="mr-3" /> Dashboard
                          </Link>
                          <Link
                            to="/admin/matches"
                            className="flex items-center px-4 py-2 text-red-400 hover:bg-dark-300 hover:text-red-300 transition"
                            onClick={() => setShowDropdown(false)}
                          >
                            <FaTrophy className="mr-3" /> Manage Matches
                          </Link>
                          <Link
                            to="/admin/users"
                            className="flex items-center px-4 py-2 text-red-400 hover:bg-dark-300 hover:text-red-300 transition"
                            onClick={() => setShowDropdown(false)}
                          >
                            <FaUser className="mr-3" /> Manage Users
                          </Link>
                          <Link
                            to="/admin/agents"
                            className="flex items-center px-4 py-2 text-red-400 hover:bg-dark-300 hover:text-red-300 transition"
                            onClick={() => setShowDropdown(false)}
                          >
                            <FaPlusCircle className="mr-3" /> Create Agents
                          </Link>
                          <Link
                            to="/admin/settle-bets"
                            className="flex items-center px-4 py-2 text-red-400 hover:bg-dark-300 hover:text-red-300 transition"
                            onClick={() => setShowDropdown(false)}
                          >
                            <FaHandshake className="mr-3" /> Settle Bets
                          </Link>
                          <Link
                            to="/admin/analytics"
                            className="flex items-center px-4 py-2 text-red-400 hover:bg-dark-300 hover:text-red-300 transition"
                            onClick={() => setShowDropdown(false)}
                          >
                            <FaChartLine className="mr-3" /> Analytics
                          </Link>
                        </>
                      )}
                      
                      {/* Agent Links */}
                      {(user.role === 'agent' || user.role === 'superagent' || user.role === 'admin') && (
                        <>
                          <div className="border-t border-gold-500/10 px-4 py-1">
                            <p className="text-xs text-blue-400 font-semibold">👔 Agent</p>
                          </div>
                          <Link
                            to="/agent/dashboard"
                            className="flex items-center px-4 py-2 text-blue-400 hover:bg-dark-300 hover:text-blue-300 transition"
                            onClick={() => setShowDropdown(false)}
                          >
                            <FaUserTie className="mr-3" /> Dashboard
                          </Link>
                          <Link
                            to="/requests"
                            className="flex items-center px-4 py-2 text-blue-400 hover:bg-dark-300 hover:text-blue-300 transition"
                            onClick={() => setShowDropdown(false)}
                          >
                            <FaList className="mr-3" /> Requests
                          </Link>
                        </>
                      )}
                      
                      {/* Divider */}
                      <div className="border-t border-gold-500/10"></div>
                      
                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-red-400 hover:bg-dark-300 hover:text-red-300 transition"
                      >
                        <FaSignOutAlt className="mr-3" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-gray-300 hover:text-gold-500 transition">
                  PLAYER
                </Link>
                <Link to="/admin/login" className="px-4 py-2 text-red-400 hover:text-red-300 transition">
                  ADMIN
                </Link>
                <Link to="/agent/login" className="px-4 py-2 text-blue-400 hover:text-blue-300 transition">
                  AGENT
                </Link>
                <Link to="/register" className="px-4 py-2 bg-gold-500 text-dark-100 rounded-lg font-semibold hover:bg-gold-400 transition">
                  REGISTER
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white hover:text-gold-500 transition"
            >
              <GiHamburgerMenu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gold-500/10">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="px-4 py-2 text-gray-300 hover:text-gold-500 hover:bg-dark-200 rounded transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {user && (
                <>
                  <div className="border-t border-gold-500/10 my-2"></div>
                  
                  <Link
                    to="/profile"
                    className="px-4 py-2 text-gray-300 hover:text-gold-500 hover:bg-dark-200 rounded transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaUser className="inline mr-2" /> Profile
                  </Link>
                  
                  <Link
                    to="/wallet"
                    className="px-4 py-2 text-gray-300 hover:text-gold-500 hover:bg-dark-200 rounded transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaWallet className="inline mr-2" /> Wallet
                  </Link>
                  
                  <Link
                    to="/deposit"
                    className="px-4 py-2 text-gray-300 hover:text-gold-500 hover:bg-dark-200 rounded transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaArrowUp className="inline mr-2" /> Deposit
                  </Link>
                  
                  <Link
                    to="/withdraw"
                    className="px-4 py-2 text-gray-300 hover:text-gold-500 hover:bg-dark-200 rounded transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaArrowDown className="inline mr-2" /> Withdraw
                  </Link>
                  
                  <Link
                    to="/history"
                    className="px-4 py-2 text-gray-300 hover:text-gold-500 hover:bg-dark-200 rounded transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaHistory className="inline mr-2" /> Bet History
                  </Link>
                  
                  <Link
                    to="/requests"
                    className="px-4 py-2 text-gray-300 hover:text-gold-500 hover:bg-dark-200 rounded transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaList className="inline mr-2" /> Requests
                  </Link>
                  
                  {user.role === 'admin' && (
                    <>
                      <div className="border-t border-gold-500/10 my-1"></div>
                      <p className="px-4 py-1 text-xs text-red-400 font-semibold">🔐 Admin</p>
                      <Link
                        to="/admin/dashboard"
                        className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-dark-200 rounded transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FaShieldAlt className="inline mr-2" /> Dashboard
                      </Link>
                      <Link
                        to="/admin/matches"
                        className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-dark-200 rounded transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FaTrophy className="inline mr-2" /> Manage Matches
                      </Link>
                      <Link
                        to="/admin/users"
                        className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-dark-200 rounded transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FaUser className="inline mr-2" /> Manage Users
                      </Link>
                      <Link
                        to="/admin/agents"
                        className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-dark-200 rounded transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FaPlusCircle className="inline mr-2" /> Create Agents
                      </Link>
                      <Link
                        to="/admin/settle-bets"
                        className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-dark-200 rounded transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FaHandshake className="inline mr-2" /> Settle Bets
                      </Link>
                      <Link
                        to="/admin/analytics"
                        className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-dark-200 rounded transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FaChartLine className="inline mr-2" /> Analytics
                      </Link>
                    </>
                  )}
                  
                  {(user.role === 'agent' || user.role === 'superagent' || user.role === 'admin') && (
                    <>
                      <div className="border-t border-gold-500/10 my-1"></div>
                      <p className="px-4 py-1 text-xs text-blue-400 font-semibold">👔 Agent</p>
                      <Link
                        to="/agent/dashboard"
                        className="px-4 py-2 text-blue-400 hover:text-blue-300 hover:bg-dark-200 rounded transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FaUserTie className="inline mr-2" /> Dashboard
                      </Link>
                    </>
                  )}
                  
                  <div className="border-t border-gold-500/10 my-1"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-dark-200 rounded transition text-left"
                  >
                    <FaSignOutAlt className="inline mr-2" /> Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
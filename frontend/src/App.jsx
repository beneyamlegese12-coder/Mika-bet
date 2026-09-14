import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BetProvider } from './context/BetContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import SimpleNotification from './components/SimpleNotification';

// Public Pages
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AgentLogin from './pages/AgentLogin';
import Register from './pages/Register';

// Player Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import BetHistory from './pages/BetHistory';
import PlayerDeposit from './pages/PlayerDeposit';
import PlayerWithdraw from './pages/PlayerWithdraw';
import AllRequests from './pages/AllRequests';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminMatches from './pages/AdminMatches';
import AdminUsers from './pages/AdminUsers';
import AdminSettleBets from './pages/AdminSettleBets';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminCreateAgents from './pages/AdminCreateAgents';

// Agent Pages
import AgentDashboard from './pages/AgentDashboard';

// Games Pages
import Games from './pages/Games';
import Aviator from './pages/Aviator';

import './index.css';

const RoleRedirect = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BetProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1a1a2e',
                  color: '#fff',
                  border: '1px solid #ffd700',
                  borderRadius: '12px',
                },
                success: { icon: '✅', style: { border: '1px solid #22c55e' } },
                error: { icon: '❌', style: { border: '1px solid #ef4444' } },
              }}
            />
            
            <Routes>
              {/* ===== PUBLIC ROUTES ===== */}
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/agent/login" element={<AgentLogin />} />
              <Route path="/register" element={<Register />} />
              
              {/* ===== PLAYER ROUTES ===== */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Home />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/wallet"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Wallet />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BetHistory />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/deposit"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PlayerDeposit />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/withdraw"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PlayerWithdraw />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/requests"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AllRequests />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* ===== GAMES ROUTES ===== */}
              <Route
                path="/games"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Games />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/aviator"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Aviator />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* ===== ADMIN ROUTES ===== */}
              <Route
                path="/admin/dashboard"
                element={
                  <RoleRedirect allowedRoles={['admin']}>
                    <Layout>
                      <AdminDashboard />
                    </Layout>
                  </RoleRedirect>
                }
              />
              
              <Route
                path="/admin/matches"
                element={
                  <RoleRedirect allowedRoles={['admin']}>
                    <Layout>
                      <AdminMatches />
                    </Layout>
                  </RoleRedirect>
                }
              />
              
              <Route
                path="/admin/users"
                element={
                  <RoleRedirect allowedRoles={['admin']}>
                    <Layout>
                      <AdminUsers />
                    </Layout>
                  </RoleRedirect>
                }
              />
              
              <Route
                path="/admin/settle-bets"
                element={
                  <RoleRedirect allowedRoles={['admin']}>
                    <Layout>
                      <AdminSettleBets />
                    </Layout>
                  </RoleRedirect>
                }
              />
              
              <Route
                path="/admin/analytics"
                element={
                  <RoleRedirect allowedRoles={['admin']}>
                    <Layout>
                      <AdminAnalytics />
                    </Layout>
                  </RoleRedirect>
                }
              />
              
              <Route
                path="/admin/agents"
                element={
                  <RoleRedirect allowedRoles={['admin']}>
                    <Layout>
                      <AdminCreateAgents />
                    </Layout>
                  </RoleRedirect>
                }
              />
              
              {/* ===== AGENT ROUTES ===== */}
              <Route
                path="/agent/dashboard"
                element={
                  <RoleRedirect allowedRoles={['agent', 'superagent', 'admin']}>
                    <Layout>
                      <AgentDashboard />
                    </Layout>
                  </RoleRedirect>
                }
              />
              
              {/* ===== 404 ===== */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Simple Notification Popup */}
            <SimpleNotification />
          </BrowserRouter>
        </BetProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
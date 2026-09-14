import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import AdminSidebar from './AdminSidebar';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'agent';

  return (
    <div className="min-h-screen bg-dark-100 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {isAdmin && <AdminSidebar />}
        <main className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
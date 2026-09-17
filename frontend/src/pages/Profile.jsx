// frontend/src/pages/Profile.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaWallet, FaCalendar } from 'react-icons/fa';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">My Profile</h1>
      
      <div className="bg-dark-200 rounded-xl p-6 border border-gold-500/20">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gold-500 flex items-center justify-center text-3xl font-bold text-dark-100">
            {user?.firstName?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.firstName} {user?.lastName}</h2>
            <p className="text-gray-400">@{user?.username}</p>
            {user?.isAdmin && (
              <span className="text-xs bg-gold-500/20 text-gold-500 px-2 py-0.5 rounded">Admin</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3 bg-dark-100 p-3 rounded-lg">
            <FaEnvelope className="text-gold-500" />
            <span className="text-gray-400">Email:</span>
            <span className="text-white">{user?.email}</span>
          </div>
          
          <div className="flex items-center space-x-3 bg-dark-100 p-3 rounded-lg">
            <FaPhone className="text-gold-500" />
            <span className="text-gray-400">Phone:</span>
            <span className="text-white">{user?.phone || 'Not set'}</span>
          </div>
          
          <div className="flex items-center space-x-3 bg-dark-100 p-3 rounded-lg">
            <FaWallet className="text-gold-500" />
            <span className="text-gray-400">Balance:</span>
            <span className="text-gold-500 font-bold">{user?.balance?.toLocaleString()} ETB</span>
          </div>
          
          <div className="flex items-center space-x-3 bg-dark-100 p-3 rounded-lg">
            <FaCalendar className="text-gold-500" />
            <span className="text-gray-400">Member since:</span>
            <span className="text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

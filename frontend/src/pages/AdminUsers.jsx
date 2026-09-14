import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaSearch, FaUser, FaCheck, FaTimes, FaShieldAlt, FaUserTie } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}/status`, {
        isActive: !currentStatus,
      });
      toast.success(`User ${currentStatus ? 'blocked' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/status`, {
        role: newRole,
      });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin':
        return <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs flex items-center gap-1"><FaShieldAlt /> Admin</span>;
      case 'agent':
        return <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-xs flex items-center gap-1"><FaUserTie /> Agent</span>;
      default:
        return <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs flex items-center gap-1"><FaUser /> Player</span>;
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs flex items-center gap-1"><FaCheck /> Active</span>
      : <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs flex items-center gap-1"><FaTimes /> Blocked</span>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">👥 Manage Users</h1>
        <div className="text-gray-400 text-sm">
          Total: {users.length} users
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-500" />
        </div>
        <input
          type="text"
          placeholder="Search users by name, email, or username..."
          value={search}
          onChange={handleSearch}
          className="w-full bg-dark-200 text-white pl-10 pr-4 py-3 rounded-lg border border-gold-500/20 focus:border-gold-500 outline-none transition"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-dark-200 rounded-xl">
          <p className="text-gray-400">No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Balance</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Joined</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id} className="border-b border-gold-500/10 hover:bg-dark-200/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 font-bold">
                        {u.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{u.username}</p>
                        <p className="text-gray-400 text-xs">{u.firstName} {u.lastName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{u.email}</td>
                  <td className="px-4 py-3">{getRoleBadge(u.role)}</td>
                  <td className="px-4 py-3 text-gold-500 text-sm font-bold">{u.balance?.toLocaleString()} ETB</td>
                  <td className="px-4 py-3">{getStatusBadge(u.isActive)}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2 flex-wrap">
                      {/* Status Toggle */}
                      <button
                        onClick={() => handleStatusToggle(u._id, u.isActive)}
                        className={`px-2 py-1 rounded text-xs transition ${
                          u.isActive 
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'
                        }`}
                      >
                        {u.isActive ? 'Block' : 'Activate'}
                      </button>

                      {/* Role Change */}
                      <select
                        value={u.role || 'player'}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="bg-dark-100 text-white text-xs px-2 py-1 rounded border border-gold-500/20 focus:border-gold-500 outline-none"
                        disabled={u.email === 'admin@mikabet.com'} // Don't allow changing admin
                      >
                        <option value="player">Player</option>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
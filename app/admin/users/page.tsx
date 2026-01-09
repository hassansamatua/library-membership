'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FiSearch,
  FiEye,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiXCircle,
  FiDownload,
} from 'react-icons/fi';

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
  status?: 'active' | 'pending' | 'rejected' | 'expired';
  createdAt: string;
}

export default function MemberManagementPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'expired'>('all');

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!isAuthLoading && isAuthenticated && !user?.isAdmin) {
      router.push('/dashboard');
      return;
    }

    fetchUsers();
  }, [isAuthLoading, isAuthenticated, user]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to approve user');
      setUsers(users.map(u => u.id === userId ? { ...u, isApproved: true } : u));
      toast.success('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async (userId: number) => {
    if (!confirm('Are you sure you want to reject this user?')) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to reject user');
      setUsers(users.map(u => u.id === userId ? { ...u, isApproved: false } : u));
      toast.success('User rejected successfully');
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'approved') {
      return matchesSearch && user.isApproved;
    } else if (activeTab === 'pending') {
      return matchesSearch && !user.isApproved && user.status !== 'rejected' && user.status !== 'expired';
    } else if (activeTab === 'rejected') {
      return matchesSearch && user.status === 'rejected';
    } else if (activeTab === 'expired') {
      return matchesSearch && user.status === 'expired';
    }
    return matchesSearch;
  });

  const getTabCounts = () => {
    return {
      all: users.length,
      approved: users.filter(u => u.isApproved).length,
      pending: users.filter(u => !u.isApproved && u.status !== 'rejected' && u.status !== 'expired').length,
      rejected: users.filter(u => u.status === 'rejected').length,
      expired: users.filter(u => u.status === 'expired').length
    };
  };

  const tabCounts = getTabCounts();

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Member Management</h1>
        <p className="text-gray-600">View, edit, approve, and manage member accounts</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Users
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tabCounts.all}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'approved'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approved Users
              <span className="ml-2 bg-green-100 text-green-600 py-0.5 px-2 rounded-full text-xs">
                {tabCounts.approved}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Users
              <span className="ml-2 bg-yellow-100 text-yellow-600 py-0.5 px-2 rounded-full text-xs">
                {tabCounts.pending}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'rejected'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rejected Users
              <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                {tabCounts.rejected}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('expired')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'expired'
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Expired Users
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tabCounts.expired}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'all' ? 'all' : activeTab} users by name or email...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isAdmin
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : user.status === 'expired'
                        ? 'bg-gray-100 text-gray-800'
                        : user.isApproved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.status === 'rejected' ? (
                        <>
                          <FiXCircle className="mr-1 h-3 w-3" />
                          Rejected
                        </>
                      ) : user.status === 'expired' ? (
                        <>
                          <FiXCircle className="mr-1 h-3 w-3" />
                          Expired
                        </>
                      ) : user.isApproved ? (
                        <>
                          <FiCheck className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <FiXCircle className="mr-1 h-3 w-3" />
                          Pending
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        className="text-green-600 hover:text-green-900"
                        title="View Details"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit User"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      {!user.isApproved && user.status !== 'rejected' && user.status !== 'expired' && (
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Approve User"
                        >
                          <FiCheck className="h-4 w-4" />
                        </button>
                      )}
                      {user.status === 'rejected' && (
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Re-approve User"
                        >
                          <FiCheck className="h-4 w-4" />
                        </button>
                      )}
                      {user.isApproved && user.status !== 'expired' && (
                        <button
                          onClick={() => handleReject(user.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Reject User"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      )}
                      {user.status !== 'expired' && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedUsers.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            {selectedUsers.length} user{selectedUsers.length === 1 ? '' : 's'} selected
          </span>
          <div className="space-x-2">
            <button
              onClick={() => {
                // TODO: Implement bulk actions (approve, delete, export)
                alert('Bulk actions coming soon!');
              }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-600 bg-green-100 hover:bg-green-200"
            >
              <FiCheck className="mr-1 h-3 w-3" />
              Approve Selected
            </button>
            <button
              onClick={() => {
                // TODO: Implement bulk export
                alert('Bulk export coming soon!');
              }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              <FiDownload className="mr-1 h-3 w-3" />
              Export Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

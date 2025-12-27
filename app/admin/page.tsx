// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiUser, FiUsers, FiFileText, FiPrinter, FiDownload, FiCheck, FiX, FiEdit2, FiTrash2, FiPlus, FiSearch, FiHome } from 'react-icons/fi';

// Update the User interface to include both isApproved and is_approved
interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
  is_approved?: boolean; // Add this line
  createdAt: string;
}

console.log('[AdminPage] Component module loaded');

function AdminDashboard() {
  console.log('[AdminDashboard] Component rendering');
  const { user: currentUser, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    isAdmin: false
  });

  useEffect(() => {
    setIsClient(true);
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isAuthLoading && isAuthenticated && !currentUser?.isAdmin) {
      router.push('/');
    }
  }, [isAuthenticated, isAuthLoading, currentUser, router]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.isAdmin) {
      fetchUsers();
    }
  }, [isAuthenticated, currentUser]);

const fetchUsers = async () => {
  try {
    const response = await fetch('/api/admin/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();
    
    // Ensure both is_approved and isApproved are set correctly
    const formattedUsers = data.map((user: any) => ({
      ...user,
      isApproved: user.is_approved || user.isApproved || false,
      is_approved: user.is_approved || user.isApproved || false
    }));
    
    setUsers(formattedUsers);
    setIsLoading(false);
  } catch (error) {
    console.error('Error fetching users:', error);
    setIsLoading(false);
    toast.error('Failed to load users');
  }
};
// Update the handleApproveUser function
const handleApproveUser = async (userId: number) => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to approve user');
    }
    // Update both isApproved and is_approved in the local state
    setUsers(users.map(user => 
      user.id === userId ? { 
        ...user, 
        isApproved: true,
        is_approved: true 
      } : user
    ));
    
    toast.success('User approved successfully');
  } catch (error) {
    console.error('Error approving user:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to approve user');
  }
};

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE', 
      });

      if (!res.ok) throw new Error('Failed to delete user');

      await fetchUsers();
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user');
    }

    const data = await response.json();
    toast.success('User created successfully');
    setShowCreateModal(false);
    setNewUser({ name: '', email: '', isAdmin: false });
    fetchUsers(); // Refresh the users list
  } catch (error) {
    console.error('Error creating user:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to create user');
  }
};

  const handleGenerateIdCard = (userId: number) => {
    // Implementation for generating ID card
    console.log('Generate ID card for user:', userId);
  };

  const handleDownloadIdCards = (userIds: number[]) => {
    // Implementation for downloading ID cards
    console.log('Download ID cards for users:', userIds);
  };

  const handleGenerateReport = () => {
    // Implementation for generating report
    setShowReportModal(false);
    toast.success('Report generated successfully');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAuthLoading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  function toggleUserSelection(id: number): void {
    setSelectedUsers(prev =>
      prev.includes(id)
        ? prev.filter(userId => userId !== id)
        : [...prev, id]
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/logo.jpeg"
              alt="Logo"
              className="h-10 w-10 mr-3"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <a
              href="/"
              className="flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <FiHome className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Home</span>
            </a>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <FiFileText className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Generate</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FiX className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <div className="flex space-x-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    <FiPlus className="mr-2" /> Add User
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-10 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <FiUser className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">ID: {user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isApproved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.isApproved ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.isAdmin ? 'Administrator' : 'User'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2 justify-end">
                            {!user.isApproved && (
                              <button
                                onClick={() => handleApproveUser(user.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve User"
                              >
                                <FiCheck className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleGenerateIdCard(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Generate ID Card"
                            >
                              <FiPrinter className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {/* Add edit functionality here */}}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit User"
                            >
                              <FiEdit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setSelectedUsers([])}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Clear Selection
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveUser(selectedUsers[0])}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                      >
                        <FiCheck className="mr-2" /> Approve Selected
                      </button>
                      <button
                        onClick={() => handleDownloadIdCards(selectedUsers)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <FiDownload className="mr-2" /> Download IDs
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Create User Modal */}
              {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={() => setShowCreateModal(false)}
                  />
                  
                  {/* Modal */}
                  <div 
                    className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Create New User
                        </h3>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                          onClick={() => setShowCreateModal(false)}
                        >
                          <FiX className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleCreateUser} className="px-6 pb-6 space-y-4">
                      {/* Name Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        />
                      </div>

                      {/* Email Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        />
                      </div>

                      {/* Admin Checkbox */}
                      <div className="flex items-center">
                        <input
                          id="isAdmin"
                          type="checkbox"
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                          checked={newUser.isAdmin}
                          onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})}
                        />
                        <label 
                          htmlFor="isAdmin" 
                          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                        >
                          Grant admin privileges
                        </label>
                      </div>

                      {/* Buttons */}
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Create User
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Report Modal */}
              {showReportModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div
                      className="fixed inset-0 bg-black/50 transition-opacity"
                      onClick={() => setShowReportModal(false)}
                    />
                    <div
                      className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Report</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Report Type</label>
                            <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md">
                              <option>User Activity</option>
                              <option>System Usage</option>
                              <option>Audit Log</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Date Range</label>
                            <div className="mt-1 grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              />
                              <input
                                type="date"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                          type="button"
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                          onClick={handleGenerateReport}
                        >
                          Generate
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                          onClick={() => setShowReportModal(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
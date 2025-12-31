// app/admin/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FiEye, 
  FiTrash2, 
  FiX, 
  FiEdit2, 
  FiCheck, 
  FiXCircle, 
  FiDownload, 
  FiBarChart2, 
  FiPieChart,
  FiUser,
  FiHome,
  FiSearch,
  FiFileText,
  FiLinkedin,
  FiGithub,
  FiTwitter,
  FiGlobe
} from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
import UserRegistrationForm from '@/components/admin/UserRegistrationForm';

interface UserProfile {
  personal?: {
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    idNumber?: string;
    passportNumber?: string;
    [key: string]: any;
  };
  contact?: {
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    website?: string;
    social?: {
      linkedin?: string;
      github?: string;
      twitter?: string;
      facebook?: string;
      instagram?: string;
    };
    [key: string]: any;
  };
  education?: {
    highestDegree?: string;
    fieldOfStudy?: string;
    institution?: string;
    yearOfGraduation?: string;
    [key: string]: any;
  };
  employment?: {
    jobTitle?: string;
    industry?: string;
    [key: string]: any;
  };
  skills?: string[];
  membership?: {
    number?: string;
    type?: string;
    status?: string;
    expiry?: string;
    joinDate?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
  createdAt: string;
  profile?: UserProfile;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
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

    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  // Handle user approval
  const handleApproveUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          data,
        });
        throw new Error(data.message || 'Failed to approve user');
      }
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isApproved: true } : user
      ));
      
      toast.success('User approved successfully');
    } catch (error: unknown) {
      console.error('Error approving user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve user';
      toast.error(errorMessage);
    }
  };

  // Handle password update
  const handleUpdatePassword = async (userId: number) => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (error) {
      console.error('Error updating password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Handle view user details
  const handleViewUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/details`);
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      const userData = await response.json();
      setSelectedUser(userData);
      setShowUserModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    }
  };

  // Handle reject user
  const handleRejectUser = async (userId: number) => {
    if (!confirm('Are you sure you want to reject this user?')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject user');
      }
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isApproved: false } : user
      ));
      
      toast.success('User rejected successfully');
      setShowUserModal(false);
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      // Remove the user from the local state
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
      
      // Close the modal if the deleted user is being viewed
      if (selectedUser?.id === userId) {
        setShowUserModal(false);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isAuthLoading && isAuthenticated && !user?.isAdmin) {
      router.push('/');
    }
  }, [isAuthenticated, isAuthLoading, user, router]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowUserModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                // Add logout logic here
                router.push('/logout');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          {/* Search and filter */}
          <div className="mb-6">
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
          </div>

          {/* Users table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users
                    .filter(user => 
                      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <FiUser className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewUser(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View details"
                            >
                              <FiEye className="h-5 w-5" />
                            </button>
                            {!user.isApproved && (
                              <button
                                onClick={() => handleApproveUser(user.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve user"
                              >
                                <FiCheck className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleRejectUser(user.id)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Reject user"
                            >
                              <FiXCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user.id);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete user"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowUserModal(false)}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedUser.isApproved ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                {selectedUser.profile && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.profile.personal?.dateOfBirth && (
                        <div>
                          <p className="text-sm text-gray-500">Date of Birth</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(selectedUser.profile.personal.dateOfBirth).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedUser.profile.personal?.gender && (
                        <div>
                          <p className="text-sm text-gray-500">Gender</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedUser.profile.personal.gender}
                          </p>
                        </div>
                      )}
                      {selectedUser.profile.contact?.phone && (
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedUser.profile.contact.phone}
                          </p>
                        </div>
                      )}
                      {selectedUser.profile.contact?.address && (
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedUser.profile.contact.address}
                          </p>
                        </div>
                      )}
                      {selectedUser.profile.contact?.city && selectedUser.profile.contact?.country && (
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {`${selectedUser.profile.contact.city}, ${selectedUser.profile.contact.country}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Education */}
                {selectedUser.profile?.education && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Education</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUser.profile.education.highestDegree && (
                          <div>
                            <p className="text-sm text-gray-500">Highest Degree</p>
                            <p className="mt-1 text-sm text-gray-900">
                              {selectedUser.profile.education.highestDegree}
                            </p>
                          </div>
                        )}
                        {selectedUser.profile.education.fieldOfStudy && (
                          <div>
                            <p className="text-sm text-gray-500">Field of Study</p>
                            <p className="mt-1 text-sm text-gray-900">
                              {selectedUser.profile.education.fieldOfStudy}
                            </p>
                          </div>
                        )}
                        {selectedUser.profile.education.institution && (
                          <div>
                            <p className="text-sm text-gray-500">Institution</p>
                            <p className="mt-1 text-sm text-gray-900">
                              {selectedUser.profile.education.institution}
                            </p>
                          </div>
                        )}
                        {selectedUser.profile.education.yearOfGraduation && (
                          <div>
                            <p className="text-sm text-gray-500">Year of Graduation</p>
                            <p className="mt-1 text-sm text-gray-900">
                              {selectedUser.profile.education.yearOfGraduation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Employment */}
                {selectedUser.profile?.employment && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Employment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.profile.employment.jobTitle && (
                        <div>
                          <p className="text-sm text-gray-500">Job Title</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedUser.profile.employment.jobTitle}
                          </p>
                        </div>
                      )}
                      {selectedUser.profile.employment.industry && (
                        <div>
                          <p className="text-sm text-gray-500">Industry</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedUser.profile.employment.industry}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selectedUser.profile?.skills && selectedUser.profile.skills.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.profile.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Membership */}
                {selectedUser.profile?.membership && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Membership</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.profile.membership.number && (
                        <div>
                          <p className="text-sm text-gray-500">Membership Number</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedUser.profile.membership.number}
                          </p>
                        </div>
                      )}
                      {selectedUser.profile.membership.type && (
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedUser.profile.membership.type}
                          </p>
                        </div>
                      )}
                      {selectedUser.profile.membership.status && (
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedUser.profile.membership.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedUser.profile.membership.status}
                          </span>
                        </div>
                      )}
                      {selectedUser.profile.membership.joinDate && (
                        <div>
                          <p className="text-sm text-gray-500">Join Date</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(selectedUser.profile.membership.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedUser.profile.membership.expiry && (
                        <div>
                          <p className="text-sm text-gray-500">Expiry Date</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(selectedUser.profile.membership.expiry).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Password Update Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Update Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {passwordError && (
                      <p className="text-red-500 text-sm">{passwordError}</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleUpdatePassword(selectedUser.id)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={!newPassword || !confirmPassword}
                      >
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  {!selectedUser.isApproved && (
                    <button
                      onClick={() => handleApproveUser(selectedUser.id)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Approve User
                    </button>
                  )}
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
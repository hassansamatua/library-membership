// app/admin/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiUser, FiFileText, FiHome, FiX, FiPlus, FiSearch, FiCheck, FiEdit2, FiTrash2, FiBarChart2, FiPieChart, FiDownload } from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
import UserRegistrationForm from '@/components/admin/UserRegistrationForm';

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user: currentUser, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportType, setReportType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [showChart, setShowChart] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const chartRef = useRef<any>(null);
  
  
  // Handle user approval
  const handleApproveUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve user');
      }
      
      // Update the user list
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
  
  // Handle admin delete user
  const handleAdminDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Remove the user from the list
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  // Authentication and data fetching logic
  useEffect(() => {
    setIsClient(true);
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isAuthLoading && isAuthenticated && !currentUser?.isAdmin) {
      router.push('/');
    }
  }, [isAuthenticated, isAuthLoading, currentUser, router]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setIsLoading(false);
      toast.error('Failed to load users');
    }
  };

  // Define supported report types
  const supportedReportTypes = [
    // Membership Reports
    'active_members', 'new_members', 'expiring_members',
    // Financial Reports
    'revenue_by_month', 'payment_methods', 'outstanding_payments', 'revenue_by_category',
    // Other Reports
    'attendance', 'inventory', 'event'
  ];
  
  // Get report display name
  const getReportDisplayName = (type: string) => {
    const names: Record<string, string> = {
      // Membership Reports
      'active_members': 'Active Members',
      'new_members': 'New Members',
      'expiring_members': 'Expiring Members',
      
      // Financial Reports
      'revenue_by_month': 'Revenue by Month',
      'payment_methods': 'Payment Methods',
      'outstanding_payments': 'Outstanding Payments',
      'revenue_by_category': 'Revenue by Category',
      
      // Other Reports
      'attendance': 'Attendance Report',
      'inventory': 'Inventory Report',
      'event': 'Event Report'
    };
    return names[type] || type;
  };

  // Format chart data based on report type and data
  const formatChartData = (data: any) => {
    if (!data || !data.rows || !data.headers) {
      console.error('Invalid chart data:', data);
      return null;
    }

    const headers = data.headers;
    const rows = data.rows;
    
    console.log('Formatting chart data for report type:', reportType);
    console.log('Headers:', headers);
    console.log('Sample row:', rows[0]);

    // Default to first column for labels, second for data
    const labelField = headers[0]?.toLowerCase().replace(/\s+/g, '_');
    const dataField = headers[1]?.toLowerCase().replace(/\s+/g, '_') || headers[0]?.toLowerCase().replace(/\s+/g, '_');

    // Get unique labels and sum values for each label
    const labelMap = new Map();
    
    rows.forEach((row: any) => {
      const label = String(row[labelField] || 'Unknown');
      const value = parseFloat(row[dataField]) || 0;
      
      if (labelMap.has(label)) {
        labelMap.set(label, labelMap.get(label) + value);
      } else {
        labelMap.set(label, value);
      }
    });

    const labels = Array.from(labelMap.keys());
    const values = Array.from(labelMap.values());

    // Generate random colors for the chart
    const backgroundColors = labels.map(() => 
      `rgba(${Math.floor(Math.random() * 200) + 55}, ${Math.floor(Math.random() * 200) + 55}, ${Math.floor(Math.random() * 200) + 55}, 0.7)`
    );

    // Ensure all values are numbers
    const numericValues = values.map(v => typeof v === 'number' ? v : 0);

    return {
      labels,
      datasets: [
        {
          label: dataField.replace(/_/g, ' ').toUpperCase(),
          data: numericValues,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  // Handle report generation
  const handleGenerateReport = async () => {
    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }
    
    const toastId = toast.loading('Generating report...');

    try {
      // Validate report type
      if (!supportedReportTypes.includes(reportType)) {
        throw new Error('Selected report type is not supported');
      }
      
      // Map report type to API endpoint
      let apiReportType = reportType;
      if (['active_members', 'new_members', 'expiring_members'].includes(reportType)) {
        apiReportType = 'membership';
      } else if ([
        'revenue_by_month', 
        'payment_methods', 
        'outstanding_payments', 
        'revenue_by_category'
      ].includes(reportType)) {
        apiReportType = 'financial';
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('type', apiReportType);
      
      // Add date range if specified
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      
      // Add report subtype if needed
      if (['active_members', 'new_members', 'expiring_members'].includes(reportType)) {
        params.append('status', reportType.split('_')[0]); // 'active', 'new', or 'expiring'
      } else if ([
        'revenue_by_month', 
        'payment_methods', 
        'outstanding_payments', 
        'revenue_by_category'
      ].includes(reportType)) {
        params.append('subtype', reportType);
      }
      
      console.log('Fetching report with params:', params.toString());
      
      // Fetch the report data
      const response = await fetch(`/api/reports/generate?${params.toString()}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        const error = new Error(errorData.error || 'Failed to generate report');
        throw error;
      }

      const result = await response.json();
      console.log('Report data received:', result);
      
      if (!result.success) {
        throw new Error('Invalid response format from server');
      }

      // Format the chart data
      const chartData = formatChartData(result.data);
      
      console.log('Formatted chart data:', chartData);
      
      // Update state with report data
      setReportData({
        headers: result.data.headers || [],
        rows: result.data.rows || [],
        chartData: chartData
      });
      
      setShowChart(true);
      setShowResultsModal(true);
      
      // Update toast to success
      toast.update(toastId, {
        render: 'Report generated successfully',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
      
    } catch (error: unknown) {
      console.error('Error generating report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      
      toast.update(toastId, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
      
      // Re-throw the error after showing the toast
    } finally {
      setShowReportModal(false);
    }
  };

  // Handle chart download
  const handleDownloadChart = () => {
    if (!chartRef.current) return;
    
    const link = document.createElement('a');
    link.download = `${reportType}_chart_${new Date().toISOString().split('T')[0]}.png`;
    link.href = chartRef.current.toBase64Image();
    link.click();
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && currentUser?.isAdmin) {
      fetchUsers();
    }
  }, [isAuthenticated, currentUser]);

  if (isAuthLoading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
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
              <span className="hidden sm:inline">Generate Report</span>
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

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white p-6 rounded-lg shadow">
            {/* Report Modal */}
            {showReportModal && (
              <div className="fixed inset-0 bg-gray-100 bg-opacity-90 flex items-center justify-center z-50 p-4">
                <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Report</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Report Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          required
                        >
                          <option value="">Select report type</option>
                          <optgroup label="Membership Reports">
                            <option value="active_members">Active Members</option>
                            <option value="new_members">New Members</option>
                            <option value="expiring_members">Expiring Members</option>
                          </optgroup>
                          <optgroup label="Financial Reports">
                            <option value="revenue_by_month">Revenue by Month</option>
                            <option value="payment_methods">Payment Methods</option>
                            <option value="outstanding_payments">Outstanding Payments</option>
                            <option value="revenue_by_category">Revenue by Category</option>
                          </optgroup>
                          <optgroup label="Other Reports">
                            <option value="attendance">Attendance Report</option>
                            <option value="inventory">Inventory Report</option>
                            <option value="event">Event Report</option>
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date Range
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">From</label>
                            <input
                              type="date"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">To</label>
                            <input
                              type="date"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              min={dateFrom}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            onClick={() => setShowReportModal(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            onClick={handleGenerateReport}
                          >
                            Generate Report
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Report Results */}
            {reportData && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                  </h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowChart(!showChart)}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
                    >
                      {showChart ? (
                        <>
                          <FiFileText className="mr-1.5 h-4 w-4" />
                          Show Table
                        </>
                      ) : (
                        <>
                          <FiBarChart2 className="mr-1.5 h-4 w-4" />
                          Show Chart
                        </>
                      )}
                    </button>
                    {showChart && (
                      <>
                        <button
                          onClick={() => setChartType('bar')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                          <FiBarChart2 className="mr-1.5 h-4 w-4" />
                          Bar Chart
                        </button>
                        <button
                          onClick={() => setChartType('pie')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                          <FiPieChart className="mr-1.5 h-4 w-4" />
                          Pie Chart
                        </button>
                        <button
                          onClick={handleDownloadChart}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center"
                        >
                          <FiDownload className="mr-1.5 h-4 w-4" />
                          Download Chart
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {showChart && reportData.chartData ? (
                  <div className="mt-6">
                    <div className="h-96">
                      {chartType === 'bar' ? (
                        <Bar 
                          ref={chartRef}
                          data={reportData.chartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top' as const,
                              },
                              title: {
                                display: true,
                                text: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
                              },
                            },
                          }}
                        />
                      ) : (
                        <div className="flex justify-center">
                          <div className="w-96 h-96">
                            <Pie 
                              ref={chartRef}
                              data={reportData.chartData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'right' as const,
                                  },
                                  title: {
                                    display: true,
                                    text: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {reportData.headers.map((header: string, index: number) => (
                            <th 
                              key={index}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.rows.map((row: any, rowIndex: number) => (
                          <tr key={rowIndex}>
                            {reportData.headers.map((header: string, colIndex: number) => {
                              const headerKey = header.toLowerCase().replace(/\s+/g, '_');
                              return (
                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {row[headerKey] || '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Main Content */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard</h2>
              <div className="flex space-x-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
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
                            onClick={() => {/* Add edit functionality here */}}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit User"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleAdminDeleteUser(user.id)}
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
          </div>
        </div>
      </main>
    </div>
  );
}

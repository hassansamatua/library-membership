'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FiSearch,
  FiDownload,
  FiFilter,
  FiCalendar,
  FiFileText,
  FiBarChart2,
  FiPieChart,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiEye,
  FiRefreshCw,
  FiX,
  FiTrash2,
} from 'react-icons/fi';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'users' | 'payments' | 'events' | 'membership' | 'activity';
  format: 'pdf' | 'excel' | 'csv';
  generatedAt: string;
  generatedBy: string;
  fileSize: number;
  downloadUrl: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'users' | 'payments' | 'events' | 'membership' | 'activity';
  icon: React.ElementType;
  fields: string[];
}

export default function AdminReportsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [generateForm, setGenerateForm] = useState({
    dateFrom: '',
    dateTo: '',
    format: 'excel' as 'pdf' | 'excel' | 'csv',
    filters: {} as Record<string, any>,
  });

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'users',
      name: 'Users Report',
      description: 'Comprehensive user data including demographics and activity',
      type: 'users',
      icon: FiUsers,
      fields: ['name', 'email', 'registrationDate', 'membershipType', 'status'],
    },
    {
      id: 'payments',
      name: 'Payments Report',
      description: 'Payment transactions, revenue, and financial summaries',
      type: 'payments',
      icon: FiDollarSign,
      fields: ['amount', 'status', 'paymentDate', 'membershipType', 'method'],
    },
    {
      id: 'events',
      name: 'Events Report',
      description: 'Event attendance, popularity, and participation metrics',
      type: 'events',
      icon: FiCalendar,
      fields: ['title', 'date', 'attendees', 'status', 'location'],
    },
    {
      id: 'membership',
      name: 'Membership Report',
      description: 'Membership statistics, renewals, and expirations',
      type: 'membership',
      icon: FiTrendingUp,
      fields: ['type', 'status', 'joinDate', 'expiryDate', 'payments'],
    },
    {
      id: 'activity',
      name: 'Activity Report',
      description: 'User activity, engagement, and system usage metrics',
      type: 'activity',
      icon: FiBarChart2,
      fields: ['logins', 'pageViews', 'actions', 'duration', 'lastActive'],
    },
  ];

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!isAuthLoading && isAuthenticated && !user?.isAdmin) {
      router.push('/dashboard');
      return;
    }

    fetchReports();
  }, [isAuthLoading, isAuthenticated, user]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/reports', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reportType: selectedTemplate.type,
          startDate: generateForm.dateFrom,
          endDate: generateForm.dateTo,
          columns: generateForm.filters,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      toast.success('Report generated successfully');
      setShowGenerateModal(false);
      setSelectedTemplate(null);
      setGenerateForm({
        dateFrom: '',
        dateTo: '',
        format: 'excel',
        filters: {},
      });
      fetchReports();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const response = await fetch(report.downloadUrl, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to download report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name}.${report.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete report');
      setReports(reports.filter(r => r.id !== reportId));
      toast.success('Report deleted successfully');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'users': return 'bg-blue-100 text-blue-800';
      case 'payments': return 'bg-green-100 text-green-800';
      case 'events': return 'bg-purple-100 text-purple-800';
      case 'membership': return 'bg-yellow-100 text-yellow-800';
      case 'activity': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.generatedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and download various reports</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          <FiFileText className="mr-2 h-4 w-4" />
          Generate Report
        </button>
      </div>

      {/* Report Templates */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Generate</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowGenerateModal(true);
                }}
                className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-full ${getReportTypeColor(template.type)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{template.name}</h3>
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports by name, description, or generated by..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchReports}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiRefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Reports table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No reports found matching your search' : 'No reports generated yet'}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{report.name}</div>
                        <div className="text-sm text-gray-500">{report.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReportTypeColor(report.type)}`}>
                        {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">
                      {report.format}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>{new Date(report.generatedAt).toLocaleDateString()}</div>
                        <div className="text-xs">by {report.generatedBy}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(report.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowReportModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(report)}
                          className="text-green-600 hover:text-green-900"
                          title="Download Report"
                        >
                          <FiDownload className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Report"
                        >
                          <FiTrash2 className="h-4 w-4" />
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

      {/* Generate Report Modal */}
      {showGenerateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Generate {selectedTemplate.name}</h2>
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setSelectedTemplate(null);
                    setGenerateForm({
                      dateFrom: '',
                      dateTo: '',
                      format: 'excel',
                      filters: {},
                    });
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleGenerateReport(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={generateForm.dateFrom}
                      onChange={(e) => setGenerateForm({ ...generateForm, dateFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={generateForm.dateTo}
                      onChange={(e) => setGenerateForm({ ...generateForm, dateTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {['excel', 'pdf', 'csv'].map((format) => (
                      <label key={format} className="flex items-center">
                        <input
                          type="radio"
                          value={format}
                          checked={generateForm.format === format}
                          onChange={(e) => setGenerateForm({ ...generateForm, format: e.target.value as any })}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium uppercase">{format}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include Fields
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedTemplate.fields.map((field) => (
                      <label key={field} className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="mr-2"
                        />
                        <span className="text-sm">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGenerateModal(false);
                      setSelectedTemplate(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Generate Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {showReportModal && selectedReport && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowReportModal(false)}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Report Details</h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Report Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="mt-1 text-sm text-gray-900">{selectedReport.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReportTypeColor(selectedReport.type)}`}>
                        {selectedReport.type}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Format</p>
                      <p className="mt-1 text-sm text-gray-900 uppercase">{selectedReport.format}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">File Size</p>
                      <p className="mt-1 text-sm text-gray-900">{formatFileSize(selectedReport.fileSize)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Generated By</p>
                      <p className="mt-1 text-sm text-gray-900">{selectedReport.generatedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Generated At</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedReport.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{selectedReport.description}</p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDownload(selectedReport);
                      setShowReportModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <FiDownload className="inline mr-2 h-4 w-4" />
                    Download
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

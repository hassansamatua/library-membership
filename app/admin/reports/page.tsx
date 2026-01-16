'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

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
  const [reportData, setReportData] = useState<any>(null);
  const [showDataModal, setShowDataModal] = useState(false);
  
  // Support for multiple charts
  interface ChartConfig {
    id: string;
    field: string;
    type: 'bar' | 'pie' | 'line';
    title: string;
  }
  const [activeCharts, setActiveCharts] = useState<ChartConfig[]>([]);
  const [chartField, setChartField] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');


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
      setIsLoading(true);
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to generate report`);
      }

      const data = await response.json();
      
      console.log('Report generation response:', data);
      
      if (data.success && data.data) {
        setReportData(data.data);
        const chartableFields = getChartableFields(data.data);
        if (chartableFields.length > 0) {
          setChartField(chartableFields[0]);
        }
        setShowDataModal(true);
        toast.success(`Report generated successfully - ${data.recordCount || data.data.length} records found`);
      } else {
        console.error('Report generation failed:', data);
        throw new Error(data.message || 'No data returned from report generation');
      }
      
      setShowGenerateModal(false);
      setSelectedTemplate(null);
      setGenerateForm({
        dateFrom: '',
        dateTo: '',
        format: 'excel',
        filters: {},
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
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

  const generateChartData = (data: any[], field: string, type: 'bar' | 'pie' | 'line') => {
    if (!data || data.length === 0) return null;

    const colors = [
      'rgb(75, 192, 192)',
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 206, 86)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)',
      'rgb(199, 199, 199)',
      'rgb(83, 102, 255)',
      'rgb(255, 205, 86)',
      'rgb(201, 203, 207)',
    ];

    // Check if field is numeric (for aggregation) or categorical
    const fieldValues = data.map(row => row[field]);
    const isNumericField = fieldValues.some(v => typeof v === 'number' && v > 100);
    
    let chartLabels: string[] = [];
    let chartData: number[] = [];

    if (isNumericField) {
      // For numeric fields like amount, sum them up
      const uniqueValues = [...new Set(fieldValues)].filter(v => v !== null && v !== undefined);
      chartLabels = uniqueValues.map(v => String(v)).sort();
      chartData = chartLabels.map(label => {
        const values = data
          .filter(row => String(row[field]) === label)
          .map(row => parseFloat(String(row[field])) || 0);
        return values.reduce((a, b) => a + b, 0);
      });
    } else {
      // For categorical fields, count occurrences
      const uniqueValues = [...new Set(fieldValues)].filter(v => v !== null && v !== undefined);
      chartLabels = uniqueValues.map(v => String(v));
      chartData = chartLabels.map(label => 
        fieldValues.filter(v => String(v) === label).length
      );
      
      // Sort by count (descending) for better visualization
      const sorted = chartLabels
        .map((label, idx) => ({ label, count: chartData[idx] }))
        .sort((a, b) => b.count - a.count);
      chartLabels = sorted.map(s => s.label);
      chartData = sorted.map(s => s.count);
    }

    const baseColors = colors.slice(0, Math.max(chartLabels.length, colors.length));

    if (type === 'pie') {
      return {
        labels: chartLabels,
        datasets: [
          {
            label: field,
            data: chartData,
            backgroundColor: baseColors,
            borderColor: baseColors.map(c => c.replace('rgb', 'rgba').replace(')', ', 1)')),
            borderWidth: 2,
          },
        ],
      };
    }

    if (type === 'bar') {
      return {
        labels: chartLabels,
        datasets: [
          {
            label: `${field}`,
            data: chartData,
            backgroundColor: baseColors[0],
            borderColor: baseColors[0].replace('rgb', 'rgba').replace(')', ', 1)'),
            borderWidth: 1,
          },
        ],
      };
    }

    // Line chart
    return {
      labels: chartLabels,
      datasets: [
        {
          label: `Trend: ${field}`,
          data: chartData,
          borderColor: baseColors[0],
          backgroundColor: baseColors[0].replace('rgb', 'rgba').replace(')', ', 0.1)'),
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: baseColors[0],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  const getChartableFields = (data: any[]) => {
    if (!data || data.length === 0) return [];
    const firstRow = data[0];
    return Object.keys(firstRow).filter(key => {
      const value = firstRow[key];
      // Include string and number fields, exclude IDs and very long text
      return (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') &&
             !key.toLowerCase().includes('id') &&
             String(value).length < 100;
    });
  };

  const getSuggestedCharts = (reportType: string | undefined) => {
    // Return suggested chart configurations based on report type
    const suggestions: Record<string, Array<{ field: string; type: 'bar' | 'pie' | 'line'; title: string }>> = {
      payments: [
        { field: 'status', type: 'pie', title: 'Paid vs Pending/Overdue' },
        { field: 'method', type: 'bar', title: 'Payment Methods Trend' },
        { field: 'membershipType', type: 'bar', title: 'Payments by Membership Type' },
        { field: 'amount', type: 'line', title: 'Payment Amounts Trend' },
      ],
      events: [
        { field: 'title', type: 'bar', title: 'Registration by Event' },
        { field: 'status', type: 'pie', title: 'Event Status Distribution' },
        { field: 'attendees', type: 'bar', title: 'Events by Attendance' },
        { field: 'location', type: 'bar', title: 'Events by Location' },
      ],
      membership: [
        { field: 'status', type: 'pie', title: 'Active vs Inactive Members' },
        { field: 'type', type: 'pie', title: 'Membership Types Distribution' },
        { field: 'payments', type: 'bar', title: 'Payment History by Member' },
      ],
      users: [
        { field: 'membershipType', type: 'pie', title: 'Users by Membership Type' },
        { field: 'status', type: 'pie', title: 'User Status Distribution' },
        { field: 'registrationDate', type: 'line', title: 'Registration Trend Over Time' },
      ],
      activity: [
        { field: 'logins', type: 'bar', title: 'User Logins' },
        { field: 'pageViews', type: 'bar', title: 'Page Views Distribution' },
        { field: 'actions', type: 'bar', title: 'User Actions' },
        { field: 'duration', type: 'line', title: 'Session Duration Trend' },
      ],
    };
    
    return suggestions[reportType] || [];
  };

  const addChartToAnalysis = (field: string, type: 'bar' | 'pie' | 'line', title?: string) => {
    const chartId = `chart-${Date.now()}-${Math.random()}`;
    const newChart: ChartConfig = {
      id: chartId,
      field,
      type,
      title: title || `${field} Analysis`,
    };
    setActiveCharts([...activeCharts, newChart]);
  };

  const removeChartFromAnalysis = (chartId: string) => {
    setActiveCharts(activeCharts.filter(chart => chart.id !== chartId));
  };

  const addSuggestedChart = (suggestion: { field: string; type: 'bar' | 'pie' | 'line'; title: string }) => {
    // Check if chart already exists
    const exists = activeCharts.some(chart => chart.field === suggestion.field && chart.type === suggestion.type);
    if (!exists) {
      addChartToAnalysis(suggestion.field, suggestion.type, suggestion.title);
    }
  };

  const clearAllCharts = () => {
    setActiveCharts([]);
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

      {/* Report Data Modal */}
      {showDataModal && reportData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedTemplate?.name} - Results
                </h2>
                <button
                  onClick={() => {
                    setShowDataModal(false);
                    setReportData(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {reportData.length} records found
              </p>
            </div>
            
            <div className="flex-1 overflow-auto flex flex-col">
              {/* Suggested Charts Section */}
              {reportData.length > 0 && selectedTemplate && getSuggestedCharts(selectedTemplate.type).length > 0 && (
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="mb-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        <FiTrendingUp className="inline mr-2 h-5 w-5 text-blue-600" />
                        Suggested Visualizations
                      </h3>
                      <p className="text-sm text-gray-600">Click "Add to Dashboard" to compare multiple charts:</p>
                    </div>
                    {activeCharts.length > 0 && (
                      <button
                        onClick={clearAllCharts}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Clear All ({activeCharts.length})
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {getSuggestedCharts(selectedTemplate.type).map((suggestion, idx) => {
                      const chartData = generateChartData(reportData, suggestion.field, suggestion.type);
                      const isActive = activeCharts.some(c => c.field === suggestion.field && c.type === suggestion.type);
                      return chartData ? (
                        <div key={idx} className={`bg-white p-4 rounded-lg border-2 shadow-sm transition-all ${
                          isActive ? 'border-green-500 shadow-md' : 'border-gray-200 hover:shadow-md'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{suggestion.title}</h4>
                              <p className="text-xs text-gray-500">{suggestion.field}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addSuggestedChart(suggestion);
                              }}
                              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                isActive
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {isActive ? '✓ Added' : 'Add'}
                            </button>
                          </div>
                          <div 
                            style={{ height: '150px', position: 'relative', cursor: 'pointer' }}
                            onClick={() => {
                              setChartField(suggestion.field);
                              setChartType(suggestion.type);
                            }}
                          >
                            {suggestion.type === 'bar' && (
                              <Bar
                                data={chartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  indexAxis: 'y' as const,
                                  plugins: {
                                    legend: { display: false },
                                    title: { display: false },
                                  },
                                  scales: {
                                    x: { display: false },
                                    y: { display: false },
                                  },
                                }}
                              />
                            )}
                            {suggestion.type === 'pie' && (
                              <Pie
                                data={chartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { display: true, position: 'bottom' as const, labels: { font: { size: 10 } } },
                                    title: { display: false },
                                  },
                                }}
                              />
                            )}
                            {suggestion.type === 'line' && (
                              <Line
                                data={chartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { display: false },
                                    title: { display: false },
                                  },
                                  scales: {
                                    x: { display: false },
                                    y: { display: false },
                                  },
                                }}
                              />
                            )}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Multiple Active Charts Display */}
              {activeCharts.length > 0 && reportData && (
                <div className="p-6 border-b border-gray-200 bg-green-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      📊 Dashboard ({activeCharts.length} charts)
                    </h3>
                    <button
                      onClick={clearAllCharts}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <FiX className="inline mr-1 h-4 w-4" />
                      Clear All
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {activeCharts.map((chart) => {
                      const chartData = generateChartData(reportData, chart.field, chart.type);
                      return chartData ? (
                        <div key={chart.id} className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{chart.title}</h4>
                              <p className="text-xs text-gray-500">{chart.field} ({chart.type})</p>
                            </div>
                            <button
                              onClick={() => removeChartFromAnalysis(chart.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove chart"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                          <div style={{ height: '300px', position: 'relative' }}>
                            {chart.type === 'bar' && (
                              <Bar
                                data={chartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { position: 'top' as const },
                                    title: { display: false },
                                  },
                                }}
                              />
                            )}
                            {chart.type === 'pie' && (
                              <Pie
                                data={chartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { position: 'right' as const },
                                    title: { display: false },
                                  },
                                }}
                              />
                            )}
                            {chart.type === 'line' && (
                              <Line
                                data={chartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { position: 'top' as const },
                                    title: { display: false },
                                  },
                                }}
                              />
                            )}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Chart Section */}
              {reportData.length > 0 && getChartableFields(reportData).length > 0 && (
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Visualization</h3>
                      <p className="text-sm text-gray-600 mb-4">Create custom charts by selecting any field:</p>
                    </div>
                    <div className="flex flex-wrap gap-4 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field to Visualize
                        </label>
                        <select
                          value={chartField}
                          onChange={(e) => setChartField(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                        >
                          <option value="">Select a field...</option>
                          {getChartableFields(reportData).map(field => (
                            <option key={field} value={field}>
                              {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chart Type
                        </label>
                        <div className="flex gap-2">
                          {(['bar', 'pie', 'line'] as const).map(type => (
                            <button
                              key={type}
                              onClick={() => setChartType(type)}
                              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                chartType === type
                                  ? 'bg-green-600 text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      {chartField && (
                        <button
                          onClick={() => addChartToAnalysis(chartField, chartType, `${chartField} ${chartType} Chart`)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <FiBarChart2 className="inline mr-2 h-4 w-4" />
                          Add to Dashboard
                        </button>
                      )}
                    </div>

                    {/* Chart Display */}
                    {chartField && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div style={{ maxWidth: '100%', height: '400px', position: 'relative' }}>
                          {chartType === 'bar' && generateChartData(reportData, chartField, 'bar') && (
                            <Bar
                              data={generateChartData(reportData, chartField, 'bar')}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: 'top' as const },
                                  title: { display: true, text: `${chartField} Distribution`, font: { size: 14, weight: 'bold' } },
                                },
                              }}
                            />
                          )}
                          {chartType === 'pie' && generateChartData(reportData, chartField, 'pie') && (
                            <Pie
                              data={generateChartData(reportData, chartField, 'pie')}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: 'right' as const },
                                  title: { display: true, text: `${chartField} Distribution`, font: { size: 14, weight: 'bold' } },
                                },
                              }}
                            />
                          )}
                          {chartType === 'line' && generateChartData(reportData, chartField, 'line') && (
                            <Line
                              data={generateChartData(reportData, chartField, 'line')}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: 'top' as const },
                                  title: { display: true, text: `${chartField} Trend`, font: { size: 14, weight: 'bold' } },
                                },
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Table Section */}
              {reportData.length === 0 ? (
                <div className="text-center py-12">
                  <FiFileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No data found for the selected criteria</p>
                </div>
              ) : (
                <div className="overflow-auto flex-1">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {Object.keys(reportData[0] || {}).map((key) => (
                          <th
                            key={key}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.map((row: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.values(row).map((value: any, cellIndex: number) => (
                            <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {value === null ? 'N/A' : 
                               typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                               value instanceof Date ? value.toLocaleDateString() :
                               String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Generated on {new Date().toLocaleString()}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const csv = convertToCSV(reportData);
                      downloadCSV(csv, `${selectedTemplate?.name || 'report'}.csv`);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <FiDownload className="inline mr-2 h-4 w-4" />
                    Download CSV
                  </button>
                  <button
                    onClick={() => {
                      setShowDataModal(false);
                      setReportData(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

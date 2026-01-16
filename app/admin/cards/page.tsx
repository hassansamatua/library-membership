'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  FiSearch,
  FiDownload,
  FiPrinter,
  FiEye,
  FiRefreshCw,
  FiFilter,
  FiX,
  FiCheck,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi';

interface MembershipCardData {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  membershipNumber: string;
  membershipType: string;
  joinDate: string;
  expiryDate: string;
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'cancelled';
  membershipStatus: 'active' | 'inactive' | 'expired' | 'suspended';
  amount: number;
  paymentDate: string | null;
  lastPaymentAmount: number;
  profilePicture?: string | null;
}

export default function AdminCardsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<MembershipCardData[]>([]);
  const [filteredCards, setFilteredCards] = useState<MembershipCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MembershipCardData | null>(null);
  const [downloadInProgress, setDownloadInProgress] = useState(false);
  const [printInProgress, setPrintInProgress] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!isAuthLoading && isAuthenticated && !user?.isAdmin) {
      router.push('/dashboard');
      return;
    }
    if (!isAuthLoading && isAuthenticated && user?.isAdmin) {
      fetchMembershipCards();
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  useEffect(() => {
    filterCards();
  }, [cards, searchTerm, statusFilter]);

  const fetchMembershipCards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/cards', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch membership cards');
      const data = await response.json();
      setCards(data.data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast.error('Failed to load membership cards');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCards = () => {
    let filtered = cards;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(card =>
        card.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.membershipNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(card => card.membershipStatus === statusFilter);
    }

    setFilteredCards(filtered);
  };

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedCards.length === filteredCards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(filteredCards.map(card => card.id));
    }
  };

  const handleDownloadCard = async (card: MembershipCardData) => {
    setDownloadInProgress(true);
    try {
      const cardData = `
Membership Card - ${card.membershipNumber}
================================
Name: ${card.userName}
Email: ${card.userEmail}
Membership Type: ${card.membershipType}
Join Date: ${new Date(card.joinDate).toLocaleDateString()}
Expiry Date: ${new Date(card.expiryDate).toLocaleDateString()}
Payment Status: ${card.paymentStatus}
Membership Status: ${card.membershipStatus}
Amount: TZS ${card.lastPaymentAmount?.toLocaleString() || 'N/A'}
      `.trim();

      const blob = new Blob([cardData], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `card-${card.membershipNumber}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Card downloaded successfully');
    } catch (error) {
      console.error('Error downloading card:', error);
      toast.error('Failed to download card');
    } finally {
      setDownloadInProgress(false);
    }
  };

  const handlePrintCard = (card: MembershipCardData) => {
    setPrintInProgress(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups for printing');
        setPrintInProgress(false);
        return;
      }

      const printContent = `
        <html>
          <head>
            <title>Membership Card - ${card.membershipNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .card { 
                border: 2px solid #059669; 
                border-radius: 10px; 
                padding: 30px; 
                max-width: 500px;
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                color: white;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              }
              .card h2 { margin-top: 0; color: #bbf7d0; }
              .card-field { margin: 15px 0; }
              .card-field label { font-weight: bold; color: #bbf7d0; font-size: 12px; }
              .card-field value { display: block; font-size: 16px; }
              .status { 
                display: inline-block; 
                padding: 5px 15px; 
                border-radius: 20px;
                margin-top: 10px;
              }
              .status.active { background: #10b981; color: white; }
              .status.inactive { background: #6b7280; color: white; }
              .status.expired { background: #ef4444; color: white; }
              @media print {
                body { margin: 0; padding: 0; }
                .card { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Tanzania Library Association</h2>
              <h3>Membership Card</h3>
              
              <div class="card-field">
                <label>Card Number:</label>
                <value>${card.membershipNumber}</value>
              </div>
              
              <div class="card-field">
                <label>Member Name:</label>
                <value>${card.userName}</value>
              </div>
              
              <div class="card-field">
                <label>Email:</label>
                <value>${card.userEmail}</value>
              </div>
              
              <div class="card-field">
                <label>Membership Type:</label>
                <value>${card.membershipType}</value>
              </div>
              
              <div class="card-field">
                <label>Join Date:</label>
                <value>${new Date(card.joinDate).toLocaleDateString()}</value>
              </div>
              
              <div class="card-field">
                <label>Expiry Date:</label>
                <value>${new Date(card.expiryDate).toLocaleDateString()}</value>
              </div>
              
              <div class="card-field">
                <label>Payment Status:</label>
                <value>${card.paymentStatus.toUpperCase()}</value>
              </div>
              
              <div class="card-field">
                <span class="status ${card.membershipStatus}">
                  ${card.membershipStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error printing card:', error);
      toast.error('Failed to print card');
    } finally {
      setPrintInProgress(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedCards.length === 0) {
      toast.warning('Please select at least one card');
      return;
    }

    setDownloadInProgress(true);
    try {
      const cardsToDownload = cards.filter(c => selectedCards.includes(c.id));
      const csvContent = [
        ['Membership Number', 'Member Name', 'Email', 'Type', 'Join Date', 'Expiry Date', 'Payment Status', 'Membership Status'],
        ...cardsToDownload.map(c => [
          c.membershipNumber,
          c.userName,
          c.userEmail,
          c.membershipType,
          new Date(c.joinDate).toLocaleDateString(),
          new Date(c.expiryDate).toLocaleDateString(),
          c.paymentStatus,
          c.membershipStatus,
        ])
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `membership-cards-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${selectedCards.length} cards downloaded successfully`);
      setSelectedCards([]);
    } catch (error) {
      console.error('Error downloading cards:', error);
      toast.error('Failed to download cards');
    } finally {
      setDownloadInProgress(false);
    }
  };

  const handleBulkPrint = () => {
    if (selectedCards.length === 0) {
      toast.warning('Please select at least one card');
      return;
    }

    setPrintInProgress(true);
    try {
      const cardsToPrint = cards.filter(c => selectedCards.includes(c.id));
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups for printing');
        setPrintInProgress(false);
        return;
      }

      let htmlContent = `
        <html>
          <head>
            <title>Membership Cards</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .card-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
              .card { 
                border: 2px solid #059669; 
                border-radius: 10px; 
                padding: 20px; 
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                color: white;
                page-break-inside: avoid;
              }
              .card h3 { margin: 0 0 15px 0; color: #bbf7d0; }
              .card-field { margin: 10px 0; }
              .card-field label { font-weight: bold; color: #bbf7d0; font-size: 11px; }
              .card-field value { display: block; font-size: 13px; }
              .status { 
                display: inline-block; 
                padding: 3px 10px; 
                border-radius: 15px;
                font-size: 12px;
                margin-top: 10px;
              }
              .status.active { background: #10b981; }
              .status.inactive { background: #6b7280; }
              .status.expired { background: #ef4444; }
              @media print {
                body { margin: 0; padding: 10px; }
                .card-container { gap: 10px; }
              }
            </style>
          </head>
          <body>
            <h1>Tanzania Library Association - Membership Cards</h1>
            <div class="card-container">
      `;

      cardsToPrint.forEach(card => {
        htmlContent += `
          <div class="card">
            <h3>TLA Card</h3>
            <div class="card-field">
              <label>Card Number:</label>
              <value>${card.membershipNumber}</value>
            </div>
            <div class="card-field">
              <label>Member:</label>
              <value>${card.userName}</value>
            </div>
            <div class="card-field">
              <label>Type:</label>
              <value>${card.membershipType}</value>
            </div>
            <div class="card-field">
              <label>Valid Until:</label>
              <value>${new Date(card.expiryDate).toLocaleDateString()}</value>
            </div>
            <span class="status ${card.membershipStatus}">
              ${card.membershipStatus.toUpperCase()}
            </span>
          </div>
        `;
      });

      htmlContent += `
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      toast.success(`${selectedCards.length} cards prepared for printing`);
    } catch (error) {
      console.error('Error printing cards:', error);
      toast.error('Failed to print cards');
    } finally {
      setPrintInProgress(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <FiCheck className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <FiClock className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
        return <FiAlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FiX className="h-5 w-5 text-gray-600" />;
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Membership Cards Management</h1>
          <p className="text-gray-600 mt-2">View, filter, and manage all user membership cards</p>
        </div>
        <button
          onClick={fetchMembershipCards}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <FiRefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Name, email, or card number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Summary */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <p className="font-medium">Total Cards: {filteredCards.length}</p>
              <p className="text-xs">Selected: {selectedCards.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCards.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              {selectedCards.length} card(s) selected
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleBulkDownload}
                disabled={downloadInProgress}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <FiDownload className="mr-2 h-4 w-4" />
                {downloadInProgress ? 'Downloading...' : 'Download CSV'}
              </button>
              <button
                onClick={handleBulkPrint}
                disabled={printInProgress}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <FiPrinter className="mr-2 h-4 w-4" />
                {printInProgress ? 'Printing...' : 'Print All'}
              </button>
              <button
                onClick={() => setSelectedCards([])}
                className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                <FiX className="mr-2 h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Membership Cards Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="p-12 text-center">
            <FiAlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No membership cards found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCards.length === filteredCards.length && filteredCards.length > 0}
                      onChange={toggleAllSelection}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Card Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCards.includes(card.id)}
                        onChange={() => toggleCardSelection(card.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-green-600">{card.membershipNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{card.userName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{card.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{card.membershipType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{new Date(card.expiryDate).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getPaymentStatusIcon(card.paymentStatus)}
                        <span className="text-sm capitalize">{card.paymentStatus}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(card.membershipStatus)}`}>
                        {card.membershipStatus.charAt(0).toUpperCase() + card.membershipStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCard(card);
                            setShowCardModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Card"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadCard(card)}
                          className="text-green-600 hover:text-green-900"
                          title="Download Card"
                        >
                          <FiDownload className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrintCard(card)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Print Card"
                        >
                          <FiPrinter className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      {showCardModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Membership Card Details</h2>
              <button
                onClick={() => setShowCardModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Card Preview - SVG-based to match user's membership card exactly */}
              <div className="mb-8 flex justify-center">
                <svg width="336" height="212" xmlns="http://www.w3.org/2000/svg" className="rounded-lg shadow-xl overflow-hidden" style={{ borderRadius: '16px', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)' }}>
                  {/* Background with gradient */}
                  <defs>
                    {/* Main gradient: TLA Green */}
                    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#15803d', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#166534', stopOpacity: 1 }} />
                    </linearGradient>
                    
                    {/* Profile picture gradient */}
                    <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#4ade80', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
                    </linearGradient>

                    {/* Green accent gradient */}
                    <linearGradient id="greenAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
                    </linearGradient>

                    {/* Filters for blur effects */}
                    <filter id="blur1">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
                    </filter>
                    <filter id="blur2">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
                    </filter>
                    <filter id="blur3">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>
                    </filter>
                  </defs>
                  
                  {/* Main background */}
                  <rect width="336" height="212" fill="url(#bgGradient)" rx="12" ry="12"/>
                  
                  {/* Background pattern with blur */}
                  <circle cx="276" cy="52" r="40" fill="white" opacity="0.15" filter="url(#blur1)"/>
                  <circle cx="60" cy="160" r="30" fill="white" opacity="0.12" filter="url(#blur2)"/>
                  <circle cx="168" cy="106" r="50" fill="white" opacity="0.08" filter="url(#blur3)"/>
                  
                  {/* Logo background - circular with white */}
                  <circle cx="36" cy="28" r="20" fill="white" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2"/>
                  {/* TLA Logo Text */}
                  <text x="36" y="28" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#059669" textAnchor="middle" dominantBaseline="middle">TLA</text>
                  <text x="36" y="38" fontFamily="Arial, sans-serif" fontSize="6" fill="#059669" textAnchor="middle" fontWeight="600">Logo</text>
                  
                  {/* Organization name */}
                  <text x="168" y="32" fontFamily="Arial" fontSize="12" fontWeight="900" fill="white" textAnchor="middle">Tanzania Library and</text>
                  <text x="168" y="48" fontFamily="Arial" fontSize="12" fontWeight="900" fill="white" textAnchor="middle">Information Association</text>
                  <text x="168" y="62" fontFamily="Arial" fontSize="10" fill="#10b981" textAnchor="middle" fontWeight="600">(TLA)</text>
                  
                  {/* Profile picture with proper fallback */}
                  <g>
                    {/* Profile background circle */}
                    <circle cx="296" cy="32" r="20" fill="white" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2"/>
                    {selectedCard.profilePicture ? (
                      <>
                        <clipPath id="profileClip">
                          <circle cx="296" cy="32" r="19"/>
                        </clipPath>
                        <image
                          href={selectedCard.profilePicture.startsWith('/uploads/') 
                            ? selectedCard.profilePicture 
                            : `/uploads/profile-pictures/${selectedCard.profilePicture?.split('/').pop()}`}
                          x="276"
                          y="12"
                          width="40"
                          height="40"
                          clipPath="url(#profileClip)"
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </>
                    ) : (
                      <>
                        {/* Profile initial fallback */}
                        <circle cx="296" cy="32" r="19" fill="url(#greenAccent)"/>
                        <text x="296" y="32" fontFamily="Arial" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">{selectedCard.userName?.charAt(0)?.toUpperCase() || 'M'}</text>
                      </>
                    )}
                  </g>
                  
                  {/* Member name section */}
                  <text x="70" y="75" fontFamily="Arial, sans-serif" fontSize="8" fill="#10b981" fontWeight="700" letterSpacing="1">MEMBER NAME</text>
                  <text x="70" y="92" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="bold" fill="white">{selectedCard.userName?.substring(0, 20) || 'Member Name'}</text>
                  
                  {/* Membership number (similar to card number) */}
                  <text x="70" y="120" fontFamily="Arial, sans-serif" fontSize="8" fill="#10b981" fontWeight="700" letterSpacing="0.5">MEMBERSHIP No</text>
                  <text x="70" y="138" fontFamily="monospace" fontSize="14" fontWeight="bold" fill="white" letterSpacing="2">{(selectedCard.membershipNumber || 'N/A').substring(0, 16)}</text>
                  
                  {/* Membership type */}
                  <text x="150" y="162" fontFamily="Arial, sans-serif" fontSize="7" fill="#10b981" fontWeight="700">TYPE</text>
                  <text x="150" y="174" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="white">{(selectedCard.membershipType || 'Personal').toUpperCase()}</text>
                  
                  {/* Bottom accent bar with green */}
                  <rect y="192" width="336" height="20" fill="rgba(16, 185, 129, 0.15)"/>
                  <text x="16" y="205" fontFamily="Arial, sans-serif" fontSize="8" fill="rgba(255, 255, 255, 0.7)">Authorized Membership Card • TLA</text>
                </svg>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Card Information</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Email</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedCard.userEmail}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Join Date</dt>
                      <dd className="text-sm font-medium text-gray-900">{new Date(selectedCard.joinDate).toLocaleDateString()}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Expiry Date</dt>
                      <dd className="text-sm font-medium text-gray-900">{new Date(selectedCard.expiryDate).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Payment Information</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Payment Status</dt>
                      <dd className="text-sm font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedCard.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : selectedCard.paymentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedCard.paymentStatus.toUpperCase()}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Last Payment Amount</dt>
                      <dd className="text-sm font-medium text-gray-900">TZS {selectedCard.lastPaymentAmount?.toLocaleString() || 'N/A'}</dd>
                    </div>
                    {selectedCard.paymentDate && (
                      <div>
                        <dt className="text-xs text-gray-500 uppercase">Payment Date</dt>
                        <dd className="text-sm font-medium text-gray-900">{new Date(selectedCard.paymentDate).toLocaleDateString()}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex space-x-3 justify-end">
              <button
                onClick={() => setShowCardModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownloadCard(selectedCard);
                  setShowCardModal(false);
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FiDownload className="mr-2 h-4 w-4" />
                Download
              </button>
              <button
                onClick={() => {
                  handlePrintCard(selectedCard);
                  setShowCardModal(false);
                }}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <FiPrinter className="mr-2 h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

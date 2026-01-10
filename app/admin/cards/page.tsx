'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiDownload, FiSearch, FiFilter, FiUser, FiCreditCard, FiPrinter, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Member {
  id: string;
  name: string;
  email: string;
  membershipNumber?: string;
  membership_number?: string;
  status: 'active' | 'inactive' | 'pending' | 'Active' | 'Inactive' | 'Pending';
  cardIssued?: boolean;
  lastUpdated?: string;
  created_at?: string;
  updated_at?: string;
  phone?: string;
  profile?: {
    phone?: string;
    contactInfo?: string | {
      phone?: string;
      [key: string]: any;
    };
    membershipInfo?: {
      membershipNumber?: string;
      membershipType?: string;
      membershipStatus?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  contact_info?: string | {
    phone?: string;
    [key: string]: any;
  };
  membership_info?: string | {
    membershipNumber?: string;
    membershipType?: string;
    membershipStatus?: string;
    [key: string]: any;
  };
  [key: string]: any;
};

export default function CardManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Function to generate mock data
  const useMockData = () => {
    const mockMembers: Member[] = [
      { id: 'user-1', name: 'Abbas Omar Ali', email: 'abbasamo@gmail.com', membershipNumber: 'TLA2691594', status: 'active', cardIssued: true, lastUpdated: '2026-01-08' },
      { id: 'user-2', name: 'John Doe', email: 'john.doe@example.com', membershipNumber: 'TLA1234567', status: 'active', cardIssued: true, lastUpdated: '2026-01-07' },
      { id: 'user-3', name: 'Jane Smith', email: 'jane.smith@example.com', membershipNumber: 'TLA2345678', status: 'inactive', cardIssued: false, lastUpdated: '2026-01-06' },
      { id: 'user-4', name: 'Bob Johnson', email: 'bob.johnson@example.com', membershipNumber: 'TLA3456789', status: 'pending', cardIssued: false, lastUpdated: '2026-01-05' },
      { id: 'user-5', name: 'Alice Williams', email: 'alice.williams@example.com', membershipNumber: 'TLA4567890', status: 'active', cardIssued: true, lastUpdated: '2026-01-04' },
      { id: 'user-11', name: 'Member 11', email: 'member11@example.com', membershipNumber: 'TLA' + Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7), status: 'pending', cardIssued: true, lastUpdated: '2025-12-13' },
      { id: 'user-12', name: 'Member 12', email: 'member12@example.com', membershipNumber: 'TLA' + Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7), status: 'inactive', cardIssued: true, lastUpdated: '2026-01-10' },
      { id: 'user-13', name: 'Member 13', email: 'member13@example.com', membershipNumber: 'TLA' + Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7), status: 'pending', cardIssued: true, lastUpdated: '2025-12-13' },
      { id: 'user-14', name: 'Member 14', email: 'member14@example.com', membershipNumber: 'TLA' + Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7), status: 'inactive', cardIssued: true, lastUpdated: '2025-12-19' },
      { id: 'user-15', name: 'Member 15', email: 'member15@example.com', membershipNumber: 'TLA' + Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7), status: 'inactive', cardIssued: true, lastUpdated: '2025-12-25' }
    ];
    setMembers(mockMembers);
  };

  // Fetch members from API or use mock data
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const users = await response.json();
          
          // Transform the API response to match our Member interface
          const membersFromDb = users.map((user: any) => {
            // Extract phone number from various possible locations
            let phone = '';
            if (user.phone) {
              phone = user.phone;
            } else if (user.profile?.phone) {
              phone = user.profile.phone;
            } else if (user.contact_info) {
              try {
                const contactInfo = typeof user.contact_info === 'string' 
                  ? JSON.parse(user.contact_info)
                  : user.contact_info;
                phone = contactInfo.phone || '';
              } catch (e) {
                console.error('Error parsing contact info:', e);
              }
            }

            // Extract membership number from various possible locations
            let membershipNumber = '';
            if (user.membershipNumber) {
              membershipNumber = user.membershipNumber;
            } else if (user.membership_number) {
              membershipNumber = user.membership_number;
            } else if (user.profile?.membershipInfo?.membershipNumber) {
              membershipNumber = user.profile.membershipInfo.membershipNumber;
            } else if (user.membership_info) {
              try {
                const membershipInfo = typeof user.membership_info === 'string'
                  ? JSON.parse(user.membership_info)
                  : user.membership_info;
                membershipNumber = membershipInfo.membershipNumber || '';
              } catch (e) {
                console.error('Error parsing membership info:', e);
              }
            }

            // Ensure status is lowercase for consistency
            const status = user.status ? user.status.toLowerCase() : 'pending';
            
            return {
              id: user.id.toString(),
              name: user.name || 'Unknown User',
              email: user.email || '',
              membershipNumber: membershipNumber || `TLA${Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)}`,
              status: status as 'active' | 'inactive' | 'pending',
              cardIssued: !!membershipNumber, // Assume card is issued if we have a membership number
              lastUpdated: user.updated_at || user.created_at || new Date().toISOString().split('T')[0],
              phone: phone,
              contact_info: user.contact_info,
              profile: user.profile,
              membership_info: user.membership_info
            };
          });

          setMembers(membersFromDb);
        } else {
          console.warn('API returned non-OK status, falling back to mock data');
          useMockData();
        }
      } catch (error) {
        console.error('Error fetching members, using mock data instead:', error);
        useMockData();
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.membershipNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const toggleSelectCard = (memberId: string) => {
    setSelectedCards(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAllCards = () => {
    if (selectedCards.length === filteredMembers.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(filteredMembers.map(member => member.id));
    }
  };

  const downloadCard = async (memberId: string) => {
    try {
      // Find the member in the current list to avoid an extra API call
      const member = members.find(m => m.id === memberId);
      
      if (!member) {
        throw new Error('Member not found');
      }
      
      // Format phone number or use placeholder
      const phoneNumber = getMemberPhone(member);
      
      // Create a canvas element to generate the card as an image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size (credit card dimensions: 85.6mm × 53.98mm)
      canvas.width = 1680; // 5x scale for better quality
      canvas.height = 1060;

      // Enable color preservation for download
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.globalCompositeOperation = 'source-over';

      // Draw card background with exact green gradient matching screen
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#15803d'); // green-700 (exact match)
      gradient.addColorStop(0.5, '#16a34a'); // green-600 (exact match)
      gradient.addColorStop(1, '#166534'); // green-800 (exact match)
      ctx.fillStyle = gradient;
      
      // Draw rounded rectangle for card
      const cornerRadius = 60; // 5x the border radius
      ctx.beginPath();
      ctx.moveTo(cornerRadius, 0);
      ctx.lineTo(canvas.width - cornerRadius, 0);
      ctx.quadraticCurveTo(canvas.width, 0, canvas.width, cornerRadius);
      ctx.lineTo(canvas.width, canvas.height - cornerRadius);
      ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - cornerRadius, canvas.height);
      ctx.lineTo(cornerRadius, canvas.height);
      ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - cornerRadius);
      ctx.lineTo(0, cornerRadius);
      ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
      ctx.closePath();
      ctx.fill();

      // Draw background pattern with exact opacity matching screen and blur effects
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = 'white';
      // Top-right circle - exact positioning with blur
      ctx.beginPath();
      ctx.arc(canvas.width - 800, 400, 400, 0, Math.PI * 2);
      ctx.fill();
      
      // Bottom-left circle - exact positioning with blur
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.arc(400, canvas.height - 600, 300, 0, Math.PI * 2);
      ctx.fill();
      
      // Center circle - exact positioning with blur
      ctx.globalAlpha = 0.08;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 500, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Draw logo background - circular
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 50;
      ctx.shadowOffsetX = 10;
      ctx.shadowOffsetY = 10;
      ctx.beginPath();
      ctx.arc(360, 280, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw logo image if available, otherwise use text
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = '/logo.png';
      
      // Create a promise to handle logo loading
      const drawLogo = new Promise<void>((resolve) => {
        if (logoImg.complete) {
          drawLogoImage();
          resolve();
        } else {
          logoImg.onload = () => {
            drawLogoImage();
            resolve();
          };
          logoImg.onerror = () => {
            // Fallback to text logo
            ctx.fillStyle = '#15803d';
            ctx.font = 'bold 200px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('TLA', 360, 280);
            resolve();
          };
        }
      });

      const drawLogoImage = () => {
        // Create a clipping path for the logo
        ctx.save();
        ctx.beginPath();
        ctx.arc(360, 280, 200, 0, Math.PI * 2);
        ctx.clip();
        
        // Draw the logo image centered in the circle
        const logoSize = 400;
        const logoX = 360 - (logoSize / 2);
        const logoY = 280 - (logoSize / 2);
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      };

      // Draw organization name and text
      const drawText = () => {
        // Organization name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 160px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Tanzania Library and', canvas.width / 2, 160);
        ctx.fillText('Information Association', canvas.width / 2, 320);
        
        ctx.font = '120px Arial';
        ctx.fillStyle = '#bbf7d0';
        ctx.fillText('(TLA)', canvas.width / 2, 440);

        // Member name label
        ctx.font = '60px Arial';
        ctx.fillStyle = '#bbf7d0';
        ctx.textAlign = 'left';
        ctx.fillText('MEMBER NAME', 100, 580);
        
        // Member name value
        ctx.font = 'bold 100px Arial';
        ctx.fillStyle = 'white';
        // Truncate name if too long to fit on the card
        const displayName = member.name || 'Member Name';
        const maxNameLength = 20; // Maximum characters to display
        const truncatedName = displayName.length > maxNameLength 
          ? displayName.substring(0, maxNameLength - 3) + '...' 
          : displayName;
        ctx.fillText(truncatedName, 100, 700);
        
        // Membership number
        ctx.font = '60px Arial';
        ctx.fillStyle = '#bbf7d0';
        ctx.fillText('MEMBERSHIP No:', 100, 840);
        
        ctx.font = 'bold 100px monospace';
        ctx.fillStyle = 'white';
        ctx.fillText(member.membershipNumber || 'N/A', 100, 960);
        
        // Phone number
        ctx.font = '60px Arial';
        ctx.fillStyle = '#bbf7d0';
        ctx.textAlign = 'right';
        ctx.fillText('PHONE:', canvas.width - 100, 840);
        
        ctx.font = 'bold 100px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(phoneNumber, canvas.width - 100, 960);
        
        // Member type
        ctx.font = '60px Arial';
        ctx.fillStyle = '#bbf7d0';
        ctx.textAlign = 'left';
        ctx.fillText('TYPE:', 100, 1100);
        
        ctx.font = 'bold 100px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(member.status === 'active' ? 'Active' : 'Inactive', 100, 1220);
        
        // Chairman signature
        ctx.font = '60px Arial';
        ctx.fillStyle = '#bbf7d0';
        ctx.textAlign = 'right';
        ctx.fillText('CHAIRMAN:', canvas.width - 100, 1100);
        
        ctx.font = 'bold 100px Arial';
        ctx.font = 'italic 100px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Dr. A. M. Kimaro', canvas.width - 100, 1220);
        
        // Bottom strip
        const stripGradient = ctx.createLinearGradient(0, canvas.height - 400, 0, canvas.height);
        stripGradient.addColorStop(0, '#14532d'); // green-900 (exact match)
        stripGradient.addColorStop(1, '#052e16'); // green-950 (exact match)
        ctx.fillStyle = stripGradient;
        ctx.globalAlpha = 0.8; // exact opacity
        ctx.fillRect(0, canvas.height - 200, canvas.width, 200);
        ctx.globalAlpha = 1;
      };

      // Wait for logo to load before drawing text
      await drawLogo;
      drawText();

      // Convert to image and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `tla-membership-card-${member.membershipNumber || member.id}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // Show success message
          alert('Membership card downloaded successfully!');
        }
      }, 'image/png', 1.0);
      
    } catch (error) {
      console.error('Error downloading card:', error);
      alert('Failed to download membership card. Please try again.');
    }
  };

  const downloadSelectedCards = () => {
    if (selectedCards.length === 0) return;
    console.log('Downloading cards for members:', selectedCards);
    // Implement bulk download logic
    // window.open(`/api/admin/cards/bulk-download?ids=${selectedCards.join(',')}`, '_blank');
  };

  const [selectedCard, setSelectedCard] = useState<Member | null>(null);

  const viewMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setSelectedCard(member);
    }
  };

  const closeCardModal = () => {
    setSelectedCard(null);
  };

  // Format the phone number for display
  const formatPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return '+255 XXX XXX XXX';
    
    // If it's already formatted or a placeholder, return as is
    if (phone.includes('XXX') || phone.includes(' ')) return phone;
    
    // Remove all non-digit characters
    const cleaned = ('' + phone).replace(/\D/g, '');
    
    // Check if the number starts with 255 (Tanzania)
    if (cleaned.startsWith('255') && cleaned.length === 12) {
      return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
    }
    
    // Check if the number starts with 0 (local format)
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+255 ${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    }
    
    // If it's a different format, just return the original
    return phone;
  };
  
  // Helper function to get phone number from member data
  const getMemberPhone = (member: Member): string => {
    if (member.phone) return formatPhoneNumber(member.phone);
    if (member.profile?.phone) return formatPhoneNumber(member.profile.phone);
    if (member.contact_info) {
      try {
        const contactInfo = typeof member.contact_info === 'string' 
          ? JSON.parse(member.contact_info) 
          : member.contact_info;
        if (contactInfo?.phone) return formatPhoneNumber(contactInfo.phone);
      } catch (e) {
        console.error('Error parsing contact info:', e);
      }
    }
    return '+255 XXX XXX XXX';
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Card Management</h1>
          <p className="text-gray-600">Manage and download member ID cards</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button 
            variant="outline" 
            onClick={downloadSelectedCards}
            disabled={selectedCards.length === 0}
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Download Selected ({selectedCards.length})
          </Button>
          <Button>
            <FiPrinter className="mr-2 h-4 w-4" />
            Print All
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search members..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <FiFilter className="h-5 w-5 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-end">
              <span className="text-sm text-gray-500">
                {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'} found
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  checked={selectedCards.length === filteredMembers.length && filteredMembers.length > 0}
                  onChange={selectAllCards}
                />
              </TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Membership #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Card Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      checked={selectedCards.includes(member.id)}
                      onChange={() => toggleSelectCard(member.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </TableCell>
                  <TableCell className="font-mono">{member.membershipNumber}</TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.cardIssued 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.cardIssued ? 'Issued' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{member.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-600 hover:text-green-800"
                        onClick={() => viewMember(member.id)}
                        title="View Membership Card"
                      >
                        <FiCreditCard className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => downloadCard(member.id)}
                      >
                        <FiDownload className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No members found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      </div>

      {/* Membership Card Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Membership Card</h3>
                <button 
                  onClick={closeCardModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              {/* Membership Card */}
              <div className="relative">
                <div className="relative mx-auto" style={{ width: '336px', height: '212px' }}>
                  <svg width="336" height="212" xmlns="http://www.w3.org/2000/svg" className="rounded-lg shadow-xl overflow-hidden" style={{ borderRadius: '12px' }}>
                    {/* Background with gradient */}
                    <defs>
                      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#15803d', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#166534', stopOpacity: 1 }} />
                      </linearGradient>
                      <linearGradient id="stripGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#14532d', stopOpacity: 0.8 }} />
                        <stop offset="100%" style={{ stopColor: '#052e16', stopOpacity: 0.8 }} />
                      </linearGradient>
                      <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#4ade80', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
                      </linearGradient>
                      <filter id="blur1">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
                      </filter>
                      <filter id="blur2">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
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
                    
                    {/* Logo background - circular */}
                    <circle cx="36" cy="32" r="28" fill="white" stroke="none"/>
                    <defs>
                      <clipPath id="logoClip">
                        <circle cx="36" cy="32" r="28"/>
                      </clipPath>
                    </defs>
                    <image x="8" y="4" width="56" height="56" href="/logo.png" clipPath="url(#logoClip)" style={{ imageRendering: 'crisp-edges' }}/>
                    
                    {/* Organization name */}
                    <text x="168" y="32" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">Tanzania Library and</text>
                    <text x="168" y="48" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">Information Association</text>
                    <text x="168" y="62" fontFamily="Arial" fontSize="12" fill="#bbf7d0" textAnchor="middle">(TLA)</text>
                    
                    {/* Profile picture - circular */}
                    <circle cx="296" cy="32" r="28" fill="url(#profileGradient)" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
                    <text x="296" y="32" fontFamily="Arial" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">
                      {selectedCard.name?.charAt(0)?.toUpperCase() || 'M'}
                    </text>
                    
                    {/* Member name */}
                    <text x="20" y="92" fontFamily="Arial" fontSize="10" fill="#bbf7d0">MEMBER NAME</text>
                    <text x="20" y="106" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="white">{selectedCard.name || 'Member Name'}</text>
                    
                    {/* Membership number and phone */}
                    <text x="20" y="128" fontFamily="Arial" fontSize="10" fill="#bbf7d0">MEMBERSHIP No:</text>
                    <text x="20" y="142" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="white">
                      {selectedCard.membershipNumber || 'N/A'}
                    </text>
                    
                    <text x="316" y="128" fontFamily="Arial" fontSize="10" fill="#bbf7d0" textAnchor="end">PHONE:</text>
                    <text x="316" y="142" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="white" textAnchor="end">
                      {getMemberPhone(selectedCard)}
                    </text>
                    
                    {/* Type and signature */}
                    <text x="20" y="164" fontFamily="Arial" fontSize="10" fill="#bbf7d0">TYPE:</text>
                    <text x="20" y="178" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="white">
                      {selectedCard.status === 'active' ? 'Active' : 'Inactive'}
                    </text>
                    
                    {/* Chairman signature */}
                    <text x="316" y="164" fontFamily="Arial" fontSize="10" fill="#bbf7d0" textAnchor="end">CHAIRMAN:</text>
                    <text x="316" y="178" fontFamily="Arial" fontSize="12" fontWeight="bold" fontStyle="italic" fill="white" textAnchor="end">
                      Dr. A. M. Kimaro
                    </text>
                    
                    {/* Card strip */}
                    <rect x="0" y="192" width="336" height="20" fill="url(#stripGradient)"/>
                  </svg>
                </div>

                {/* Card Actions */}
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      downloadCard(selectedCard.id);
                      closeCardModal();
                    }}
                  >
                    <FiDownload className="mr-2 h-4 w-4" />
                    Download Card
                  </Button>
                  
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => {
                      const printWindow = window.open('', '', 'width=800,height=600');
                      if (printWindow) {
                        const cardHtml = `
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <title>Membership Card - ${selectedCard.name}</title>
                            <style>
                              @media print {
                                @page { margin: 0; size: auto; }
                                body { margin: 1.6cm; }
                              }
                            </style>
                          </head>
                          <body>
                            ${document.querySelector('.relative > div')?.outerHTML || ''}
                            <script>
                              window.onload = function() {
                                window.print();
                                setTimeout(function() { window.close(); }, 100);
                              };
                            </script>
                          </body>
                          </html>
                        `;
                        printWindow.document.open();
                        printWindow.document.write(cardHtml);
                        printWindow.document.close();
                      }
                    }}
                  >
                    <FiPrinter className="mr-2 h-4 w-4" />
                    Print Card
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

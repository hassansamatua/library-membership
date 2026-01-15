"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FiDownload, FiShare2, FiPrinter, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';

interface MembershipStatus {
  success: boolean;
  cycle?: {
    year: number;
    startDate: string;
    dueDate: string;
    expiryDate: string;
  };
  membership?: {
    membershipNumber: string;
    membershipType: string;
    status: string;
    paymentStatus: string;
    joinedDate: string;
    expiryDate: string;
    amountPaid: number | string;
  } | null;
  canAccessIdCard?: boolean;
}

export default function MembershipCardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadMembershipStatus = async () => {
    try {
      const res = await fetch('/api/membership/status', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMembershipStatus(data);
        console.log('🔍 Membership Card - Refreshed membership status:', data);
      } else {
        setError('Failed to load membership status');
      }
    } catch (err) {
      setError('Error loading membership status');
      console.error('Error loading membership status:', err);
    } finally {
      setLoading(false);
    }
  };

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1); // Force re-render
    loadMembershipStatus(); // Reload data
  };

  useEffect(() => {
    loadMembershipStatus();
  }, [refreshKey]);

  const handleDownload = () => {
    // Create a canvas element to generate the card as an image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (credit card dimensions: 85.6mm × 53.98mm)
    canvas.width = 856; // 10x scale for better quality
    canvas.height = 540;

    // Enable color preservation for download
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalCompositeOperation = 'source-over';

    // Draw card background with exact green-700 gradient matching screen
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#15803d'); // green-700 (exact match)
    gradient.addColorStop(0.5, '#16a34a'); // green-600 (exact match)
    gradient.addColorStop(1, '#166534'); // green-800 (exact match)
    ctx.fillStyle = gradient;
    
    // Draw rounded rectangle for card
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 20);
    ctx.fill();

    // Draw background pattern with exact opacity matching screen and blur effects
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = 'white';
    // Top-right circle - exact positioning with blur
    ctx.beginPath();
    ctx.arc(canvas.width - 160, 160, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.12;
    // Bottom-left circle - exact positioning with blur
    ctx.beginPath();
    ctx.arc(120, canvas.height - 120, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.08;
    // Center circle - exact positioning with blur
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw logo background - circular
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(72, 56, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Create clipping path for circular logo
    ctx.save();
    ctx.beginPath();
    ctx.arc(72, 56, 40, 0, Math.PI * 2);
    ctx.clip();

    // Draw actual logo image if available
    const logoImg = new Image();
    logoImg.onload = () => {
      ctx.drawImage(logoImg, 32, 16, 80, 80);
      ctx.restore();
      drawCardContent();
    };
    logoImg.onerror = () => {
      // Fallback to text logo
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TLA', 72, 56);
      ctx.restore();
      drawCardContent();
    };
    logoImg.src = '/logo.png';

    function drawCardContent() {
      // Draw organization name - exact positioning and colors
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Tanzania Library and', canvas.width / 2, 64);
      ctx.fillText('Information Association', canvas.width / 2, 96);
      
      ctx.font = '24px Arial';
      ctx.fillStyle = '#bbf7d0'; // green-100 (exact match)
      ctx.fillText('(TLA)', canvas.width / 2, 124);

      // Draw profile picture background - exact white
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      ctx.arc(canvas.width - 80, 80, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Create clipping path for circular profile picture
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvas.width - 80, 80, 40, 0, Math.PI * 2);
      ctx.clip();

      // Draw profile picture image if available
      if (user?.profile?.personalInfo?.profilePicture) {
        const profileImg = new Image();
        profileImg.onload = () => {
          ctx.drawImage(profileImg, canvas.width - 120, 40, 80, 80);
          ctx.restore();
        };
        profileImg.src = user.profile.personalInfo.profilePicture;
      } else {
        // Draw profile picture or initial - exact colors
        ctx.fillStyle = '#4ade80'; // green-400 (exact match)
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(user?.name?.charAt(0)?.toUpperCase() || 'M', canvas.width - 80, 80);
        ctx.restore();
      }

      // Draw member name section - exact positioning
      ctx.fillStyle = '#bbf7d0'; // green-100 (exact match)
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('MEMBER NAME', 80, 184);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(user?.name || 'Member Name', 80, 212);

      // Draw membership number and phone - exact colors
      ctx.fillStyle = '#bbf7d0'; // green-100 (exact match)
      ctx.font = '20px Arial';
      ctx.fillText('MEMBERSHIP No:', 80, 256);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(user?.membershipNumber || membershipStatus?.membership?.membershipNumber || 'N/A', 80, 284);

      ctx.fillStyle = '#bbf7d0'; // green-100 (exact match)
      ctx.font = '20px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('PHONE:', canvas.width - 80, 256);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      const phone = (user?.profile as any)?.phone || JSON.parse((user?.profile as any)?.contact_info || '{}')?.phone || '+255 XXX XXX XXX';
      ctx.fillText(phone, canvas.width - 80, 284);

      // Draw type and chairman signature - exact colors
      ctx.fillStyle = '#bbf7d0'; // green-100 (exact match)
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('TYPE:', 80, 328);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(membershipStatus?.membership?.membershipType || 'Personal', 80, 352);

      // Draw signature line - exact color and opacity
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // exact match
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width - 250, 344);
      ctx.lineTo(canvas.width - 80, 344);
      ctx.stroke();

      ctx.fillStyle = '#bbf7d0'; // green-100 (exact match)
      ctx.font = '20px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('CHAIRMAN:', canvas.width - 80, 328);
      
      ctx.fillStyle = 'white';
      ctx.font = 'italic 24px Arial';
      ctx.fillText('Dr. A. M. Kimaro', canvas.width - 80, 352);

      // Draw card details strip - exact colors and opacity
      const stripGradient = ctx.createLinearGradient(0, canvas.height - 80, 0, canvas.height);
      stripGradient.addColorStop(0, '#14532d'); // green-900 (exact match)
      stripGradient.addColorStop(1, '#052e16'); // green-950 (exact match)
      ctx.fillStyle = stripGradient;
      ctx.globalAlpha = 0.8; // exact opacity
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
      ctx.globalAlpha = 1;

      // Convert to image and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `membership-card-${user?.membershipNumber || membershipStatus?.membership?.membershipNumber || 'member'}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 1.0);
    }
  };

  const handlePrint = () => {
    // Create a print-specific version with SVG for better color preservation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for printing');
      return;
    }

    const phone = (() => {
      const phone1 = (user?.profile as any)?.phone;
      const contactInfo = (user?.profile as any)?.contact_info;
      let phone2 = null;
      try {
        phone2 = JSON.parse(contactInfo || '{}')?.phone;
      } catch (e) {
        return '+255 XXX XXX XXX';
      }
      return phone1 || phone2 || '+255 XXX XXX XXX';
    })();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TLA Membership Card</title>
        <style>
          @page {
            size: auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: white;
            font-family: Arial, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .card-container {
            width: 336px;
            height: 212px;
            position: relative;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="card-container">
          <svg width="336" height="212" xmlns="http://www.w3.org/2000/svg" style="border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
            <!-- Background with gradient -->
            <defs>
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#15803d;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#16a34a;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#166534;stop-opacity:1" />
              </linearGradient>
              <linearGradient id="stripGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#14532d;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#052e16;stop-opacity:0.8" />
              </linearGradient>
              <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#4ade80;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#22c55e;stop-opacity:1" />
              </linearGradient>
            </defs>
            
            <!-- Main background -->
            <rect width="336" height="212" fill="url(#bgGradient)" rx="12" ry="12"/>
            
            <!-- Background pattern with blur -->
            <defs>
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
            <circle cx="276" cy="52" r="40" fill="white" opacity="0.15" filter="url(#blur1)"/>
            <circle cx="60" cy="160" r="30" fill="white" opacity="0.12" filter="url(#blur2)"/>
            <circle cx="168" cy="106" r="50" fill="white" opacity="0.08" filter="url(#blur3)"/>
            
            <!-- Logo background - circular -->
            <circle cx="36" cy="28" r="20" fill="white" stroke="none"/>
            <text x="36" y="28" font-family="Arial" font-size="20" font-weight="bold" fill="#15803d" text-anchor="middle" dominant-baseline="middle">TLA</text>
            
            <!-- Organization name -->
            <text x="168" y="32" font-family="Arial" font-size="12" font-weight="bold" fill="white" text-anchor="middle">Tanzania Library and</text>
            <text x="168" y="48" font-family="Arial" font-size="12" font-weight="bold" fill="white" text-anchor="middle">Information Association</text>
            <text x="168" y="62" font-family="Arial" font-size="12" fill="#bbf7d0" text-anchor="middle">(TLA)</text>
            
            <!-- Profile picture -->
            <circle cx="296" cy="32" r="20" fill="white" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
            <circle cx="296" cy="32" r="20" fill="url(#profileGradient)"/>
            <text x="296" y="32" font-family="Arial" font-size="20" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${user?.name?.charAt(0)?.toUpperCase() || 'M'}</text>
            
            <!-- Member name -->
            <text x="20" y="92" font-family="Arial" font-size="10" fill="#bbf7d0">MEMBER NAME</text>
            <text x="20" y="106" font-family="Arial" font-size="12" font-weight="bold" fill="white">${user?.name || 'Member Name'}</text>
            
            <!-- Membership number and phone -->
            <text x="20" y="128" font-family="Arial" font-size="10" fill="#bbf7d0">MEMBERSHIP No:</text>
            <text x="20" y="142" font-family="Arial" font-size="12" font-weight="bold" fill="white" font-family="monospace">${user?.membershipNumber || membershipStatus?.membership?.membershipNumber || 'N/A'}</text>
            
            <text x="316" y="128" font-family="Arial" font-size="10" fill="#bbf7d0" text-anchor="end">PHONE:</text>
            <text x="316" y="142" font-family="Arial" font-size="12" font-weight="bold" fill="white" text-anchor="end">${phone}</text>
            
            <!-- Type and signature -->
            <text x="20" y="164" font-family="Arial" font-size="10" fill="#bbf7d0">TYPE:</text>
            <text x="20" y="178" font-family="Arial" font-size="12" font-weight="bold" fill="white">${membershipStatus?.membership?.membershipType || 'Personal'}</text>
            
            <!-- Signature line -->
            <line x1="250" y1="172" x2="316" y1="172" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
            <text x="316" y="164" font-family="Arial" font-size="10" fill="#bbf7d0" text-anchor="end">CHAIRMAN:</text>
            <text x="316" y="178" font-family="Arial" font-size="12" font-weight="bold" font-style="italic" fill="white" text-anchor="end">Dr. A. M. Kimaro</text>
            
            <!-- Card strip -->
            <rect x="0" y="192" width="336" height="20" fill="url(#stripGradient)"/>
          </svg>
        </div>
        
        <script>
          // Auto print and close
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TLA Membership Card',
          text: `Check out my Tanzania Library Association membership card! Member #${membershipStatus?.membership?.membershipNumber}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !membershipStatus?.success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Membership Card</h2>
          <p className="text-gray-600 mb-4">{error || 'Unable to load membership information'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!membershipStatus?.canAccessIdCard) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <FiX className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Membership Card Not Available</h2>
          <p className="text-gray-600 mb-4">
            Your membership card is not available because your membership payment is not active.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard/subscribe')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Make Payment
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Inline Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the card */
          body * {
            visibility: hidden;
          }
          
          .membership-card-container,
          .membership-card-container * {
            visibility: visible;
          }
          
          .membership-card-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: white;
          }
          
          /* Ensure card maintains exact colors when printed */
          .card-gradient {
            background: linear-gradient(135deg, #15803d 0%, #16a34a 50%, #166534 100%) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .card-text-white {
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .card-text-green-100 {
            color: #bbf7d0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .card-logo-bg {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .card-profile-bg {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .card-profile-fallback {
            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .card-strip {
            background: linear-gradient(90deg, #14532d 0%, #052e16 100%) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .card-shadow {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .card-pattern {
            opacity: 0.2 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .card-border {
            border: 2px solid rgba(255, 255, 255, 0.2) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .card-signature-line {
            border-top: 2px solid rgba(255, 255, 255, 0.4) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hide buttons and actions when printing */
          .card-actions,
          .card-actions * {
            display: none !important;
          }
          
          /* Ensure proper page setup */
          @page {
            size: auto;
            margin: 0;
          }
          
          @page :left {
            margin: 0;
          }
          
          @page :right {
            margin: 0;
          }
          
          /* High quality printing */
          .membership-card {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            image-rendering: pixelated;
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Membership Card</h1>
              <button
                onClick={forceRefresh}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Refresh Status
              </button>
            </div>
            <p className="mt-2 text-gray-600">Your official Tanzania Library Association membership card</p>
          </div>

          {/* Membership Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 membership-card-container">
            <div className="relative">
              {/* Standard Credit Card Size (85.6mm × 53.98mm) */}
              <div className="relative mx-auto membership-card" style={{ width: '336px', height: '212px' }}>
                {/* Card Design - SVG-based to match print version exactly */}
                <svg width="336" height="212" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 rounded-lg shadow-xl overflow-hidden" style={{ borderRadius: '12px' }}>
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
                  
                  {/* Background pattern with blur - simplified design */}
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
                  <circle cx="296" cy="32" r="28" fill="white" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
                  <defs>
                    <clipPath id="profileClip">
                      <circle cx="296" cy="32" r="28"/>
                    </clipPath>
                  </defs>
                  {user?.profile?.personalInfo?.profilePicture ? (
                    <image x="268" y="4" width="56" height="56" href={user.profile.personalInfo.profilePicture} clipPath="url(#profileClip)" style={{ imageRendering: 'crisp-edges' }}/>
                  ) : (
                    <circle cx="296" cy="32" r="28" fill="url(#profileGradient)"/>
                  )}
                  {!user?.profile?.personalInfo?.profilePicture && (
                    <text x="296" y="32" fontFamily="Arial" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">{user?.name?.charAt(0)?.toUpperCase() || 'M'}</text>
                  )}
                  
                  {/* Member name */}
                  <text x="20" y="92" fontFamily="Arial" fontSize="10" fill="#bbf7d0">MEMBER NAME</text>
                  <text x="20" y="106" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="white">{user?.name || 'Member Name'}</text>
                  
                  {/* Membership number and phone */}
                  <text x="20" y="128" fontFamily="Arial" fontSize="10" fill="#bbf7d0">MEMBERSHIP No:</text>
                  <text x="20" y="142" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="white" style={{ fontFamily: 'monospace' }}>{user?.membershipNumber || membershipStatus?.membership?.membershipNumber || 'N/A'}</text>
                  
                  <text x="316" y="128" fontFamily="Arial" fontSize="10" fill="#bbf7d0" textAnchor="end">PHONE:</text>
                  <text x="316" y="142" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="white" textAnchor="end">
                    {(() => {
                      const phone1 = (user?.profile as any)?.phone;
                      const contactInfo = (user?.profile as any)?.contact_info;
                      let phone2 = null;
                      try {
                        phone2 = JSON.parse(contactInfo || '{}')?.phone;
                      } catch (e) {
                        return '+255 XXX XXX XXX';
                      }
                      return phone1 || phone2 || '+255 XXX XXX XXX';
                    })()}
                  </text>
                  
                  {/* Type and signature */}
                  <text x="20" y="164" fontFamily="Arial" fontSize="10" fill="#bbf7d0">TYPE:</text>
                  <text x="20" y="178" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="white">{membershipStatus?.membership?.membershipType || 'Personal'}</text>
                  
                  {/* Chairman signature - no line */}
                  <text x="316" y="164" fontFamily="Arial" fontSize="10" fill="#bbf7d0" textAnchor="end">CHAIRMAN:</text>
                  <text x="316" y="178" fontFamily="Arial" fontSize="12" fontWeight="bold" fontStyle="italic" fill="white" textAnchor="end">Dr. A. M. Kimaro</text>
                  
                  {/* Card strip */}
                  <rect x="0" y="192" width="336" height="20" fill="url(#stripGradient)"/>
                </svg>
              </div>

              {/* Card Actions */}
              <div className="mt-6 flex flex-wrap gap-3 justify-center card-actions">
                <button
                  onClick={handleDownload}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <FiDownload className="mr-2 h-4 w-4" />
                  Download Card
                </button>
                
                <button
                  onClick={handlePrint}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FiPrinter className="mr-2 h-4 w-4" />
                  Print Card
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <FiShare2 className="mr-2 h-4 w-4" />
                  Share Card
                </button>
              </div>
            </div>
          </div>

          {/* Card Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Card Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Membership Details</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Status:</dt>
                    <dd className="font-medium text-green-600">Active</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Member Since:</dt>
                    <dd className="font-medium">
                      {new Date(membershipStatus?.membership?.joinedDate || '').toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Cycle:</dt>
                    <dd className="font-medium">{membershipStatus?.cycle?.year}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Valid Until:</dt>
                    <dd className="font-medium">
                      {new Date(membershipStatus?.membership?.expiryDate || '').toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Usage Instructions</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Present this card for member benefits at libraries</li>
                  <li>• Use membership number for event registrations</li>
                  <li>• Card is valid until the expiry date shown</li>
                  <li>• Keep card safe and do not share personal details</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

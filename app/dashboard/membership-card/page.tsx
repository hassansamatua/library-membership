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
  const [downloadInProgress, setDownloadInProgress] = useState(false);
  const [printInProgress, setPrintInProgress] = useState(false);

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

  const handleDownload = async () => {
    // Prevent multiple downloads
    if (downloadInProgress) {
      console.log('⚠️ Download already in progress, ignoring...');
      return;
    }
    setDownloadInProgress(true);
    
    console.log('🎨 Starting card download...');
    
    try {
      // Get the card element to clone
      const cardElement = document.querySelector('.membership-card') as HTMLElement;
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      // Create a temporary container for the card
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '85.6mm';
      tempContainer.style.height = '53.98mm';
      tempContainer.style.overflow = 'hidden';
      document.body.appendChild(tempContainer);
      
      // Clone the card and apply necessary styles
      const cardClone = cardElement.cloneNode(true) as HTMLElement;
      cardClone.style.width = '100%';
      cardClone.style.height = '100%';
      cardClone.style.transform = 'none';
      cardClone.style.position = 'relative';
      cardClone.style.boxSizing = 'border-box';
      
      // Add to temporary container
      tempContainer.appendChild(cardClone);
      
      // Force a reflow to ensure styles are applied
      void tempContainer.offsetHeight;
      
      // Use html2canvas to capture the card
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(cardClone, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: true,
        width: tempContainer.offsetWidth,
        height: tempContainer.offsetHeight,
        windowWidth: tempContainer.scrollWidth,
        windowHeight: tempContainer.scrollHeight,
        scale: 4, // Even higher DPI for better print quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: true,
        removeContainer: true
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `membership-card-${membershipStatus?.membership?.membershipNumber || 'card'}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('❌ Error generating card image:', error);
      // Show error to user
      alert('Failed to download membership card. Please try again.');
    } finally {
      // Clean up
      const tempContainer = document.querySelector('div[style*="left: -9999px"]');
      if (tempContainer) {
        document.body.removeChild(tempContainer);
      }
      setDownloadInProgress(false);
    }
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

    // Load all images before drawing
    let logoLoaded = false;
    let profileLoaded = true; // Default to true if no profile image
    let logoError = false;
    let profileError = false;

    // Simplified logo loading - draw background first
    console.log('🖼️ Starting logo load...');
    
    // Debug canvas dimensions and positioning
    console.log('🎨 Canvas dimensions:', canvas.width, 'x', canvas.height);
    console.log('📍 Logo position: 72, 42');
    console.log('📍 Profile position:', canvas.width - 128, 42);
    
    // Draw logo with fallback text if image fails
    if (ctx) {
      // White square background with rounded corners
      ctx.fillStyle = 'white';
      const logoSize = 56;
      const logoX = 72;
      const logoY = 47; // Moved down to match profile image position (52 - 5)
      const radius = 8;
      
      console.log('🔲 Drawing logo background at:', logoX, logoY, 'size:', logoSize);
      
      // Draw rounded rectangle
      ctx.beginPath();
      ctx.moveTo(logoX + radius, logoY);
      ctx.lineTo(logoX + logoSize - radius, logoY);
      ctx.quadraticCurveTo(logoX + logoSize, logoY, logoX + logoSize, logoY + radius);
      ctx.lineTo(logoX + logoSize, logoY + logoSize - radius);
      ctx.quadraticCurveTo(logoX + logoSize, logoY + logoSize, logoX + logoSize - radius, logoY + logoSize);
      ctx.lineTo(logoX + radius, logoY + logoSize);
      ctx.quadraticCurveTo(logoX, logoY + logoSize, logoX, logoY + logoSize - radius);
      ctx.lineTo(logoX, logoY + radius);
      ctx.quadraticCurveTo(logoX, logoY, logoX + radius, logoY);
      ctx.closePath();
      ctx.fill();
      
      // Load and draw logo image with fallback
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      let logoDrawn = false;
      
      logoImg.onload = () => {
        console.log('✅ Logo loaded successfully, dimensions:', logoImg.naturalWidth, 'x', logoImg.naturalHeight);
        if (ctx && !logoDrawn) {
          console.log('🖼️ Drawing logo at:', logoX, logoY, 'size:', logoSize);
          
          // Create clipping path to match the frame
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(logoX, logoY, logoSize, logoSize, 8);
          ctx.clip();
          
          // Draw larger logo to fill frame completely
          const largerSize = 60; // Reduced from 70 for more zoom out
          const largerX = logoX - (largerSize - logoSize) / 2;
          const largerY = logoY - (largerSize - logoSize) / 2;
          ctx.drawImage(logoImg, largerX, largerY, largerSize, largerSize);
          ctx.restore();
          
          logoDrawn = true;
        }
        logoLoaded = true;
        loadProfileImage();
      };
      
      logoImg.onerror = (error) => {
        console.error('❌ Logo failed to load:', error);
        console.error('🔍 Logo src was:', logoImg.src);
        // Draw TLA text as fallback
        if (ctx && !logoDrawn) {
          console.log('📝 Using text fallback');
          ctx.fillStyle = '#059669';
          ctx.font = 'bold 24px Arial Black, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('TLA', logoX + logoSize/2, logoY + logoSize/2 - 8);
          
          ctx.font = 'bold 10px Arial, sans-serif';
          ctx.fillText('LIBRARY', logoX + logoSize/2, logoY + logoSize/2 + 8);
          logoDrawn = true;
        }
        logoError = true;
        loadProfileImage();
      };
      
      // Timeout fallback
      setTimeout(() => {
        if (!logoDrawn && ctx) {
          console.warn('⏰ Logo timeout, using text fallback');
          ctx.fillStyle = '#059669';
          ctx.font = 'bold 24px Arial Black, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('TLA', logoX + logoSize/2, logoY + logoSize/2 - 8);
          
          ctx.font = 'bold 10px Arial, sans-serif';
          ctx.fillText('LIBRARY', logoX + logoSize/2, logoY + logoSize/2 + 8);
          logoDrawn = true;
          logoError = true;
          loadProfileImage();
        }
      }, 2000);
      
      logoImg.src = '/logo.png'; // Use the correct path that works
    }

    function loadProfileImage() {
      console.log('👤 Starting profile image load...');
      if (!ctx) return;
      
      // Draw profile picture background - square frame
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      const profileSize = 56;
      const profileX = canvas.width - 128; // Position from right edge
      const profileY = 42;
      const radius = 8;
      
      console.log('🔲 Drawing profile background at:', profileX, profileY, 'size:', profileSize);
      
      // Draw rounded rectangle for profile
      ctx.beginPath();
      ctx.moveTo(profileX + radius, profileY);
      ctx.lineTo(profileX + profileSize - radius, profileY);
      ctx.quadraticCurveTo(profileX + profileSize, profileY, profileX + profileSize, profileY + radius);
      ctx.lineTo(profileX + profileSize, profileY + profileSize - radius);
      ctx.quadraticCurveTo(profileX + profileSize, profileY + profileSize, profileX + profileSize - radius, profileY + profileSize);
      ctx.lineTo(profileX + radius, profileY + profileSize);
      ctx.quadraticCurveTo(profileX, profileY + profileSize, profileX, profileY + profileSize - radius);
      ctx.lineTo(profileX, profileY + radius);
      ctx.quadraticCurveTo(profileX, profileY, profileX + radius, profileY);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw profile picture image if available
      if (user?.profile?.personalInfo?.profilePicture) {
        console.log('📸 User has profile picture:', user.profile.personalInfo.profilePicture);
        profileLoaded = false; // Set to false since we're loading an image
        const profileImg = new Image();
        profileImg.crossOrigin = 'anonymous';
        profileImg.onload = () => {
          console.log('✅ Profile image loaded successfully');
          if (ctx) {
            // Draw profile image zoomed out and moved down more
            const imageSize = 70; // Smaller size for zoom out effect
            const imageWidth = 70; // Make it square for consistent scaling
            const imageX = canvas.width - 128 - (imageWidth - 56) / 2; // Center in 56px frame
            const imageY = 52 - (imageSize - 56) / 2; // Moved down 5 more pixels from 47 to 52
            
            // Create clipping path to match the frame
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(canvas.width - 128, 42, 56, 56, 8);
            ctx.clip();
            
            ctx.drawImage(profileImg, imageX, imageY, imageWidth, imageSize);
            ctx.restore();
            ctx.restore();
          }
          profileLoaded = true;
          checkAllImagesLoaded();
        };
        profileImg.onerror = () => {
          console.warn('⚠️ Profile image failed to load, using fallback');
          // Fallback to initial if image fails to load
          if (ctx) {
            // Draw fallback in square frame
            const fallbackX = canvas.width - 128;
            const fallbackY = 42;
            const fallbackSize = 56;
            
            // Green background
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(fallbackX, fallbackY, fallbackSize, fallbackSize);
            
            // Initial text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(user?.name?.charAt(0)?.toUpperCase() || 'M', fallbackX + fallbackSize/2, fallbackY + fallbackSize/2);
          }
          profileError = true;
          checkAllImagesLoaded();
        };
        
        // Add timeout for profile image
        setTimeout(() => {
          if (!profileLoaded && !profileError) {
            console.warn('Profile image loading timeout, using fallback');
            if (ctx) {
              // Draw timeout fallback in square frame
              const fallbackX = canvas.width - 128;
              const fallbackY = 42;
              const fallbackSize = 56;
              
              // Green background
              ctx.fillStyle = '#4ade80';
              ctx.fillRect(fallbackX, fallbackY, fallbackSize, fallbackSize);
              
              // Initial text
              ctx.fillStyle = 'white';
              ctx.font = 'bold 32px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(user?.name?.charAt(0)?.toUpperCase() || 'M', fallbackX + fallbackSize/2, fallbackY + fallbackSize/2);
            }
            profileError = true;
            checkAllImagesLoaded();
          }
        }, 3000);
        
        profileImg.src = user.profile.personalInfo.profilePicture.startsWith('/uploads/') 
          ? user.profile.personalInfo.profilePicture 
          : `/uploads/profile-pictures/${user.profile.personalInfo.profilePicture.split('/').pop()}`;
      } else {
        console.log('📝 No profile picture, using initial');
        // Draw profile picture or initial - exact colors
        if (ctx) {
          // Draw no-profile fallback in square frame
          const fallbackX = canvas.width - 128;
          const fallbackY = 42;
          const fallbackSize = 56;
          
          // Green background
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(fallbackX, fallbackY, fallbackSize, fallbackSize);
          
          // Initial text
          ctx.fillStyle = 'white';
          ctx.font = 'bold 32px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(user?.name?.charAt(0)?.toUpperCase() || 'M', fallbackX + fallbackSize/2, fallbackY + fallbackSize/2);
        }
        checkAllImagesLoaded();
      }
    }

    function checkAllImagesLoaded() {
      console.log('🔄 Checking images loaded:', { logoLoaded, logoError, profileLoaded, profileError });
      if ((logoLoaded || logoError) && (profileLoaded || profileError)) {
        console.log('🎨 All images processed, drawing content...');
        drawCardContent();
      }
    }

    function drawCardContent() {
      if (!ctx) return;
      
      // Draw organization name - exact positioning and colors
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Tanzania Library and', canvas.width / 2, 64);
      ctx.fillText('Information Association', canvas.width / 2, 96);
      
      ctx.font = '24px Arial';
      ctx.fillStyle = '#bbf7d0'; // green-100 (exact match)
      ctx.fillText('(TLA)', canvas.width / 2, 124);

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
      console.log('💾 Converting canvas to image...');
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('✅ Image blob created, starting download...');
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `membership-card-${user?.membershipNumber || membershipStatus?.membership?.membershipNumber || 'member'}.png`;
          a.click();
          URL.revokeObjectURL(url);
          console.log('🎉 Download completed!');
        } else {
          console.error('❌ Failed to create image blob');
        }
        // Reset the guard after completion
        setDownloadInProgress(false);
      }, 'image/png', 1.0);
    }
  };

  const handlePrint = () => {
    // Prevent multiple prints
    if (printInProgress) {
      console.log('⚠️ Print already in progress, ignoring...');
      return;
    }
    setPrintInProgress(true);
    
    // Create a print-specific version with SVG for better color preservation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for printing');
      setPrintInProgress(false);
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
          <svg width="336" height="212" xmlns="http://www.w3.org/2000/svg" style="border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3), 0 10px 15px -5px rgba(0, 0, 0, 0.2);">
            <!-- Gradients and patterns -->
            <defs>
              <!-- Main gradient: Gray to dark gray -->
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#2d3e50;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#34495e;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#1a252f;stop-opacity:1" />
              </linearGradient>
              
              <!-- Green accent gradient -->
              <linearGradient id="greenAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
              </linearGradient>
              
              <!-- Diagonal stripe pattern -->
              <pattern id="diagonalPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="60" stroke="rgba(16, 185, 129, 0.08)" stroke-width="20"/>
              </pattern>
              
              <!-- Semi-transparent overlay for depth -->
              <linearGradient id="overlay" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(16, 185, 129, 0.1);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgba(16, 185, 129, 0.05);stop-opacity:1" />
              </linearGradient>
            </defs>
            
            <!-- Main background -->
            <rect width="336" height="212" fill="url(#bgGradient)" rx="16" ry="16"/>
            
            <!-- Diagonal pattern overlay -->
            <rect width="336" height="212" fill="url(#diagonalPattern)" rx="16" ry="16"/>
            
            <!-- Green accent overlay for depth -->
            <rect width="336" height="212" fill="url(#overlay)" rx="16" ry="16"/>
            
            <!-- Large diagonal green stripe (top right) -->
            <polygon points="200,0 336,0 336,150 150,0" fill="rgba(16, 185, 129, 0.15)"/>
            
            <!-- Top header bar with green -->
            <rect width="336" height="50" fill="rgba(16, 185, 129, 0.2)" rx="16" ry="16"/>
            
            <!-- TLA Logo and name header -->
            <!-- Logo background - circular with white -->
            <circle cx="36" cy="28" r="20" fill="white" stroke="rgba(16, 185, 129, 0.3)" stroke-width="2"/>
            <text x="36" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#059669" text-anchor="middle" dominant-baseline="middle">TLA</text>
            
            <!-- Organization name -->
            <text x="168" y="32" font-family="Arial" font-size="12" font-weight="900" fill="white" text-anchor="middle">Tanzania Library and</text>
            <text x="168" y="48" font-family="Arial" font-size="12" font-weight="900" fill="white" text-anchor="middle">Information Association</text>
            <text x="168" y="62" font-family="Arial" font-size="10" fill="#10b981" text-anchor="middle" font-weight="600">(TLA)</text>
            
            <!-- Profile picture with proper fallback -->
            <g>
              <!-- Profile background circle -->
              <circle cx="296" cy="32" r="20" fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.4)" stroke-width="2"/>
              <circle cx="296" cy="32" r="19" fill="url(#greenAccent)" stroke="white" stroke-width="1.5"/>
              <!-- Profile initial or image placeholder -->
              <text x="296" y="32" font-family="Arial" font-size="20" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${user?.name?.charAt(0)?.toUpperCase() || 'M'}</text>
            </g>
            <!-- Member name section -->
            <text x="70" y="75" font-family="Arial, sans-serif" font-size="8" fill="#10b981" font-weight="700" letter-spacing="1">MEMBER NAME</text>
            <text x="70" y="92" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="white">${user?.name?.substring(0, 20) || 'Member Name'}</text>
            
            <!-- Membership number (similar to card number) -->
            <g>
              <text x="70" y="120" font-family="Arial, sans-serif" font-size="8" fill="#10b981" font-weight="700" letter-spacing="0.5">MEMBERSHIP No</text>
              <!-- Display membership number as spaced groups -->
              <text x="70" y="138" font-family="monospace" font-size="14" font-weight="bold" fill="white" letter-spacing="2">${(user?.membershipNumber || membershipStatus?.membership?.membershipNumber || 'N/A').substring(0, 16).split('').join(' ')}</text>
            </g>
            
            <!-- Bottom section with details -->
            <g>
              
              <!-- Membership type -->
              <text x="150" y="162" font-family="Arial, sans-serif" font-size="7" fill="#10b981" font-weight="700">TYPE</text>
              <text x="150" y="174" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white">${membershipStatus?.membership?.membershipType?.toUpperCase() || 'PERSONAL'}</text>
              
            </g>
            
            <!-- Bottom accent bar with green -->
            <rect y="192" width="336" height="20" fill="rgba(16, 185, 129, 0.15)"/>
            <text x="16" y="205" font-family="Arial, sans-serif" font-size="8" fill="rgba(255, 255, 255, 0.7)">Authorized Membership Card • Tanzania Library Association</text>
          </svg>
          </svg>
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
    
    // Reset the guard when print window closes
    const checkClosed = setInterval(() => {
      if (printWindow.closed) {
        clearInterval(checkClosed);
        setPrintInProgress(false);
        console.log('🖨️ Print window closed');
      }
    }, 1000);
    
    // Also reset after 10 seconds as fallback
    setTimeout(() => {
      setPrintInProgress(false);
    }, 10000);
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
          .membership-card svg {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .membership-card svg * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
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
          
          /* Ensure SVG elements print correctly */
          .membership-card svg rect,
          .membership-card svg circle,
          .membership-card svg polygon,
          .membership-card svg text {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
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
                <svg width="336" height="212" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 rounded-lg shadow-xl overflow-hidden" style={{ borderRadius: '16px', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)' }}>
                  {/* Background with gradient */}
                  <defs>
                    {/* Main gradient: Gray to dark gray */}
                    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#2d3e50', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: '#34495e', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#1a252f', stopOpacity: 1 }} />
                    </linearGradient>
                    
                    {/* Green accent gradient */}
                    <linearGradient id="greenAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
                    </linearGradient>
                    
                    {/* Diagonal stripe pattern */}
                    <pattern id="diagonalPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="60" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="20"/>
                    </pattern>
                    
                    {/* Semi-transparent overlay for depth */}
                    <linearGradient id="overlay" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'rgba(16, 185, 129, 0.1)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(16, 185, 129, 0.05)', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  
                  {/* Main background */}
                  <rect width="336" height="212" fill="url(#bgGradient)" rx="16" ry="16"/>
                  
                  {/* Diagonal pattern overlay */}
                  <rect width="336" height="212" fill="url(#diagonalPattern)" rx="16" ry="16"/>
                  
                  {/* Green accent overlay for depth */}
                  <rect width="336" height="212" fill="url(#overlay)" rx="16" ry="16"/>
                  
                  {/* Large diagonal green stripe (top right) */}
                  <polygon points="200,0 336,0 336,150 150,0" fill="rgba(16, 185, 129, 0.15)"/>
                  
                  {/* Top header bar with green */}
                  <rect width="336" height="50" fill="rgba(16, 185, 129, 0.2)" rx="16" ry="16"/>
                  
                  {/* Square logo frame without border */}
                  <rect x="22" y="12" width="56" height="56" fill="white" rx="8" ry="8"/>
                  {/* Actual Logo Image with clipping */}
                  <defs>
                    <clipPath id="logoClip">
                      <rect x="22" y="12" width="56" height="56" rx="8" ry="8"/>
                    </clipPath>
                  </defs>
                  <image
                    href="/logo.png"
                    x="20"
                    y="8.5"
                    width="60"
                    height="60"
                    clipPath="url(#logoClip)"
                    preserveAspectRatio="xMidYMid meet"
                  />
                  
                  {/* Organization name */}
                  <text x="168" y="42" fontFamily="Arial" fontSize="12" fontWeight="900" fill="white" textAnchor="middle">Tanzania Library and</text>
                  <text x="168" y="58" fontFamily="Arial" fontSize="12" fontWeight="900" fill="white" textAnchor="middle">Information Association</text>
                  <text x="168" y="72" fontFamily="Arial" fontSize="10" fill="#10b981" textAnchor="middle" fontWeight="600">(TLA)</text>
                  
                  {/* Profile picture with square frame and clipping */}
                  <g>
                    {/* Square profile frame without border */}
                    {/* <rect x="252" y="7" width="58" height="58" fill="white" rx="8" ry="8"/> */}
                    {user?.profile?.personalInfo?.profilePicture ? (
                      <>
                        <defs>
                          <clipPath id="profileClip">
                            <rect x="252" y="7" width="56" height="56" rx="8" ry="8"/>
                          </clipPath>
                        </defs>
                        <image
                          href={user.profile.personalInfo.profilePicture.startsWith('/uploads/') 
                            ? user.profile.personalInfo.profilePicture 
                            : `/uploads/profile-pictures/${user.profile.personalInfo.profilePicture?.split('/').pop()}`}
                          x="245"
                          y="2"
                          width="70"
                          height="70"
                          clipPath="url(#profileClip)"
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </>
                    ) : (
                      <>
                        {/* Profile initial fallback */}
                        <rect x="252" y="7" width="56" height="56" fill="url(#greenAccent)" rx="8" ry="8"/>
                        <text x="280" y="35" fontFamily="Arial" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">{user?.name?.charAt(0)?.toUpperCase() || 'M'}</text>
                      </>
                    )}
                  </g>
                  
                  {/* Member name section */}
                  <text x="70" y="95" fontFamily="Arial, sans-serif" fontSize="8" fill="#10b981" fontWeight="700" letterSpacing="1">MEMBER NAME</text>
                  <text x="70" y="115" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="bold" fill="white">{user?.name?.substring(0, 20) || 'Member Name'}</text>
                  
                  {/* Membership number (similar to card number) */}
                  <text x="70" y="130" fontFamily="Arial, sans-serif" fontSize="8" fill="#10b981" fontWeight="700" letterSpacing="0.5">MEMBERSHIP No</text>
                  <text x="70" y="150" fontFamily="monospace" fontSize="14" fontWeight="bold" fill="white" letterSpacing="2">{(user?.membershipNumber || membershipStatus?.membership?.membershipNumber || 'N/A').substring(0, 16)}</text>
                  
                  
                  {/* Membership type and phone number side by side */}
                  <g>
                    {/* Left side - Membership type */}
                    <text x="70" y="170" fontFamily="Arial, sans-serif" fontSize="7" fill="#10b981" fontWeight="700">TYPE</text>
                    <text x="70" y="185" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="white">
                      {membershipStatus?.membership?.membershipType?.toUpperCase() || 'PERSONAL'}
                    </text>
                    
                    {/* Right side - Phone number */}
                    <text x="266" y="170" fontFamily="Arial, sans-serif" fontSize="7" fill="#10b981" fontWeight="700" textAnchor="end">PHONE</text>
                    <text x="266" y="185" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="white" textAnchor="end">
                      {user?.profile?.contactInfo?.phone || 'N/A'}
                    </text>
                  </g>
                  
                  {/* Bottom accent bar with green */}
                  <rect y="192" width="336" height="20" fill="rgba(16, 185, 129, 0.15)"/>
                  <text x="16" y="205" fontFamily="Arial, sans-serif" fontSize="8" fill="rgba(255, 255, 255, 0.7)">Authorized Membership Card • TLA</text>
                </svg>
              </div>

              {/* Card Actions */}
              <div className="mt-6 flex flex-wrap gap-3 justify-center card-actions">
                <button
                  onClick={handleDownload}
                  disabled={downloadInProgress}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiDownload className="mr-2 h-4 w-4" />
                  {downloadInProgress ? 'Downloading...' : 'Download Card'}
                </button>
                
                <button
                  onClick={handlePrint}
                  disabled={printInProgress}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPrinter className="mr-2 h-4 w-4" />
                  {printInProgress ? 'Printing...' : 'Print Card'}
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

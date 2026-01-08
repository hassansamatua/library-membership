'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  FiHome,
  FiUsers,
  FiFile,
  FiCalendar,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiExternalLink,
  FiUserPlus,
  FiCreditCard,
  FiFileText,
  FiAward,
} from 'react-icons/fi';
import { FiBell } from 'react-icons/fi';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  console.log('[AdminLayout] Component rendering...');
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    console.log('[AdminLayout] Hydration effect triggered');
    setMounted(true);
  }, []);

  // Handle authentication redirects in useEffect
  useEffect(() => {
    console.log('[AdminLayout] Auth check - mounted:', mounted, 'isAuthLoading:', isAuthLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);
    if (!mounted || isAuthLoading) return;

    if (!isAuthenticated) {
      console.log('[AdminLayout] Not authenticated, redirecting to login');
      router.push('/auth/login');
      return;
    }

    if (!user?.isAdmin) {
      console.log('[AdminLayout] Not admin, checking approval status');
      // For non-admin users, check approval status
      if (!user?.isApproved) {
        console.log('[AdminLayout] User not approved, redirecting to pending approval');
        router.push('/auth/pending-approval');
      } else {
        console.log('[AdminLayout] User approved but not admin, redirecting to dashboard');
        router.push('/dashboard');
      }
      return;
    }

    console.log('[AdminLayout] User is authenticated admin, allowing access');
  }, [mounted, isAuthLoading, isAuthenticated, user, router]);

  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: FiHome },
    { name: 'Member Management', href: '/admin/users', icon: FiUsers },
    { name: 'News', href: '/admin/news', icon: FiBell },
    { name: 'Content Management', href: '/admin/content', icon: FiFile },
    { name: 'Events', href: '/admin/events', icon: FiCalendar },
    { name: 'Reports', href: '/admin/reports', icon: FiBarChart2 },
    { name: 'View Site', href: '/', icon: FiExternalLink, external: true },
  ].map((item) => ({ ...item, label: item.name }));

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Failed to logout');
    }
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted || isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin (redirects will happen in useEffect)
  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-center h-16 bg-green-600 text-white">
          <h1 className="text-xl font-bold">Admin</h1>
        </div>
        
        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-green-100 text-green-700 border-r-4 border-green-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
                target={item.external ? '_blank' : '_self'}
                rel={item.external ? 'noopener noreferrer' : ''}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors duration-200"
          >
            <FiLogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              <FiMenu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
            <div className="w-6"></div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

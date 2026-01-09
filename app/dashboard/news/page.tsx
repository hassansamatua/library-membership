'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FiBell, 
  FiCalendar,
  FiUser,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiInfo,
  FiMessageSquare,
  FiSend
} from 'react-icons/fi';

interface News {
  id: number;
  title: string;
  message: string;
  type: 'news' | 'notification' | 'announcement' | 'urgent';
  sender_name: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sentAt: string;
  is_read: boolean;
}

export default function NewsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isAuthenticated) {
      fetchNews();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchNews = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/news?page=${page}&limit=${pagination.limit}`);
      if (response.ok) {
        const data = await response.json();
        setNews(data.news || []);
        setPagination(data.pagination);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (newsId: number) => {
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId: newsId }),
      });

      if (response.ok) {
        setNews(prev => prev.map(item => 
          item.id === newsId ? { ...item, is_read: true } : item
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNews = news.filter(item => !item.is_read);
      await Promise.all(
        unreadNews.map(item => markAsRead(item.id))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <FiAlertTriangle className="h-5 w-5" />;
      case 'announcement': return <FiSend className="h-5 w-5" />;
      case 'notification': return <FiBell className="h-5 w-5" />;
      default: return <FiMessageSquare className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'announcement': return 'text-purple-600 bg-purple-100';
      case 'notification': return 'text-blue-600 bg-blue-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'low': return 'border-gray-300 bg-gray-50';
      default: return 'border-yellow-500 bg-yellow-50';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">News & Notifications</h1>
          </div>
          <div className="flex items-center space-x-4">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Mark all as read
              </button>
            )}
            <div className="relative">
              <FiBell className="h-6 w-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Unread Count Banner */}
        {unreadCount > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r">
            <div className="flex items-center">
              <FiInfo className="h-5 w-5 text-blue-400 mr-2" />
              <p className="text-sm text-blue-700">
                You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </p>
            </div>
          </div>
        )}

        {/* News List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            </div>
          ) : news.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FiBell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No news yet</h3>
              <p className="text-gray-500">Check back later for updates and announcements</p>
            </div>
          ) : (
            news.map((newsItem) => (
              <div
                key={newsItem.id}
                className={`bg-white rounded-lg shadow border-l-4 ${getPriorityColor(newsItem.priority)} ${
                  !newsItem.is_read ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full ${getTypeColor(newsItem.type)}`}>
                        {getTypeIcon(newsItem.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className={`text-lg font-medium ${!newsItem.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {newsItem.title}
                          </h3>
                          {!newsItem.is_read && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(newsItem.type)}`}>
                            {newsItem.type}
                          </span>
                        </div>
                        <p className={`${!newsItem.is_read ? 'text-gray-800' : 'text-gray-600'} mb-3`}>
                          {newsItem.message}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <FiUser className="h-4 w-4 mr-1" />
                            {newsItem.sender_name}
                          </div>
                          <div className="flex items-center">
                            <FiCalendar className="h-4 w-4 mr-1" />
                            {new Date(newsItem.sentAt).toLocaleDateString()} at {new Date(newsItem.sentAt).toLocaleTimeString()}
                          </div>
                          <div className="flex items-center">
                            Priority: <span className="ml-1 font-medium capitalize">{newsItem.priority}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!newsItem.is_read && (
                        <button
                          onClick={() => markAsRead(newsItem.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="Mark as read"
                        >
                          <FiCheck className="h-4 w-4" />
                        </button>
                      )}
                      {newsItem.is_read && (
                        <div className="p-2 text-gray-400">
                          <FiCheck className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center bg-white rounded-lg shadow p-4">
            <span className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} news
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchNews(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchNews(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

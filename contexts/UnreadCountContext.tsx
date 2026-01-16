'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UnreadCountContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: () => Promise<void>;
}

const UnreadCountContext = createContext<UnreadCountContextType | undefined>(undefined);

export function UnreadCountProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async () => {
    try {
      const response = await fetch('/api/news?limit=1', { 
        credentials: 'include',
        cache: 'no-store' 
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  };

  // Initial load
  useEffect(() => {
    refreshUnreadCount();
  }, []);

  return (
    <UnreadCountContext.Provider value={{ unreadCount, setUnreadCount, refreshUnreadCount }}>
      {children}
    </UnreadCountContext.Provider>
  );
}

export function useUnreadCount() {
  const context = useContext(UnreadCountContext);
  if (context === undefined) {
    throw new Error('useUnreadCount must be used within an UnreadCountProvider');
  }
  return context;
}

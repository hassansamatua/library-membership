// contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
};

export type UserProfile = {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    placeOfBirth: string;
    profilePicture?: string | null;
    nationality?: string;
    idNumber?: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  professionalInfo: {
    occupation: string;
    company: string;
    yearsOfExperience: string;
    specialization: string;
  };
  education: {
    highestQualification: string;
    institution: string;
    yearOfGraduation: string;
  }[];
  membership: {
    membershipType: string;
    membershipNumber: string;
    membershipStatus: string;
    joinDate: string;
  };
  payment: {
    paymentMethod: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
  };
  participation: {
    previousEvents: string[];
    areasOfInterest: string[];
    volunteerInterest: boolean;
  };
  documents: {
    idProof: File | null;
    degreeCertificates: File[];
    cv: File | null;
  };
};

interface AuthContextType {
  user: (User & { profile?: Partial<UserProfile> }) | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { profile?: Partial<UserProfile> }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const login = async (email: string, password: string): Promise<User> => {
    console.log('[AuthContext] Starting login for email:', email);
    try {
      console.log('[AuthContext] Sending login request to /api/auth/login');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
        cache: 'no-store'
      });

      // First, handle non-OK responses
      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          // Try to parse the error response
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // Special handling for unapproved users
        if (response.status === 403) {
          errorMessage = 'Your account is pending approval. Please contact the administrator.';
        }
        
        throw new Error(errorMessage);
      }
      
      // If we get here, the response is OK
      const data = await response.json();

      console.log('[AuthContext] Login response status:', response.status);
      
      if (!data.user) {
        console.error('[AuthContext] No user data in response');
        throw new Error('No user data received');
      }

      if (!data.user) {
        console.error('[AuthContext] No user data in response');
        throw new Error('No user data received');
      }

      // Normalize user data
      const userData = {
        id: data.user.id,
        name: data.user.name || data.user.username || '',
        email: data.user.email,
        isAdmin: Boolean(data.user.is_admin || data.user.isAdmin || false),
        isApproved: Boolean(data.user.is_approved !== false) // Default to true if not specified
      };
      
      console.log('[AuthContext] Login successful, user data:', {
        id: userData.id,
        email: userData.email,
        isAdmin: userData.isAdmin,
        isApproved: userData.isApproved
      });
      
      // Update the user state
      setUser(userData);
      
      // Return the normalized user data
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { 
      method: 'POST', 
      credentials: 'include' 
    });
    setUser(null);
    router.push('/auth/login');
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(prev => ({
        ...prev!,
        ...updatedUser.user,
        profile: {
          ...prev?.profile,
          ...profileData
        }
      }));
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    router.push('/auth/login?registered=true');
  };

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AuthContext] Checking authentication status...');
      try {
        const response = await fetch('/api/auth/me', { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });

        console.log('[AuthContext] Auth check response status:', response.status);

        if (response.ok) {
          const userData = await response.json();
          const normalizedUser = {
            id: userData.id,
            name: userData.name || userData.username || '',
            email: userData.email,
            isAdmin: Boolean(userData.is_admin || userData.isAdmin || false),
            isApproved: Boolean(userData.is_approved !== false)
          };
          
          console.log('[AuthContext] User is authenticated:', {
            id: normalizedUser.id,
            email: normalizedUser.email,
            isAdmin: normalizedUser.isAdmin,
            isApproved: normalizedUser.isApproved
          });
          
          setUser(normalizedUser);
        } else {
          console.log('[AuthContext] No active session found');
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthContext] Auth check failed:', error);
        setUser(null);
      } finally {
        console.log('[AuthContext] Auth check completed');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
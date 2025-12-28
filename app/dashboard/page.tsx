// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FiUser, FiCalendar, FiMail, FiPhone, FiMapPin, FiBriefcase, FiCheckCircle, FiAlertCircle, FiArrowRight, FiCreditCard } from "react-icons/fi";

const calculateProfileCompletion = (user: any) => {
  if (!user) return 0;
  
  const profile = user.profile || {};
  let completedFields = 0;
  const totalFields = 10; // Total number of important fields
  
  // Check personal info
  if (profile.personalInfo?.fullName) completedFields++;
  if (profile.personalInfo?.dateOfBirth) completedFields++;
  if (profile.contactInfo?.phone) completedFields++;
  if (profile.contactInfo?.address) completedFields++;
  if (profile.professionalInfo?.occupation) completedFields++;
  if (profile.education?.length > 0) completedFields++;
  if (profile.membership?.membershipType) completedFields++;
  if (profile.payment?.paymentMethod) completedFields++;
  if (profile.participation?.areasOfInterest?.length > 0) completedFields++;
  if (profile.documents?.idProof) completedFields++;
  
  return Math.round((completedFields / totalFields) * 100);
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      const completion = calculateProfileCompletion(user);
      setProfileCompletion(completion);
    }
  }, [user]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const quickActions = [
    { 
      title: 'Membership Card',
      description: 'View and print your membership card',
      icon: <FiCreditCard className="h-6 w-6 text-purple-600" />,
      action: () => router.push('/dashboard/membership-card')
    },
    { 
      title: 'View Profile', 
      description: 'View and edit your profile information',
      icon: <FiUser className="h-6 w-6 text-green-600" />,
      action: () => router.push('/dashboard/profile')
    },
    { 
      title: 'Upcoming Events', 
      description: 'Check your scheduled events and activities',
      icon: <FiCalendar className="h-6 w-6 text-green-600" />,
      action: () => router.push('/dashboard/events')
    },
    { 
      title: 'Messages', 
      description: 'View your messages and notifications',
      icon: <FiMail className="h-6 w-6 text-blue-600" />,
      action: () => router.push('/dashboard/messages')
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Welcome back, {user?.name}!</h2>
                <p className="mt-1 text-sm text-gray-600">Here's what's happening with your account today.</p>
              </div>
              {user?.isAdmin && (
                <div className="mt-4 md:mt-0">
                  <a
                    href="/admin"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Go to Admin Panel
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completion Card */}
        {profileCompletion < 100 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <div className="flex justify-between">
                  <p className="text-sm text-yellow-700">
                    Your profile is {profileCompletion}% complete. Complete your profile to access all features.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/complete-profile')}
                    className="ml-4 flex-shrink-0 text-sm font-medium text-yellow-700 hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Complete Profile <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-yellow-500 h-2.5 rounded-full" 
                      style={{ width: `${profileCompletion}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {quickActions.map((action, index) => (
            <div 
              key={index} 
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={action.action}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    {action.icon}
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{action.description}</p>
                  </div>
                  <div className="ml-5 flex-shrink-0">
                    <FiArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* User Information */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Personal Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your personal details and contact information.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              {/* Profile Picture */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Profile Picture</dt>
                <dd className="mt-1 flex items-center">
                  {user?.profile?.personalInfo?.profilePicture ? (
                    <img
                      src={user.profile.personalInfo.profilePicture}
                      alt="Profile"
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <FiUser className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={() => router.push('/dashboard/complete-profile')}
                    className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FiUser className="-ml-0.5 mr-2 h-4 w-4" />
                    Update Photo
                  </button>
                </dd>
              </div>

              {/* Full Name */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.profile?.personalInfo?.fullName || 'Not provided'}
                </dd>
              </div>

              {/* Gender */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.profile?.personalInfo?.gender ? 
                    user.profile.personalInfo.gender.charAt(0).toUpperCase() + 
                    user.profile.personalInfo.gender.slice(1) : 'Not provided'}
                </dd>
              </div>

              {/* Date of Birth */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.profile?.personalInfo?.dateOfBirth ? 
                    new Date(user.profile.personalInfo.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </dd>
              </div>

              {/* Place of Birth */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Place of Birth</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.profile?.personalInfo?.placeOfBirth || 'Not provided'}
                </dd>
              </div>

              {/* Email */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>

              {/* Phone */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.profile?.contactInfo?.phone || 'Not provided'}
                </dd>
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.profile?.contactInfo?.address ? (
                    <>
                      {user.profile.contactInfo.address}, {user.profile.contactInfo.city}, {user.profile.contactInfo.country} {user.profile.contactInfo.postalCode}
                    </>
                  ) : 'Not provided'}
                </dd>
              </div>

              {/* Account Status */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Account status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.isApproved ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FiCheckCircle className="mr-1 h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <FiAlertCircle className="mr-1 h-3 w-3" /> Pending Approval
                    </span>
                  )}
                </dd>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-200 pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/complete-profile')}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Events</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your upcoming events and activities.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by checking out our upcoming events.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FiCalendar className="-ml-1 mr-2 h-5 w-5" />
                  View All Events
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
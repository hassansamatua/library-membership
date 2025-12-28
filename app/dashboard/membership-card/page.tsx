"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiPrinter } from "react-icons/fi";

type MembershipInfo = {
  membershipNumber?: string;
  membershipType?: string;
  membershipStatus?: string;
  expiryDate?: string;
  payment_status?: string;
  joinDate?: string;
};

type PersonalInfo = {
  fullName?: string;
  profilePicture?: string | null;
  dateOfBirth?: string;
  gender?: string;
  placeOfBirth?: string;
};

type ProfessionalInfo = {
  occupation?: string;
  company?: string;
};

type ContactInfo = {
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
};

type UserProfile = {
  personalInfo?: PersonalInfo;
  professionalInfo?: ProfessionalInfo;
  contactInfo?: ContactInfo;
  membership?: MembershipInfo;
  payment?: {
    status?: string;
  };
};

export default function MembershipCardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 200);
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const profile = (user.profile || {}) as UserProfile;
  const membership = (profile.membership || {}) as MembershipInfo;
  const personalInfo = (profile.personalInfo || {}) as PersonalInfo;
  const professionalInfo = (profile.professionalInfo || {}) as ProfessionalInfo;
  const contactInfo = (profile.contactInfo || {}) as ContactInfo;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 no-print">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="mr-2" /> Back to Dashboard
          </button>
        </div>

        <div id="membership-card" className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Card Header */}
          <div className="bg-green-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white">Membership Card</h1>
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="no-print bg-white text-green-600 px-4 py-2 rounded-md font-medium flex items-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FiPrinter className="mr-2" />
                {isPrinting ? 'Printing...' : 'Print Card'}
              </button>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6">
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{personalInfo?.fullName || user.name}</h2>
                  <p className="text-gray-600">{profile.professionalInfo?.occupation || 'Member'}</p>
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Member ID:</span> {membership?.membershipNumber || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Membership Type:</span> {membership?.membershipType ? membership.membershipType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Status:</span> {membership?.membershipStatus ? membership.membershipStatus.toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Valid Until:</span> {membership?.expiryDate ? new Date(membership.expiryDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 md:mt-0">
                  {personalInfo?.profilePicture ? (
                    <img
                      src={personalInfo.profilePicture}
                      alt="Profile"
                      className="h-32 w-32 rounded-full border-4 border-green-500 object-cover"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                      <span className="text-4xl">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {user?.email || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {contactInfo?.phone || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

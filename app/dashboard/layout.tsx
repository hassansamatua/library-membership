// app/(dashboard)/layout.tsx
"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Footer } from "@/components/web/footer";
import { Navbar } from "@/components/web/navbar";
import { useEffect } from "react";

const calculateProfileCompletion = (user: any) => {
  if (!user) return 0;

  const profile = user.profile || {};
  let completedFields = 0;
  const totalFields = 10;

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const completion = calculateProfileCompletion(user);
    if (completion < 90 && pathname !== '/dashboard/complete-profile' && pathname !== '/dashboard/subscribe') {
      router.push('/dashboard/complete-profile');
    }
  }, [user, pathname, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="border-green-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Home
                </Link>
                {user?.isAdmin && (
                  <Link
                    href="/admin"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav> */}

      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Navbar />
          {children}
          <Footer />
        </div>
      </main>
    </div>
  );
}
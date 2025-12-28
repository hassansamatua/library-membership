// app/auth/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function RegisterPage() {
  type MembershipType = 'personal' | 'organization';

  type MembershipType = 'personal' | 'organization';

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    nida: "",
    membershipType: "personal" as MembershipType,
    phoneNumber: "",
    otherPhoneNumber: "",
    organizationName: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear organization name when switching to personal membership
      ...(name === 'membershipType' && value === 'personal' ? { organizationName: '' } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.nida || formData.nida.length < 16) {
      setError("Please enter a valid NIDA number (16 digits)");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare the data to send to the API
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        nida: formData.nida,
        membershipType: formData.membershipType,
        phoneNumber: formData.phoneNumber,
        organizationName: formData.membershipType === 'organization' ? formData.organizationName : null
      };

      // Call the register function with all necessary data
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.nida,
        formData.membershipType,
        formData.phoneNumber,
        formData.membershipType === 'organization' ? formData.organizationName : null
      );
      
      router.push('/auth/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md w-full p-8 mx-auto mt-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">Create a new account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our community today
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}

        <div className="bg-white p-8 shadow-lg rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="First, Middle, Last"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address (Personal) <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Primary email for communication"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number (Mobile) <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Primary phone contact"
                />
              </div>
            </div>

            <div>
              <label htmlFor="otherPhoneNumber" className="block text-sm font-medium text-gray-700">
                Other Phone Number (Work/Home)
              </label>
              <div className="mt-1">
                <input
                  id="otherPhoneNumber"
                  name="otherPhoneNumber"
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.otherPhoneNumber}
                  onChange={handleChange}
                  placeholder="Optional additional contacts"
                />
              </div>
            </div>

            <div>
              <label htmlFor="nida" className="block text-sm font-medium text-gray-700">
                National ID (NIDA) Number <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="nida"
                  name="nida"
                  type="text"
                  required
                  minLength={16}
                  maxLength={16}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.nida}
                  onChange={handleChange}
                  placeholder="Enter your 16-digit NIDA number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="membershipType" className="block text-sm font-medium text-gray-700">
                Membership Type <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="membershipType"
                  name="membershipType"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.membershipType}
                  onChange={handleChange}
                >
                  <option value="personal">Personal</option>
                  <option value="organization">Organization</option>
                </select>
              </div>
            </div>

            {formData.membershipType === 'organization' && (
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.organizationName}
                    onChange={handleChange}
                    placeholder="Enter your organization name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-green-700 hover:text-green-600">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
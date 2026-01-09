// app/auth/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

// List of all Tanzanian regions
const TANZANIA_REGIONS = [
  "Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "Kagera",
  "Katavi", "Kigoma", "Kilimanjaro", "Lindi", "Manyara", "Mara", "Mbeya",
  "Mjini Magharibi", "Morogoro", "Mtwara", "Mwanza", "Njombe", "Pemba North",
  "Pemba South", "Pwani", "Rukwa", "Ruvuma", "Shinyanga", "Simiyu", "Singida",
  "Songwe", "Tabora", "Tanga", "Unguja North", "Unguja South"
];

export default function RegisterPage() {
  type MembershipType = 'personal' | 'organization';

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    nida: "",
    membershipType: "personal" as MembershipType,
    phoneNumber: "",
    organizationName: "",
    // New fields
    dateOfBirth: "",
    gender: "",
    country: "Tanzania",
    region: "",
    district: "",
    ward: "",
    street: "",
    houseNumber: "",
    postalAddress: "",
    postalCode: "",
    occupation: "",
    employerName: "",
    workAddress: "",
    workPhone: "",
    workEmail: "",
    educationLevel: "",
    institutionName: "",
    yearOfCompletion: "",
    skills: "",
    membershipCategory: "regular", // regular, student, honorary, etc.
    membershipNumber: "", // Auto-generated
    membershipDate: new Date().toISOString().split('T')[0], // Automatically set to current date // Automatically set to current date
    agreeToTerms: false,
    agreeToDataProcessing: false
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Clear organization name when switching to personal membership
      ...(name === 'membershipType' && value === 'personal' ? { organizationName: '' } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Get current form values directly from the event to avoid state timing issues
    const form = e.target as HTMLFormElement;
    const formDataFromForm = new FormData(form);
    
    const password = formDataFromForm.get('password') as string || "";
    const confirmPassword = formDataFromForm.get('confirmPassword') as string || "";

    // Trim passwords to remove leading/trailing whitespace
    const trimmedPassword = password?.trim() || "";
    const trimmedConfirmPassword = confirmPassword?.trim() || "";

    // Comprehensive debugging
    console.log('=== PASSWORD VALIDATION DEBUG ===');
    console.log('Raw password:', JSON.stringify(password));
    console.log('Raw confirmPassword:', JSON.stringify(confirmPassword));
    console.log('Trimmed password:', JSON.stringify(trimmedPassword));
    console.log('Trimmed confirmPassword:', JSON.stringify(trimmedConfirmPassword));
    console.log('Password length:', password.length);
    console.log('Confirm password length:', confirmPassword.length);
    console.log('Trimmed password length:', trimmedPassword.length);
    console.log('Trimmed confirm password length:', trimmedConfirmPassword.length);
    console.log('Exact match:', password === confirmPassword);
    console.log('Trimmed match:', trimmedPassword === trimmedConfirmPassword);
    console.log('Strict equality test:', trimmedPassword === trimmedConfirmPassword);
    console.log('Character codes password:', Array.from(trimmedPassword).map(c => c.charCodeAt(0)));
    console.log('Character codes confirm:', Array.from(trimmedConfirmPassword).map(c => c.charCodeAt(0)));
    console.log('=== END DEBUG ===');

    // Simple validation - just check if they match after trim
    if (trimmedPassword !== trimmedConfirmPassword) {
      console.log('VALIDATION FAILED: Passwords do not match');
      setError("Passwords do not match");
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!formData.nida || formData.nida.length < 16) {
      setError("Please enter a valid NIDA number (16 digits)");
      return;
    }

    if (!formData.agreeToTerms || !formData.agreeToDataProcessing) {
      setError("You must agree to terms and conditions and data processing policy");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data to send to API
      const userData = {
        ...formData,
        // Use trimmed password from form
        password: trimmedPassword,
        // Send confirmPassword for server-side validation
        confirmPassword: trimmedConfirmPassword,
        // Remove checkboxes from data sent to server
        agreeToTerms: undefined,
        agreeToDataProcessing: undefined
      };

      await register(userData);
      router.push('/auth/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render form sections
  const renderSection = (title: string, children: React.ReactNode) => (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl w-full p-4 mx-auto my-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Create a new account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please fill in all required fields marked with <span className="text-red-500">*</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          {renderSection("Personal Information",
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    National ID (NIDA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nida"
                    required
                    minLength={16}
                    maxLength={16}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.nida}
                    onChange={handleChange}
                    placeholder="16-digit NIDA number"
                  />
                </div>
              </div>
            </>
          )}

          {/* Contact Information Section */}
          {renderSection("Contact Information",
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                  />
                  {formData.password && formData.password.length < 8 && (
                    <p className="mt-1 text-sm text-red-600">Password must be at least 8 characters</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={8}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                  />
                  {formData.confirmPassword && (
                    <p className={`mt-1 text-sm ${formData.password.trim() === formData.confirmPassword.trim() ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.password.trim() === formData.confirmPassword.trim() ? 'Passwords match' : 'Passwords do not match'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="country"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.country}
                    onChange={handleChange}
                  >
                    <option value="Tanzania">Tanzania</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Uganda">Uganda</option>
                    {/* Add more countries as needed */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="region"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.region}
                    onChange={handleChange}
                  >
                    <option value="">Select Region</option>
                    {TANZANIA_REGIONS.map(region => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.district}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ward
                  </label>
                  <input
                    type="text"
                    name="ward"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.ward}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Street
                  </label>
                  <input
                    type="text"
                    name="street"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.street}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    House Number
                  </label>
                  <input
                    type="text"
                    name="houseNumber"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.houseNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Postal Address
                  </label>
                  <input
                    type="text"
                    name="postalAddress"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.postalAddress}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.postalCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          {/* Employment Information Section */}
          {renderSection("Employment Information",
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Occupation/Profession
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.occupation}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employer Name
                  </label>
                  <input
                    type="text"
                    name="employerName"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.employerName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Work Address
                  </label>
                  <input
                    type="text"
                    name="workAddress"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.workAddress}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Work Phone
                  </label>
                  <input
                    type="tel"
                    name="workPhone"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.workPhone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Work Email
                  </label>
                  <input
                    type="email"
                    name="workEmail"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.workEmail}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          {/* Education Background Section */}
          {renderSection("Education Background",
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Highest Education Level
                  </label>
                  <select
                    name="educationLevel"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.educationLevel}
                    onChange={handleChange}
                  >
                    <option value="">Select Education Level</option>
                    <option value="primary">Primary Education</option>
                    <option value="secondary">Secondary Education</option>
                    <option value="diploma">Diploma</option>
                    <option value="bachelor">Bachelor's Degree</option>
                    <option value="master">Master's Degree</option>
                    <option value="phd">PhD/Doctorate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    name="institutionName"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.institutionName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Year of Completion
                  </label>
                  <input
                    type="number"
                    name="yearOfCompletion"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.yearOfCompletion}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Skills/Qualifications
                </label>
                <textarea
                  name="skills"
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="List your skills and qualifications, separated by commas"
                />
              </div>
            </>
          )}

          {/* Membership Information Section */}
          {renderSection("Membership Information",
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Membership Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="membershipCategory"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={formData.membershipCategory}
                    onChange={handleChange}
                  >
                    <option value="personal">Personal</option>
                    <option value="organization">Organization</option>
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Membership Number
                  </label>
                  <input
                    type="text"
                    name="membershipNumber"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                    value={formData.membershipNumber || "Will be generated after approval"}
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Membership Date
                </label>
                <input
                  type="text"
                  name="membershipDate" readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  value={formData.membershipDate}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* Terms and Conditions */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  required
                  className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                  I agree to the <a href="/terms" className="text-green-600 hover:text-green-500">Terms and Conditions</a> <span className="text-red-500">*</span>
                </label>
              </div>
            </div>

            <div className="flex items-start mt-4">
              <div className="flex items-center h-5">
                <input
                  id="agreeToDataProcessing"
                  name="agreeToDataProcessing"
                  type="checkbox"
                  required
                  className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                  checked={formData.agreeToDataProcessing}
                  onChange={handleChange}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToDataProcessing" className="font-medium text-gray-700">
                  I consent to the processing of my personal data in accordance with the <a href="/privacy" className="text-green-600 hover:text-green-500">Privacy Policy</a> <span className="text-red-500">*</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Register'}
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-green-600 hover:text-green-500">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
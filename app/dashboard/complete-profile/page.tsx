'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiBriefcase, FiBook, FiAward, FiCreditCard, FiFileText } from 'react-icons/fi';

import { UserProfile } from '@/contexts/AuthContext';

type ProfileData = {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    placeOfBirth: string;
    profilePicture?: string | null;
    nationality: string;
    idNumber: string;
  };
  contactInfo: {
    socialMedia: any;
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
    skills: string[];
  };
  education: {
    additionalCertifications: string | number | readonly string[] | undefined;
    highestQualification: string;
    institution: string;
    yearOfGraduation: string;
  }[];
  membership: {
    areasOfInterest: string | number | readonly string[] | undefined;
    membershipType: string;
    membershipNumber: string;
    membershipStatus: string;
    joinDate: string;
  };
  payment: {
    accountNumber: string;
    bankName: string;
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

export default function CompleteProfilePage() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [educationCount, setEducationCount] = useState(1);
  const [formattedMembershipNumber, setFormattedMembershipNumber] = useState('MEM2500001');
  
  const [formData, setFormData] = useState<ProfileData>({
    personalInfo: {
      fullName: user?.name || '',
      gender: '',
      dateOfBirth: '',
      placeOfBirth: '',
      idNumber: '',
      profilePicture: null,
      nationality: 'Tanzanian',
    },
    contactInfo: {
      socialMedia: {},
      email: user?.email || '',
      phone: '',
      address: '',
      city: 'Dar es Salaam',
      country: 'Tanzania',
      postalCode: ''
    },
    professionalInfo: {
      occupation: '',
      company: '',
      yearsOfExperience: '',
      specialization: '',
      skills: []
    },
    education: [{
      highestQualification: '',
      institution: '',
      yearOfGraduation: '',
      additionalCertifications: ''
    }],
    membership: {
      membershipType: 'regular',
      membershipNumber: `MEM-${Date.now().toString().slice(-6)}`,
      membershipStatus: 'pending',
      joinDate: new Date().toISOString().split('T')[0],
      areasOfInterest: ''
    },
    payment: {
      paymentMethod: 'mobile_money',
      accountNumber: '',
      bankName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: ''
    },
    participation: {
      previousEvents: [],
      areasOfInterest: [],
      volunteerInterest: false
    },
    documents: {
      idProof: null,
      degreeCertificates: [],
      cv: null
    }
  });

  // Call formatMembershipNumber when the component mounts or when the membership number changes
  useEffect(() => {
  const loadMembershipNumber = async () => {
    try {
      const response = await fetch('/api/membership/next-number');
      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          membership: {
            ...prev.membership,
            membershipNumber: data.membershipNumber
          }
        }));
      }
    } catch (error) {
      console.error('Error loading membership number:', error);
    }
  };
  
  loadMembershipNumber();
}, []);
  const handleAddEducation = () => {
    if (educationCount < 3) { // Limit to 3 education entries
      setFormData(prev => ({
        ...prev,
        education: [
          ...prev.education,
          { highestQualification: '', institution: '', yearOfGraduation: '' }
        ]
      }));
      setEducationCount(prev => prev + 1);
    }
  };

  const handleRemoveEducation = (index: number) => {
    if (formData.education.length > 1) {
      const newEducation = [...formData.education];
      newEducation.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        education: newEducation
      }));
      setEducationCount(prev => prev - 1);
    }
  };

  const handleEducationChange = (index: number, field: string, value: string) => {
    const newEducation = [...formData.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      education: newEducation
    }));
  };

  const handleAreasOfInterestChange = (value: string) => {
    const currentInterests = [...formData.participation.areasOfInterest];
    const index = currentInterests.indexOf(value);
    
    if (index === -1) {
      currentInterests.push(value);
    } else {
      currentInterests.splice(index, 1);
    }
    
    setFormData(prev => ({
      ...prev,
      participation: {
        ...prev.participation,
        areasOfInterest: currentInterests
      }
    }));
  };

  const handleFileUpload = (field: keyof typeof formData.documents, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file
      }
    }));
  };

  const handleInputChange = (section: keyof ProfileData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

 const formatMembershipNumber = async (number: string): Promise<string> => {
  if (!number) {
    try {
      const response = await fetch('/api/membership/next-number');
      const data = await response.json();
      if (data.success) {
        return data.membershipNumber;
      }
      console.error('Failed to generate membership number:', data.error);
      return 'MEM2500001'; // Fallback
    } catch (error) {
      console.error('Error generating membership number:', error);
      return 'MEM2500001'; // Fallback
    }
  }
  
  // Format existing number
  const cleanNumber = number.replace(/[^0-9]/g, '').slice(-5);
  const year = new Date().getFullYear().toString().slice(-2);
  return `MEM${year}${cleanNumber.padStart(5, '0')}`;
};

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    console.log('Token from cookie (first 20 chars):', token ? `${token.substring(0, 20)}...` : 'No token found');
    
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include', // Important for cookies
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    const result = await response.json();
    toast.success('Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.error('Failed to update profile. Please try again.');
  }
};
  const renderSection = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
              <p className="mt-1 text-sm text-gray-600">Update your personal information here.</p>
            </div>

            {/* Profile Picture Upload */}
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                <div className="mt-2 flex items-center">
                  <span className="h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                    {formData.personalInfo.profilePicture ? (
                      <img
                        src={formData.personalInfo.profilePicture}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FiUser className="h-full w-full text-gray-400" />
                    )}
                  </span>
                  <label className="ml-5 relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <span>Change</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size <= 2 * 1024 * 1024) { // 2MB limit
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            handleInputChange('personalInfo', 'profilePicture', reader.result);
                          };
                          reader.readAsDataURL(file);
                        } else {
                          toast.error('File size should be less than 2MB');
                        }
                      }}
                    />
                  </label>
                  <p className="ml-4 text-xs text-gray-500">JPG, PNG (Max. 2MB)</p>
                </div>
              </div>

              {/* Full Name */}
              <div className="sm:col-span-6">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.personalInfo.fullName}
                    onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Member's legal name (First, Middle, Last)</p>
              </div>

              {/* Gender */}
              <div className="sm:col-span-3">
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={formData.personalInfo.gender}
                  onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Gender identity</p>
              </div>

              {/* Date of Birth */}
              <div className="sm:col-span-3">
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.personalInfo.dateOfBirth}
                    onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Used for demographics or age-based services</p>
              </div>

              {/* Place of Birth */}
              <div className="sm:col-span-6">
                <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700">
                  Place of Birth
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="placeOfBirth"
                    name="placeOfBirth"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.personalInfo.placeOfBirth}
                    onChange={(e) => handleInputChange('personalInfo', 'placeOfBirth', e.target.value)}
                    list="tanzaniaRegions"
                  />
                  <datalist id="tanzaniaRegions">
                    <option value="Arusha" />
                    <option value="Dar es Salaam" />
                    <option value="Dodoma" />
                    <option value="Geita" />
                    <option value="Iringa" />
                    <option value="Kagera" />
                    <option value="Katavi" />
                    <option value="Kigoma" />
                    <option value="Kilimanjaro" />
                    <option value="Lindi" />
                    <option value="Manyara" />
                    <option value="Mara" />
                    <option value="Mbeya" />
                    <option value="Morogoro" />
                    <option value="Mtwara" />
                    <option value="Mwanza" />
                    <option value="Njombe" />
                    <option value="Pemba North" />
                    <option value="Pemba South" />
                    <option value="Pwani" />
                    <option value="Rukwa" />
                    <option value="Ruvuma" />
                    <option value="Shinyanga" />
                    <option value="Simiyu" />
                    <option value="Singida" />
                    <option value="Songwe" />
                    <option value="Tabora" />
                    <option value="Tanga" />
                    <option value="Zanzibar North" />
                    <option value="Zanzibar South and Central" />
                    <option value="Zanzibar West" />
                  </datalist>
                </div>
                <p className="mt-1 text-xs text-gray-500">Regions of Tanzania</p>
              </div>
            </div>
          </div>
        );
      // Add other sections (contact, professional, etc.)
      case 'contact':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Contact Information</h3>
            <p className="mt-1 text-sm text-gray-600">Update your contact details.</p>
          </div>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Email */}
            <div className="sm:col-span-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.contactInfo?.email || ''}
                  onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                  disabled={!formData.contactInfo}
                />
              </div>
            </div>
            {/* Phone */}
            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.contactInfo.phone}
                  onChange={(e) => handleInputChange('contactInfo', 'phone', e.target.value)}
                />
              </div>
            </div>
            {/* Address */}
            <div className="sm:col-span-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="address"
                  name="address"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.contactInfo.address}
                  onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value)}
                />
              </div>
            </div>
            {/* City */}
            <div className="sm:col-span-2">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="city"
                  name="city"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.contactInfo.city}
                  onChange={(e) => handleInputChange('contactInfo', 'city', e.target.value)}
                />
              </div>
            </div>
            {/* Country */}
            <div className="sm:col-span-2">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <div className="mt-1">
                <select
                  id="country"
                  name="country"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.contactInfo.country}
                  onChange={(e) => handleInputChange('contactInfo', 'country', e.target.value)}
                >
                  <option value="Tanzania">Tanzania</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Uganda">Uganda</option>
                  {/* Add more countries as needed */}
                </select>
              </div>
            </div>
            {/* Postal Code */}
            <div className="sm:col-span-2">
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.contactInfo.postalCode}
                  onChange={(e) => handleInputChange('contactInfo', 'postalCode', e.target.value)}
                />
              </div>
            </div>
            {/* Social Media */}
            <div className="sm:col-span-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Social Media</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="facebook" className="block text-xs font-medium text-gray-500">
                    Facebook
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      id="facebook"
                      name="facebook"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={formData.contactInfo.socialMedia?.facebook || ''}
                      onChange={(e) => handleInputChange('contactInfo', 'socialMedia', {
                        ...formData.contactInfo.socialMedia,
                        facebook: e.target.value
                      })}
                    />
                  </div>
                </div>
                {/* Add Twitter and LinkedIn similarly */}
              </div>
            </div>
          </div>
        </div>
      );
    case 'professional':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Professional Information</h3>
            <p className="mt-1 text-sm text-gray-600">Tell us about your professional background.</p>
          </div>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Current Position */}
            <div className="sm:col-span-3">
              <label htmlFor="currentPosition" className="block text-sm font-medium text-gray-700">
                Current Position
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="currentPosition"
                  name="currentPosition"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.professionalInfo.currentPosition}
                  onChange={(e) => handleInputChange('professionalInfo', 'currentPosition', e.target.value)}
                />
              </div>
            </div>
            {/* Company */}
            <div className="sm:col-span-3">
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="company"
                  name="company"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.professionalInfo.company}
                  onChange={(e) => handleInputChange('professionalInfo', 'company', e.target.value)}
                />
              </div>
            </div>
            {/* Industry */}
            <div className="sm:col-span-3">
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                Industry
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.professionalInfo.industry}
                  onChange={(e) => handleInputChange('professionalInfo', 'industry', e.target.value)}
                />
              </div>
            </div>
            {/* Years of Experience */}
            <div className="sm:col-span-3">
              <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <div className="mt-1">
                <select
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.professionalInfo.yearsOfExperience}
                  onChange={(e) => handleInputChange('professionalInfo', 'yearsOfExperience', e.target.value)}
                >
                  <option value="">Select years</option>
                  <option value="0-2">0-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>
            </div>
            {/* Skills */}
            <div className="sm:col-span-6">
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                Skills
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.professionalInfo.skills ? formData.professionalInfo.skills.join(', ') : ''}
                  onChange={(e) => handleInputChange(
                    'professionalInfo',
                    'skills',
                    e.target.value.split(',').map(skill => skill.trim()).filter(Boolean)
                  )}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Separate skills with commas</p>
            </div>
            {/* Previous Positions */}
            <div className="sm:col-span-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Previous Positions</h4>
              {/* Add dynamic form for previous positions */}
            </div>
          </div>
        </div>
      );
    case 'education':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Education Background</h3>
            <p className="mt-1 text-sm text-gray-600">Add your educational qualifications.</p>
          </div>
          {formData.education.map((edu, index) => (
            <div key={index} className="space-y-4 border border-gray-200 p-4 rounded-lg">
              {/* Highest Degree */}
              <div className="sm:col-span-3">
                <label htmlFor={`highestDegree-${index}`} className="block text-sm font-medium text-gray-700">
                  Highest Degree Achieved
                </label>
                <div className="mt-1">
                  <select
                    id={`highestDegree-${index}`}
                    name={`highestDegree-${index}`}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={edu.highestDegree}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index] = { ...newEducation[index], highestDegree: e.target.value };
                      handleInputChange('education', 'education', newEducation);
                    }}
                  >
                    <option value="">Select highest degree</option>
                    <option value="phd">PhD</option>
                    <option value="masters">Master's Degree</option>
                    <option value="bachelors">Bachelor's Degree</option>
                    <option value="diploma">Diploma</option>
                    <option value="certificate">Certificate</option>
                  </select>
                </div>
              </div>
              {/* Field of Study */}
              <div className="sm:col-span-3">
                <label htmlFor={`fieldOfStudy-${index}`} className="block text-sm font-medium text-gray-700">
                  Field of Study
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id={`fieldOfStudy-${index}`}
                    name={`fieldOfStudy-${index}`}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={edu.fieldOfStudy}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index] = { ...newEducation[index], fieldOfStudy: e.target.value };
                      handleInputChange('education', 'education', newEducation);
                    }}
                  />
                </div>
              </div>
              {/* Institution */}
              <div className="sm:col-span-3">
                <label htmlFor={`institution-${index}`} className="block text-sm font-medium text-gray-700">
                  Institution
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id={`institution-${index}`}
                    name={`institution-${index}`}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={edu.institution}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index] = { ...newEducation[index], institution: e.target.value };
                      handleInputChange('education', 'education', newEducation);
                    }}
                  />
                </div>
              </div>
              {/* Year of Graduation */}
              <div className="sm:col-span-3">
                <label htmlFor={`yearOfGraduation-${index}`} className="block text-sm font-medium text-gray-700">
                  Year of Graduation
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id={`yearOfGraduation-${index}`}
                    name={`yearOfGraduation-${index}`}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={edu.yearOfGraduation}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index] = { ...newEducation[index], yearOfGraduation: e.target.value };
                      handleInputChange('education', 'education', newEducation);
                    }}
                  />
                </div>
              </div>
              {/* Additional Certifications */}
              <div className="sm:col-span-6">
                <label htmlFor={`additionalCertifications-${index}`} className="block text-sm font-medium text-gray-700">
                  Additional Certifications
                </label>
                <div className="mt-1">
                  <textarea
                    id={`additionalCertifications-${index}`}
                    name={`additionalCertifications-${index}`}
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={edu.additionalCertifications}
                    onChange={(e) => {
                      const newEducation = [...formData.education];
                      newEducation[index] = { ...newEducation[index], additionalCertifications: e.target.value };
                      handleInputChange('education', 'education', newEducation);
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">List any additional certifications or training</p>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => {
                const newEducation = [
                  ...formData.education,
                  {
                    highestDegree: '',
                    fieldOfStudy: '',
                    institution: '',
                    yearOfGraduation: '',
                    additionalCertifications: '',
                    achievements: ''
                  }
                ];
                handleInputChange('education', 'education', newEducation);
              }}
            >
              + Add Another Education
            </button>
          </div>
        </div>
      );
    case 'membership':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Membership Details</h3>
            <p className="mt-1 text-sm text-gray-600">Your membership information and status.</p>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Membership Type */}
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Membership Type</label>
                  <div className="mt-1">
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-700 block w-full sm:text-sm rounded-md p-2"
                        value={formData.membership.membershipType || 'Standard'}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Membership Number */}
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Membership Number</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="flex">
                      <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-700 block w-full sm:text-sm rounded-l-md p-2"
                        value={formattedMembershipNumber}
                        readOnly
                      />
                      {formattedMembershipNumber && formattedMembershipNumber !== 'MEM2500001' && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(formattedMembershipNumber);
                            toast.success('Membership number copied to clipboard');
                          }}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Membership Status */}
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Membership Status</label>
                  <div className="mt-1">
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-700 block w-full sm:text-sm rounded-md p-2"
                        value={formData.membership.membershipStatus || 'Pending Approval'}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Join Date */}
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Join Date</label>
                  <div className="mt-1">
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-700 block w-full sm:text-sm rounded-md p-2"
                        value={formData.membership.joinDate ? new Date(formData.membership.joinDate).toLocaleDateString() : 'N/A'}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Areas of Interest */}
                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Areas of Interest</label>
                  <div className="mt-1">
                    <div className="relative rounded-md shadow-sm">
                      <div className="bg-gray-50 border border-gray-300 rounded-md p-3 min-h-12">
                        {formData.participation.areasOfInterest && formData.participation.areasOfInterest.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(formData.participation.areasOfInterest) ? (
                              formData.participation.areasOfInterest.map((interest, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {interest}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {formData.participation.areasOfInterest}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No areas of interest selected</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case 'payment':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Payment Information</h3>
            <p className="mt-1 text-sm text-gray-600">Your payment details for membership fees.</p>
          </div>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Payment Method */}
            <div className="sm:col-span-6">
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <div className="mt-1">
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.payment.paymentMethod}
                  onChange={(e) => handleInputChange('payment', 'paymentMethod', e.target.value)}
                >
                  <option value="credit_card">Credit/Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            {/* Conditional fields based on payment method */}
            {formData.payment.paymentMethod === 'credit_card' && (
              <>
                <div className="sm:col-span-6">
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                    Card Number
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={formData.payment.cardNumber || ''}
                      onChange={(e) => handleInputChange('payment', 'cardNumber', e.target.value)}
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="expiryDate"
                      name="expiryDate"
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={formData.payment.expiryDate || ''}
                      onChange={(e) => handleInputChange('payment', 'expiryDate', e.target.value)}
                      placeholder="MM/YY"
                    />
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                    CVV
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="cvv"
                      name="cvv"
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={formData.payment.cvv || ''}
                      onChange={(e) => handleInputChange('payment', 'cvv', e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
              </>
            )}
            {formData.payment.paymentMethod === 'bank_transfer' && (
              <>
                <div className="sm:col-span-6">
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                    Bank Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={formData.payment.bankName || ''}
                      onChange={(e) => handleInputChange('payment', 'bankName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="sm:col-span-6">
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={formData.payment.accountNumber || ''}
                      onChange={(e) => handleInputChange('payment', 'accountNumber', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            {formData.payment.paymentMethod === 'mobile_money' && (
              <>
                <div className="sm:col-span-3">
                  <label htmlFor="mobileProvider" className="block text-sm font-medium text-gray-700">
                    Mobile Provider
                  </label>
                  <div className="mt-1">
                    <select
                      id="mobileProvider"
                      name="mobileProvider"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={formData.payment.mobileProvider || ''}
                      onChange={(e) => handleInputChange('payment', 'mobileProvider', e.target.value)}
                    >
                      <option value="">Select provider</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="tigopesa">Tigo Pesa</option>
                      <option value="airtelmoney">Airtel Money</option>
                      <option value="halopesa">HaloPesa</option>
                    </select>
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      id="mobileNumber"
                      name="mobileNumber"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={formData.payment.mobileNumber || ''}
                      onChange={(e) => handleInputChange('payment', 'mobileNumber', e.target.value)}
                      placeholder="e.g., 0712345678"
                    />
                  </div>
                </div>
              </>
            )}
            {formData.payment.paymentMethod === 'other' && (
              <div className="sm:col-span-6">
                <label htmlFor="paymentReference" className="block text-sm font-medium text-gray-700">
                  Payment Reference
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="paymentReference"
                    name="paymentReference"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={formData.payment.paymentReference || ''}
                    onChange={(e) => handleInputChange('payment', 'paymentReference', e.target.value)}
                    placeholder="Enter payment reference or instructions"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    case 'documents':
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Document Upload</h3>
            <p className="mt-1 text-sm text-gray-600">Upload required documents for verification.</p>
          </div>
          <div className="space-y-6">
            {/* ID Proof */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                ID Proof (Passport/National ID)
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  id="idProof"
                  name="idProof"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleInputChange('documents', 'idProof', file);
                    }
                  }}
                />
                <label
                  htmlFor="idProof"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                >
                  <span>Upload file</span>
                  <input id="idProof" name="idProof" type="file" className="sr-only" />
                </label>
                <p className="pl-1 text-sm text-gray-500">
                  {formData.documents.idProof ? formData.documents.idProof.name : 'No file chosen'}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Upload a clear copy of your passport or national ID (PDF, JPG, or PNG, max 5MB)
              </p>
            </div>
            {/* Degree Certificates */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Degree Certificates
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  id="degreeCertificates"
                  name="degreeCertificates"
                  className="sr-only"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      handleInputChange('documents', 'degreeCertificates', [
                        ...(formData.documents.degreeCertificates || []),
                        ...files
                      ]);
                    }
                  }}
                />
                <label
                  htmlFor="degreeCertificates"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                >
                  <span>Upload files</span>
                  <input id="degreeCertificates" name="degreeCertificates" type="file" className="sr-only" multiple />
                </label>
                <p className="pl-1 text-sm text-gray-500">
                  {formData.documents.degreeCertificates?.length || 0} files chosen
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Upload copies of your degree certificates (PDF, JPG, or PNG, max 5MB each)
              </p>
              
              {/* Display uploaded files */}
              {formData.documents.degreeCertificates?.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {formData.documents.degreeCertificates.map((file, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      {file.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* CV/Resume */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                CV/Resume
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  id="cv"
                  name="cv"
                  className="sr-only"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleInputChange('documents', 'cv', file);
                    }
                  }}
                />
                <label
                  htmlFor="cv"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-green-500 focus-within:outline-none"
                >
                  <span>Upload file</span>
                  <input id="cv" name="cv" type="file" className="sr-only" />
                </label>
                <p className="pl-1 text-sm text-gray-500">
                  {formData.documents.cv ? formData.documents.cv.name : 'No file chosen'}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Upload your CV/Resume (PDF or Word document, max 5MB)
              </p>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
};

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Complete Your Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please provide the following information to complete your profile
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Completion</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Complete all sections to finish setting up your profile.
            </p>
          </div>

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex overflow-x-auto" aria-label="Tabs">
              {[
                { id: 'personal', name: 'Personal', icon: <FiUser className="mr-2" /> },
                { id: 'contact', name: 'Contact', icon: <FiMail className="mr-2" /> },
                { id: 'professional', name: 'Professional', icon: <FiBriefcase className="mr-2" /> },
                { id: 'education', name: 'Education', icon: <FiBook className="mr-2" /> },
                { id: 'membership', name: 'Membership', icon: <FiAward className="mr-2" /> },
                { id: 'payment', name: 'Payment', icon: <FiCreditCard className="mr-2" /> },
                { id: 'documents', name: 'Documents', icon: <FiFileText className="mr-2" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center ${
                    activeSection === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {renderSection()}
            
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => router.back()}
              >
                Back
              </button>
              <div className="space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => {
                    // Save as draft logic
                    toast.info('Draft saved successfully');
                  }}
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save and Continue'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

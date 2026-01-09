"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCreditCard, FiCheckCircle, FiAlertCircle, FiLoader, FiArrowLeft, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { calculateMembershipPricing, getMembershipStatus } from '@/lib/membership-pricing';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import PhoneNumberInput from '@/components/PhoneNumberInput';

const paymentMethods = [
  { id: 'azampesa', displayName: 'AzamPesa' },
  { id: 'mpesa', displayName: 'M-Pesa' },
  { id: 'halopesa', displayName: 'HaloPesa' },
  { id: 'airtelmoney', displayName: 'Airtel Money' },
  { id: 'tigopesa', displayName: 'Tigo Pesa' },
  { id: 'bankcard', displayName: 'Bank Card' }
];

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [membershipType, setMembershipType] = useState<'personal' | 'organization'>('personal');
  const [pricing, setPricing] = useState<any>(null);
  const [membershipStatus, setMembershipStatus] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>('');

  // Auto-detect membership type from user profile
  useEffect(() => {
    const fetchUserMembershipType = async () => {
      try {
        const response = await fetch('/api/membership/status', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success && data.plan) {
          setMembershipType(data.plan.type);
        }
      } catch (error) {
        console.error('Error fetching membership type:', error);
        // Fallback to URL parameter or default to personal
        const typeParam = searchParams.get('type');
        setMembershipType(typeParam === 'organization' ? 'organization' : 'personal');
      }
    };

    fetchUserMembershipType();
  }, [searchParams]);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      router.push('/login');
      return;
    }

    // Calculate pricing and status
    const calculatePricing = async () => {
      try {
        // Check if user is new or continuing
        const response = await fetch('/api/membership/status', { credentials: 'include' });
        const data = await response.json();
        
        // Better logic to determine if user is new
        let isNewUser = true;
        if (data.membership && data.membership.paymentStatus === 'paid') {
          // User has a paid membership, check if it's for current year
          const paymentYear = new Date(data.membership.payment_date).getFullYear();
          const currentYear = new Date().getFullYear();
          const membershipYear = currentYear - (new Date().getMonth() < 2 ? 1 : 0); // Membership year runs Feb-Jan
          isNewUser = paymentYear !== membershipYear;
        }
        
        console.log('User status:', { isNewUser, membership: data.membership });
        
        // Calculate pricing
        const pricingData = calculateMembershipPricing(membershipType, isNewUser);
        setPricing(pricingData);

        // Get membership status
        const lastPaymentDate = data.membership?.payment_date ? new Date(data.membership.payment_date) : null;
        const statusData = getMembershipStatus(lastPaymentDate, membershipType, isNewUser);
        setMembershipStatus(statusData);

      } catch (error) {
        console.error('Error calculating pricing:', error);
        // Fallback pricing - assume new user
        const fallbackPricing = calculateMembershipPricing(membershipType, true);
        setPricing(fallbackPricing);
      } finally {
        setLoading(false);
      }
    };

    calculatePricing();
  }, [user, membershipType, router]);

  const handlePayment = async () => {
    if (!pricing || !user || !selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    // Show phone number input instead of direct payment
    setShowPhoneInput(true);
  };

  const handlePhoneNumberSubmit = async (phoneNumber: string) => {
    if (!pricing || !user || !selectedPaymentMethod || !phoneNumber) {
      setError('Missing payment information');
      return;
    }

    setPaymentLoading(true);
    setError(null);
    setUserPhoneNumber(phoneNumber);

    try {
      // Use AzamPay checkout API with mobile money details - no PIN needed
      const response = await fetch('/api/payments/azampay/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipType,
          amount: pricing.totalDue,
          userId: user.id,
          paymentMethod: selectedPaymentMethod,
          phoneNumber: phoneNumber,
          customerName: user.name,
          customerEmail: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // Handle fallback scenario
      if (data.fallback) {
        setPaymentUrl('fallback');
        setError(data.error);
        return;
      }

      // Redirect to AzamPay - this will trigger the mobile money prompt on user's phone
      if (data.checkoutUrl) {
        setPaymentUrl(data.checkoutUrl);
        
        // Show user message about phone prompt
        setError(`Redirecting to AzamPay... Check your ${selectedPaymentMethod} app for payment confirmation.`);
        
        // Log provider integration details
        console.log(`Payment initiated with ${selectedPaymentMethod}:`, {
          provider: selectedPaymentMethod,
          phone: phoneNumber,
          amount: pricing.totalDue,
          ussd: selectedPaymentMethod === 'mpesa' ? '*150*01#' :
                selectedPaymentMethod === 'azampesa' ? '*150*01#' :
                selectedPaymentMethod === 'halopesa' ? '*150*02#' :
                selectedPaymentMethod === 'airtelmoney' ? '*150*03#' :
                selectedPaymentMethod === 'tigopesa' ? '*150*04#' : '*150#'
        });
        
        // Redirect after a short delay to show the message
        setTimeout(() => {
          window.location.href = data.checkoutUrl;
        }, 2000);
      } else {
        throw new Error('No payment URL received');
      }

    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePhoneInputCancel = () => {
    setShowPhoneInput(false);
    setUserPhoneNumber('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => showPhoneInput ? handlePhoneInputCancel() : router.push('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            {showPhoneInput ? 'Back to Payment Methods' : 'Back to Dashboard'}
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {showPhoneInput ? 'Confirm Payment' : 'Membership Payment'}
          </h1>
          <p className="text-gray-600">
            {showPhoneInput 
              ? `Complete your ${paymentMethods.find(m => m.id === selectedPaymentMethod)?.displayName} payment`
              : `${membershipType === 'personal' ? 'Personal' : 'Organization'} Membership for ${pricing?.year}`
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Loading */}
        {paymentLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <FiLoader className="h-5 w-5 text-blue-400 animate-spin mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Processing Payment</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {showPhoneInput ? 'Securing your payment...' : 'Redirecting you to secure payment gateway...'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phone Number Input Step */}
        {showPhoneInput && selectedPaymentMethod && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <PhoneNumberInput
              paymentMethod={selectedPaymentMethod}
              onPhoneNumberSubmit={handlePhoneNumberSubmit}
              onCancel={handlePhoneInputCancel}
            />
          </div>
        )}

        {/* Regular Payment Flow */}
        {!showPhoneInput && (
          <>
            {/* Payment Method Selection */}
            <PaymentMethodSelector
              selectedMethod={selectedPaymentMethod}
              onMethodSelect={setSelectedPaymentMethod}
              amount={pricing?.totalDue || 0}
            />

            {/* Pricing Details */}
            {pricing && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
                
                <div className="space-y-4">
                  {/* Base Amount */}
                  <div className="flex justify-between items-center py-3 border-b">
                    <div>
                      <p className="font-medium text-gray-900">
                        {pricing.isNewUser ? 'New Member' : 'Continuing Member'} - {membershipType === 'personal' ? 'Personal' : 'Organization'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Membership period: February {pricing.year} - January {pricing.year + 1}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      TZS {pricing.baseAmount.toLocaleString()}
                    </p>
                  </div>

                  {/* Penalty */}
                  {pricing.penaltyAmount > 0 && (
                    <div className="flex justify-between items-center py-3 border-b">
                      <div>
                        <p className="font-medium text-red-600">Late Payment Penalty</p>
                        <p className="text-sm text-gray-600">
                          {pricing.penaltyAmount / 10000} year(s) × TZS 10,000
                        </p>
                      </div>
                      <p className="text-xl font-bold text-red-600">
                        TZS {pricing.penaltyAmount.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center py-3">
                    <p className="text-lg font-semibold text-gray-900">Total Amount Due</p>
                    <p className="text-2xl font-bold text-green-600">
                      TZS {pricing.totalDue.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Status Information */}
                {membershipStatus && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    membershipStatus.status === 'active' ? 'bg-green-50 border border-green-200' :
                    membershipStatus.status === 'grace-period' ? 'bg-yellow-50 border border-yellow-200' :
                    membershipStatus.status === 'overdue' ? 'bg-red-50 border border-red-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center">
                      <FiCalendar className="h-5 w-5 mr-2" />
                      <div>
                        <p className="font-medium capitalize">
                          {membershipStatus.status.replace('-', ' ')}
                        </p>
                        {membershipStatus.status === 'grace-period' && (
                          <p className="text-sm text-gray-600">
                            {membershipStatus.daysUntilDue} days remaining until grace period ends
                          </p>
                        )}
                        {membershipStatus.status === 'overdue' && (
                          <p className="text-sm text-red-600">
                            Payment is overdue. Penalty of TZS {membershipStatus.penaltyAmount.toLocaleString()} applies.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Button */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <button
                onClick={handlePayment}
                disabled={paymentLoading || !pricing || !selectedPaymentMethod}
                className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {paymentLoading ? (
                  <>
                    <FiLoader className="animate-spin mr-2 h-5 w-5" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FiCreditCard className="mr-2 h-5 w-5" />
                    Pay TZS {pricing?.totalDue.toLocaleString() || '0'}
                    {selectedPaymentMethod && ` with ${paymentMethods.find(m => m.id === selectedPaymentMethod)?.displayName}`}
                  </>
                )}
              </button>

              <div className="mt-4 text-center text-sm text-gray-600">
                <p>Secure payment powered by AzamPay</p>
                <p>You will be prompted to enter your mobile money details</p>
              </div>
            </div>

            {/* Information Section */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Payment Schedule</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Membership year: February to January</li>
                    <li>• Grace period: Until March 31st</li>
                    <li>• Late penalty: TZS 10,000 per year</li>
                    <li>• New members: TZS 40,000 (Personal)</li>
                    <li>• Continuing: TZS 30,000 (Personal)</li>
                    <li>• Organization: TZS 150,000</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Accepted Payment Methods</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Mobile Money (M-Pesa, Tigo Pesa, Airtel Money, HaloPesa)</li>
                    <li>• Bank Cards (Visa, Mastercard)</li>
                    <li>• Bank Transfer</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCreditCard, FiCheckCircle, FiAlertCircle, FiLoader, FiArrowLeft, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { calculateMembershipPricing, getMembershipStatus } from '@/lib/membership-pricing';

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

  // Get membership type from URL parameter
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'organization') {
      setMembershipType('organization');
    } else {
      setMembershipType('personal');
    }
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
        
        const isNewUser = !data.membership || data.membership.paymentStatus !== 'paid';
        
        // Calculate pricing
        const pricingData = calculateMembershipPricing(membershipType, isNewUser);
        setPricing(pricingData);

        // Get membership status
        const lastPaymentDate = data.membership?.payment_date ? new Date(data.membership.payment_date) : null;
        const statusData = getMembershipStatus(lastPaymentDate, membershipType, isNewUser);
        setMembershipStatus(statusData);

      } catch (error) {
        console.error('Error calculating pricing:', error);
        // Fallback pricing
        const fallbackPricing = calculateMembershipPricing(membershipType, true);
        setPricing(fallbackPricing);
      } finally {
        setLoading(false);
      }
    };

    calculatePricing();
  }, [user, membershipType, router]);

  const handlePayment = async () => {
    if (!pricing || !user) return;

    setPaymentLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/azampay/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipType,
          amount: pricing.totalDue,
          userId: user.id,
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

      // Redirect to AzamPay checkout
      if (data.checkoutUrl) {
        setPaymentUrl(data.checkoutUrl);
        window.location.href = data.checkoutUrl;
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
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Membership Payment</h1>
          <p className="text-gray-600">
            {membershipType === 'personal' ? 'Personal' : 'Organization'} Membership for {pricing?.year}
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
                  Redirecting you to secure payment gateway...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Membership Type Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Membership Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setMembershipType('personal')}
              className={`p-4 rounded-lg border-2 transition-all ${
                membershipType === 'personal'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900">Personal Membership</h3>
              <p className="text-sm text-gray-600 mt-1">For individual professionals and students</p>
            </button>
            
            <button
              onClick={() => setMembershipType('organization')}
              className={`p-4 rounded-lg border-2 transition-all ${
                membershipType === 'organization'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900">Organization Membership</h3>
              <p className="text-sm text-gray-600 mt-1">For institutions and companies</p>
            </button>
          </div>
        </div>

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
            disabled={paymentLoading || !pricing}
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
              </>
            )}
          </button>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Secure payment powered by AzamPay</p>
            <p>You will be redirected to AzamPay's secure payment page</p>
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
      </div>
    </div>
  );
}

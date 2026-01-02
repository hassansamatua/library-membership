"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiAlertCircle, FiLoader, FiHome, FiCreditCard } from 'react-icons/fi';

export default function PaymentSuccessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState<string>('Processing your payment...');
  const [reference, setReference] = useState<string>('');

  useEffect(() => {
    const referenceParam = searchParams.get('reference');
    if (referenceParam) {
      setReference(referenceParam);
      checkPaymentStatus(referenceParam);
    } else {
      setStatus('failed');
      setMessage('No payment reference found');
    }
  }, [searchParams]);

  const checkPaymentStatus = async (ref: string) => {
    try {
      const response = await fetch(`/api/payments/azampay/checkout?reference=${ref}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const paymentStatus = data.status;
        
        if (paymentStatus.status === 'SUCCESS') {
          setStatus('success');
          setMessage('Payment successful! Your membership has been activated.');
          
          // Refresh membership status
          setTimeout(() => {
            router.push('/dashboard/membership-card');
          }, 3000);
        } else if (paymentStatus.status === 'FAILED') {
          setStatus('failed');
          setMessage('Payment failed. Please try again or contact support.');
        } else {
          // Still pending, check again in a few seconds
          setTimeout(() => checkPaymentStatus(ref), 3000);
        }
      } else {
        setStatus('failed');
        setMessage('Unable to verify payment status');
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      setStatus('failed');
      setMessage('Error verifying payment status');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          )}
          {status === 'success' && (
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="h-8 w-8 text-green-600" />
            </div>
          )}
          {status === 'failed' && (
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <FiAlertCircle className="h-8 w-8 text-red-600" />
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className="text-center mb-6">
          <h1 className={`text-2xl font-bold mb-2 ${
            status === 'success' ? 'text-green-600' : 
            status === 'failed' ? 'text-red-600' : 'text-blue-600'
          }`}>
            {status === 'loading' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
          </h1>
          
          <p className="text-gray-600 mb-4">{message}</p>
          
          {reference && (
            <p className="text-sm text-gray-500">
              Reference: {reference}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === 'success' && (
            <>
              <button
                onClick={() => router.push('/dashboard/membership-card')}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <FiCreditCard className="mr-2 h-4 w-4" />
                View Membership Card
              </button>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                <FiHome className="mr-2 h-4 w-4" />
                Dashboard
              </button>
            </>
          )}
          
          {status === 'failed' && (
            <>
              <button
                onClick={() => router.push('/dashboard/payment')}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FiCreditCard className="mr-2 h-4 w-4" />
                Try Again
              </button>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                <FiHome className="mr-2 h-4 w-4" />
                Dashboard
              </button>
            </>
          )}
          
          {status === 'loading' && (
            <div className="text-center text-sm text-gray-500">
              <p>Please wait while we verify your payment...</p>
              <p>This may take a few seconds.</p>
            </div>
          )}
        </div>

        {/* Help Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">Need help? Contact us:</p>
            <p>Email: membership@tla.or.tz</p>
            <p>Phone: +255 22 211 3456</p>
          </div>
        </div>
      </div>
    </div>
  );
}

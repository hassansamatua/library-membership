'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type MembershipStatusResponse = {
  success: boolean;
  message?: string;
  cycle?: {
    year: number;
    startDate: string;
    dueDate: string;
    expiryDate: string;
  };
  plan?: {
    type: 'personal' | 'organization';
    newUser: boolean;
  };
  fees?: {
    baseAmount: number;
    penaltyAmount: number;
    totalDue: number;
    currency: string;
  };
  membership?: {
    membershipNumber: string;
    membershipType: string;
    status: string;
    paymentStatus: string;
    joinedDate: string;
    expiryDate: string;
    amountPaid: number | string;
  } | null;
  canAccessIdCard?: boolean;
};

export default function SubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const typeParam = searchParams.get('type');
  const newUserParam = searchParams.get('newUser');

  const planType: 'personal' | 'organization' = typeParam === 'organization' ? 'organization' : 'personal';
  const newUser = newUserParam === 'true' || newUserParam === '1';

  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState<MembershipStatusResponse | null>(null);

  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [transactionId, setTransactionId] = useState('');

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set('type', planType);
    qs.set('newUser', newUser ? 'true' : 'false');
    return qs.toString();
  }, [planType, newUser]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/membership/status?${queryString}`, { credentials: 'include' });
        const data = (await res.json().catch(() => ({}))) as MembershipStatusResponse;
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to load membership status');
        }
        setStatus(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load membership status';
        toast.error(msg);
        router.push('/membership');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [queryString, router]);

  const formatTzs = (amount: number) => {
    return `TZS ${amount.toLocaleString('en-US')}`;
  };

  const handlePay = async () => {
    try {
      setIsPaying(true);
      const res = await fetch('/api/membership/pay', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: planType,
          newUser,
          paymentMethod,
          transactionId: transactionId.trim() || null
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment failed');
      }

      toast.success('Payment recorded. Membership activated.');
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      toast.error(msg);
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (status?.success && status?.canAccessIdCard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900">Membership Active</h1>
            <p className="mt-2 text-sm text-gray-600">
              Your membership is already paid and active for cycle {status.cycle?.year}.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex justify-center items-center px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push('/membership')}
                className="inline-flex justify-center items-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back to Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const due = status?.fees?.totalDue ?? 0;
  const base = status?.fees?.baseAmount ?? 0;
  const penalty = status?.fees?.penaltyAmount ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Membership Subscription</h1>
        <p className="mt-2 text-sm text-gray-600">
          Complete your membership payment to activate/renew your membership.
        </p>

        <div className="mt-6 bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Plan</div>
              <div className="text-base font-semibold text-gray-900">
                {planType === 'organization' ? 'Organization' : (newUser ? 'Personal (New User)' : 'Personal (Renewal)')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Membership cycle</div>
              <div className="text-base font-semibold text-gray-900">
                {status?.cycle?.year}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base amount</span>
              <span className="text-gray-900">{formatTzs(base)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">Penalty</span>
              <span className="text-gray-900">{formatTzs(penalty)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold mt-3">
              <span className="text-gray-900">Total due</span>
              <span className="text-green-700">{formatTzs(due)}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Due date: {status?.cycle?.dueDate}
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment method</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction reference (optional)</label>
              <input
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. mobile money ref"
              />
            </div>

            <button
              onClick={handlePay}
              disabled={isPaying}
              className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {isPaying ? 'Processing...' : 'Pay & Activate Membership'}
            </button>

            <button
              onClick={() => router.push('/membership')}
              className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

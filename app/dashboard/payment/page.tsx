'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard, Banknote, Smartphone } from 'lucide-react';

// Payment method types
type PaymentMethod = 'card' | 'mobile_money' | 'bank';

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Pre-fill phone number if available in user profile
  useEffect(() => {
    if (user?.profile?.contactInfo?.phone) {
      setPhoneNumber(user.profile.contactInfo.phone);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (paymentMethod === 'mobile_money' && !phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/payment/pesapal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country_code: 'TZ',
          amount: parseFloat(amount),
          description: `Payment for ${user?.name || 'user'} (${user?.email || 'user'})`,
          phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
          reference: `TLA-${Date.now()}-${user?.id || 'guest'}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      // Redirect to PesaPal payment page
      setIsRedirecting(true);
      window.location.href = data.payment_url;
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment. Please try again.');
      setIsLoading(false);
    }
  };

  // Format amount to ensure it's a valid number
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  if (isRedirecting) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="p-4 rounded-full bg-muted">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Redirecting to PesaPal</h1>
          <p className="text-muted-foreground text-lg">
            Please wait while we securely connect you to PesaPal to complete your payment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Banknote className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Make a Payment</CardTitle>
                <CardDescription>
                  Securely complete your payment via PesaPal
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (TSH)</Label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-muted-foreground">TSH</span>
                    </div>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      className="pl-12"
                      required
                    />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Minimum amount: TSH 1,000
                  </p>
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <div className="mt-2 space-y-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mobile_money')}
                      className={`w-full flex items-center gap-3 p-4 border rounded-lg text-left transition-colors ${
                        paymentMethod === 'mobile_money' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        paymentMethod === 'mobile_money' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted'
                      }`}>
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Mobile Money</p>
                        <p className="text-sm text-muted-foreground">M-Pesa, Airtel Money, etc.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`w-full flex items-center gap-3 p-4 border rounded-lg text-left transition-colors ${
                        paymentMethod === 'card' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        paymentMethod === 'card' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted'
                      }`}>
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Credit/Debit Card</p>
                        <p className="text-sm text-muted-foreground">Visa, Mastercard, etc.</p>
                      </div>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'mobile_money' && (
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <div className="mt-1">
                      <Select defaultValue="254">
                        <SelectTrigger className="w-[120px] inline-flex mr-2">
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="255">+255 (TZ)</SelectItem>
                          <SelectItem value="254">+254 (KE)</SelectItem>
                          <SelectItem value="256">+256 (UG)</SelectItem>
                          <SelectItem value="250">+250 (RW)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="712 345 678"
                        className="inline-flex w-[calc(100%-136px)]"
                        required={paymentMethod === 'mobile_money'}
                      />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      You'll receive a payment request on this number
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay TSH ${amount ? new Intl.NumberFormat('en-TZ').format(parseFloat(amount)) : '0'}`
                  )}
                </Button>
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  By continuing, you agree to our{' '}
                  <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and{' '}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                </p>
              </div>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-4">
            <div className="flex items-center justify-center w-full text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Secure payment by</span>
                <div className="h-6 w-auto">
                  <svg viewBox="0 0 200 50" className="h-full w-auto">
                    <text x="0" y="30" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#1a1a1a">Pesa</text>
                    <text x="75" y="30" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#00a651">Pal</text>
                  </svg>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// AzamPay Payment Gateway Integration
// Sandbox URLs for development
const AZAMPAY_CONFIG = {
  sandbox: {
    authenticatorBaseUrl: 'https://authenticator-sandbox.azampay.co.tz',
    checkoutBaseUrl: 'https://sandbox.azampay.co.tz',
  },
  production: {
    authenticatorBaseUrl: 'https://authenticator.azampay.co.tz',
    checkoutBaseUrl: 'https://api.azampay.co.tz',
  }
};

// Configuration - update these with your actual credentials
const AZAMPAY_CREDENTIALS = {
  clientId: process.env.AZAMPAY_CLIENT_ID || '',
  clientSecret: process.env.AZAMPAY_CLIENT_SECRET || '',
  appName: process.env.AZAMPAY_APP_NAME || 'TLA Membership System',
  callbackUrl: process.env.AZAMPAY_CALLBACK_URL || 'http://localhost:3000/api/payments/azampay/callback',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
};

interface AzamPayAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AzamPayCheckoutRequest {
  amount: number;
  currency: string;
  merchantName: string;
  orderId: string;
  customerEmail: string;
  customerPhone: string;
  redirectUrl: string;
  callbackUrl: string;
  merchantUserUuid?: string;
}

interface AzamPayCheckoutResponse {
  checkoutUrl: string;
  reference: string;
  status: string;
}

interface AzamPayPaymentStatus {
  reference: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  amount: number;
  currency: string;
  transactionId?: string;
  paymentMethod?: string;
  timestamp: string;
}

class AzamPayService {
  private config: typeof AZAMPAY_CONFIG.sandbox | typeof AZAMPAY_CONFIG.production;
  private credentials: typeof AZAMPAY_CREDENTIALS;

  constructor() {
    this.config = AZAMPAY_CONFIG[AZAMPAY_CREDENTIALS.environment as keyof typeof AZAMPAY_CONFIG];
    this.credentials = AZAMPAY_CREDENTIALS;
  }

  /**
   * Get authentication token from AzamPay
   */
  async getAuthToken(): Promise<string> {
    try {
      console.log('AzamPay Auth Request:', {
        url: `${this.config.authenticatorBaseUrl}/AppRegistration/GenerateToken`,
        clientId: this.credentials.clientId,
        appName: this.credentials.appName,
      });

      const response = await fetch(`${this.config.authenticatorBaseUrl}/AppRegistration/GenerateToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: this.credentials.clientId,
          clientSecret: this.credentials.clientSecret,
          appName: this.credentials.appName,
        }),
      });

      console.log('AzamPay Auth Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AzamPay Auth Error Response:', errorText);
        
        if (response.status === 423 || response.statusText === 'Locked') {
          throw new Error('AzamPay app is locked. Please complete app registration with valid callback URL in AzamPay dashboard.');
        }
        
        throw new Error(`AzamPay auth failed: ${response.statusText} - ${errorText}`);
      }

      const data: AzamPayAuthResponse = await response.json();
      console.log('AzamPay Auth Success:', { tokenLength: data.access_token?.length });
      return data.access_token;
    } catch (error) {
      console.error('AzamPay authentication error:', error);
      throw error;
    }
  }

  /**
   * Create checkout payment
   */
  async createCheckout(paymentData: AzamPayCheckoutRequest): Promise<AzamPayCheckoutResponse> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.config.checkoutBaseUrl}/Checkout/CreateCheckout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error(`AzamPay checkout failed: ${response.statusText}`);
      }

      const data: AzamPayCheckoutResponse = await response.json();
      return data;
    } catch (error) {
      console.error('AzamPay checkout error:', error);
      throw error;
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(reference: string): Promise<AzamPayPaymentStatus> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.config.checkoutBaseUrl}/Checkout/GetTransactionStatus?reference=${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`AzamPay status check failed: ${response.statusText}`);
      }

      const data: AzamPayPaymentStatus = await response.json();
      return data;
    } catch (error) {
      console.error('AzamPay status check error:', error);
      throw error;
    }
  }

  /**
   * Create membership payment checkout
   */
  async createMembershipPayment({
    userId,
    membershipType,
    amount,
    userEmail,
    userPhone,
    orderId,
  }: {
    userId: string;
    membershipType: string;
    amount: number;
    userEmail: string;
    userPhone: string;
    orderId: string;
  }): Promise<AzamPayCheckoutResponse> {
    const checkoutData: AzamPayCheckoutRequest = {
      amount,
      currency: 'TZS',
      merchantName: 'Tanzania Library Association',
      orderId,
      customerEmail: userEmail,
      customerPhone: userPhone,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/payment/success`,
      callbackUrl: this.credentials.callbackUrl,
      merchantUserUuid: userId,
    };

    return this.createCheckout(checkoutData);
  }

  /**
   * Verify webhook signature (for security)
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implement signature verification logic
    // This depends on how AzamPay signs their webhooks
    // For now, return true for sandbox testing
    return this.config === AZAMPAY_CONFIG.sandbox;
  }
}

export const azampayService = new AzamPayService();
export type {
  AzamPayAuthResponse,
  AzamPayCheckoutRequest,
  AzamPayCheckoutResponse,
  AzamPayPaymentStatus,
};

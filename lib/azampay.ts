// AzamPay Payment Gateway Integration
// Based on official AzamPay API documentation
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
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  testMode: process.env.AZAMPAY_TEST_MODE === 'true' // Add test mode flag
};

interface AzamPayAuthResponse {
  data: {
    accessToken: string;
    expiresIn: number;
  };
  success: boolean;
  message: string;
}

interface AzamPayCheckoutRequest {
  amount: string;
  currency: string;
  merchantName: string;
  orderId: string;
  customerEmail: string;
  customerPhone: string;
  redirectUrl: string;
  callbackUrl: string;
  vendorId?: string;
}

interface AzamPayCheckoutResponse {
  data: {
    checkoutUrl: string;
    reference: string;
    transactionId?: string;
  };
  success: boolean;
  message: string;
}

interface AzamPayPaymentStatus {
  data: {
    reference: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    amount: string;
    currency: string;
    transactionId?: string;
    paymentMethod?: string;
    timestamp: string;
  };
  success: boolean;
  message: string;
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
    // Test mode - return fake token
    if (this.credentials.testMode) {
      console.log('AzamPay Test Mode: Using fake authentication token');
      return 'test-token-' + Date.now();
    }

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
      console.log('AzamPay Auth Success:', { success: data.success, tokenLength: data.data?.accessToken?.length });
      
      if (!data.success || !data.data?.accessToken) {
        throw new Error(`AzamPay auth failed: ${data.message}`);
      }
      
      return data.data.accessToken;
    } catch (error) {
      console.error('AzamPay authentication error:', error);
      throw error;
    }
  }

  /**
   * Create checkout payment
   */
  async createCheckout(paymentData: AzamPayCheckoutRequest): Promise<AzamPayCheckoutResponse> {
    // Test mode - return fake checkout response
    if (this.credentials.testMode) {
      console.log('AzamPay Test Mode: Creating fake checkout');
      const fakeReference = 'TEST-' + Date.now();
      const fakeCheckoutUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/payment/success?reference=${fakeReference}&test=true`;
      
      return {
        data: {
          checkoutUrl: fakeCheckoutUrl,
          reference: fakeReference,
          transactionId: 'TEST-TXN-' + Date.now(),
        },
        success: true,
        message: 'Test checkout created successfully'
      };
    }

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
        const errorText = await response.text();
        console.error('AzamPay checkout error response:', errorText);
        throw new Error(`AzamPay checkout failed: ${response.statusText} - ${errorText}`);
      }

      const data: AzamPayCheckoutResponse = await response.json();
      console.log('AzamPay checkout response:', { success: data.success, reference: data.data?.reference });
      
      if (!data.success || !data.data?.checkoutUrl) {
        throw new Error(`AzamPay checkout failed: ${data.message}`);
      }
      
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
    // Test mode - return fake successful payment
    if (this.credentials.testMode || reference.startsWith('TEST-')) {
      console.log('AzamPay Test Mode: Returning fake successful payment status');
      return {
        data: {
          reference,
          status: 'SUCCESS',
          amount: '40000',
          currency: 'TZS',
          transactionId: 'TEST-TXN-' + Date.now(),
          paymentMethod: 'Test Payment',
          timestamp: new Date().toISOString(),
        },
        success: true,
        message: 'Test payment successful'
      };
    }

    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${this.config.checkoutBaseUrl}/Checkout/GetTransactionStatus?reference=${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AzamPay status check error response:', errorText);
        throw new Error(`AzamPay status check failed: ${response.statusText} - ${errorText}`);
      }

      const data: AzamPayPaymentStatus = await response.json();
      console.log('AzamPay status check response:', { success: data.success, status: data.data?.status });
      
      if (!data.success) {
        throw new Error(`AzamPay status check failed: ${data.message}`);
      }
      
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
    paymentMethod,
  }: {
    userId: string;
    membershipType: string;
    amount: number;
    userEmail: string;
    userPhone: string;
    orderId: string;
    paymentMethod?: string;
  }): Promise<AzamPayCheckoutResponse> {
    const checkoutData: AzamPayCheckoutRequest = {
      amount: amount.toString(),
      currency: 'TZS',
      merchantName: 'Tanzania Library Association',
      orderId,
      customerEmail: userEmail,
      customerPhone: userPhone,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/payment/success`,
      callbackUrl: this.credentials.callbackUrl,
      vendorId: userId,
    };

    // Add provider-specific handling for mobile money integration
    if (paymentMethod) {
      const providerConfig = this.getProviderConfig(paymentMethod);
      checkoutData.paymentMethod = paymentMethod;
      checkoutData.providerCode = providerConfig.code;
      
      console.log(`AzamPay integration with ${providerConfig.name}:`, {
        provider: paymentMethod,
        code: providerConfig.code,
        ussd: providerConfig.ussd,
        phone: userPhone
      });
    }

    console.log('Creating AzamPay checkout with data:', checkoutData);
    return this.createCheckout(checkoutData);
  }

  /**
   * Get provider configuration for mobile money integration
   */
  private getProviderConfig(provider: string) {
    const providers = {
      azampesa: {
        name: 'AzamPesa',
        code: 'AZAMPESA',
        ussd: '*150*01#',
        color: '#0052CC'
      },
      mpesa: {
        name: 'M-Pesa',
        code: 'MPESA',
        ussd: '*150*01#',
        color: '#35B039'
      },
      halopesa: {
        name: 'HaloPesa',
        code: 'HALOPESA',
        ussd: '*150*02#',
        color: '#8B3A9C'
      },
      airtelmoney: {
        name: 'Airtel Money',
        code: 'AIRTELMONEY',
        ussd: '*150*03#',
        color: '#ED1C24'
      },
      tigopesa: {
        name: 'Tigo Pesa',
        code: 'TIGOPESA',
        ussd: '*150*04#',
        color: '#00A6CE'
      }
    };

    return providers[provider as keyof typeof providers] || {
      name: 'Unknown',
      code: 'UNKNOWN',
      ussd: '*150#',
      color: '#6B7280'
    };
  }

  /**
   * Get provider USSD code for user reference
   */
  getProviderUSSD(provider: string): string {
    const config = this.getProviderConfig(provider);
    return config.ussd;
  }

  /**
   * Get provider display name
   */
  getProviderName(provider: string): string {
    const config = this.getProviderConfig(provider);
    return config.name;
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

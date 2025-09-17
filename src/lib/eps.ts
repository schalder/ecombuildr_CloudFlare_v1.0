import CryptoJS from 'crypto-js';

export interface EPSConfig {
  merchantId: string;
  storeId: string;
  username: string;
  password: string;
  hashKey: string;
  isSandbox: boolean;
}

export interface EPSPaymentData {
  tran_id: string;
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  amount: number;
  currency: string;
  desc: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  opt_a?: string;
  opt_b?: string;
  opt_c?: string;
  opt_d?: string;
}

export interface EPSPaymentResponse {
  status: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  failedreason?: string;
}

export class EPSClient {
  private config: EPSConfig;
  private baseUrl: string;

  constructor(config: EPSConfig) {
    this.config = config;
    this.baseUrl = config.isSandbox 
      ? 'https://demo.epsbd.com' 
      : 'https://www.eps.com.bd';
  }

  /**
   * Generate HMAC-SHA512 hash for EPS API authentication
   */
  private generateHash(data: string): string {
    return CryptoJS.HmacSHA512(data, this.config.hashKey).toString();
  }

  /**
   * Get EPS authentication token
   */
  async getToken(): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const data = `${this.config.merchantId}${this.config.storeId}${timestamp}`;
    const hash = this.generateHash(data);

    const response = await fetch(`${this.baseUrl}/api/v1/get-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: this.config.merchantId,
        store_id: this.config.storeId,
        username: this.config.username,
        password: this.config.password,
        timestamp: timestamp,
        hash: hash,
      }),
    });

    const result = await response.json();
    
    if (result.status !== 'SUCCESS') {
      throw new Error(result.message || 'Failed to get EPS token');
    }

    return result.token;
  }

  /**
   * Initialize payment session with EPS
   */
  async initPayment(paymentData: EPSPaymentData): Promise<EPSPaymentResponse> {
    const token = await this.getToken();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Prepare data for hash generation (based on EPS documentation)
    const hashData = `${this.config.merchantId}${paymentData.tran_id}${paymentData.amount}${paymentData.currency}${timestamp}`;
    const hash = this.generateHash(hashData);

    const requestPayload = {
      merchant_id: this.config.merchantId,
      store_id: this.config.storeId,
      tran_id: paymentData.tran_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      success_url: paymentData.success_url,
      fail_url: paymentData.fail_url,
      cancel_url: paymentData.cancel_url,
      ipn_url: paymentData.ipn_url,
      cus_name: paymentData.cus_name,
      cus_email: paymentData.cus_email,
      cus_phone: paymentData.cus_phone,
      desc: paymentData.desc,
      timestamp: timestamp,
      hash: hash,
      opt_a: paymentData.opt_a,
      opt_b: paymentData.opt_b,
      opt_c: paymentData.opt_c,
      opt_d: paymentData.opt_d,
    };

    const response = await fetch(`${this.baseUrl}/api/v1/payment/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestPayload),
    });

    const result = await response.json();
    return result as EPSPaymentResponse;
  }

  /**
   * Verify payment status
   */
  async verifyPayment(transactionId: string): Promise<{ status: string; data?: any }> {
    const token = await this.getToken();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    const hashData = `${this.config.merchantId}${transactionId}${timestamp}`;
    const hash = this.generateHash(hashData);

    const response = await fetch(`${this.baseUrl}/api/v1/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        merchant_id: this.config.merchantId,
        tran_id: transactionId,
        timestamp: timestamp,
        hash: hash,
      }),
    });

    const result = await response.json();
    return result;
  }

  /**
   * Query transaction status
   */
  async queryTransaction(transactionId: string): Promise<{ status: string; data?: any }> {
    const token = await this.getToken();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    const hashData = `${this.config.merchantId}${transactionId}${timestamp}`;
    const hash = this.generateHash(hashData);

    const response = await fetch(`${this.baseUrl}/api/v1/payment/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        merchant_id: this.config.merchantId,
        tran_id: transactionId,
        timestamp: timestamp,
        hash: hash,
      }),
    });

    const result = await response.json();
    return result;
  }
}

export default EPSClient;
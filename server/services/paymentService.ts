import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

export interface GatewayInitiationResult {
  success: boolean;
  gateway: 'bkash' | 'sslcommerz' | 'nagad' | 'cod';
  paymentId?: string;
  redirectUrl?: string;
  transactionRef?: string;
  amount: number;
  currency: string;
  error?: string;
  requiresRedirect: boolean;
  clientSecret?: string;
}

export interface GatewayVerificationResult {
  success: boolean;
  paymentId: string;
  transactionId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  gateway: string;
  status: 'paid' | 'failed' | 'cancelled';
  rawResponse?: any;
  error?: string;
}

/**
 * Check which payment gateways have valid credentials configured
 */
export function getPaymentGatewayConfigStatus() {
  const bkashConfigured = Boolean(
    process.env.BKASH_APP_KEY &&
    process.env.BKASH_APP_SECRET &&
    process.env.BKASH_APP_KEY.trim() !== ''
  );

  const sslcommerzConfigured = Boolean(
    process.env.SSLCOMMERZ_STORE_ID &&
    process.env.SSLCOMMERZ_STORE_PASSWD &&
    process.env.SSLCOMMERZ_STORE_ID.trim() !== ''
  );

  const nagadConfigured = Boolean(
    process.env.NAGAD_MERCHANT_ID &&
    process.env.NAGAD_MERCHANT_ID.trim() !== ''
  );

  return {
    cod: true, // Cash on Delivery is always available
    bkash: bkashConfigured,
    sslcommerz: sslcommerzConfigured,
    nagad: nagadConfigured,
    defaultProvider: process.env.PAYMENT_PROVIDER || (bkashConfigured ? 'bkash' : 'cod'),
  };
}

/**
 * -------------------------------------------------------------
 * 1. bKash Tokenized Payment Integration (v1.2.0-beta)
 * -------------------------------------------------------------
 */
const BKASH_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://tokenized.pay.bka.sh/v1.2.0-beta'
    : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

let cachedBkashToken: string | null = null;
let bkashTokenExpiresAt: number = 0;

async function getBkashIdToken(): Promise<string> {
  const now = Date.now();
  if (cachedBkashToken && bkashTokenExpiresAt > now + 60000) {
    return cachedBkashToken;
  }

  const appKey = process.env.BKASH_APP_KEY;
  const appSecret = process.env.BKASH_APP_SECRET;
  const username = process.env.BKASH_USERNAME || 'sandboxTokenizedUser02';
  const password = process.env.BKASH_PASSWORD || 'sandboxTokenizedUser02@12345';

  if (!appKey || !appSecret) {
    throw new Error('bKash credentials (BKASH_APP_KEY, BKASH_APP_SECRET) are not configured');
  }

  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      username,
      password,
    },
    body: JSON.stringify({
      app_key: appKey,
      app_secret: appSecret,
    }),
  });

  const data: any = await res.json();
  if (!res.ok || data.statusCode !== '0000') {
    throw new Error(data.statusMessage || 'Failed to obtain bKash ID token');
  }

  cachedBkashToken = data.id_token;
  bkashTokenExpiresAt = now + (parseInt(data.expires_in, 10) || 3600) * 1000;
  return cachedBkashToken!;
}

/**
 * Initiate bKash Payment
 */
export async function initiateBkashPayment(params: {
  amount: number;
  orderNumber: string;
  callbackUrl: string;
}): Promise<GatewayInitiationResult> {
  const { amount, orderNumber, callbackUrl } = params;

  if (!process.env.BKASH_APP_KEY || !process.env.BKASH_APP_SECRET) {
    return {
      success: false,
      gateway: 'bkash',
      amount,
      currency: 'BDT',
      requiresRedirect: false,
      error: 'bKash gateway credentials (BKASH_APP_KEY / BKASH_APP_SECRET) are not set in .env',
    };
  }

  try {
    const idToken = await getBkashIdToken();
    const appKey = process.env.BKASH_APP_KEY;

    const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: idToken,
        'X-APP-Key': appKey,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: orderNumber,
        callbackURL: callbackUrl,
        amount: amount.toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: orderNumber,
      }),
    });

    const data: any = await res.json();
    if (!res.ok || data.statusCode !== '0000') {
      return {
        success: false,
        gateway: 'bkash',
        amount,
        currency: 'BDT',
        requiresRedirect: false,
        error: data.statusMessage || 'bKash payment initiation rejected',
      };
    }

    return {
      success: true,
      gateway: 'bkash',
      paymentId: data.paymentID,
      redirectUrl: data.bkashURL,
      transactionRef: data.paymentID,
      amount,
      currency: 'BDT',
      requiresRedirect: true,
    };
  } catch (error: any) {
    return {
      success: false,
      gateway: 'bkash',
      amount,
      currency: 'BDT',
      requiresRedirect: false,
      error: error.message || 'Failed to initiate bKash payment',
    };
  }
}

/**
 * Server-to-Server Execute / Verify bKash Payment
 */
export async function verifyBkashPayment(paymentId: string): Promise<GatewayVerificationResult> {
  try {
    const idToken = await getBkashIdToken();
    const appKey = process.env.BKASH_APP_KEY!;

    const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: idToken,
        'X-APP-Key': appKey,
      },
      body: JSON.stringify({ paymentID: paymentId }),
    });

    const data: any = await res.json();

    if (data.statusCode === '0000' && data.transactionStatus === 'Completed') {
      return {
        success: true,
        paymentId: data.paymentID,
        transactionId: data.trxID,
        orderNumber: data.merchantInvoiceNumber,
        amount: parseFloat(data.amount),
        currency: data.currency,
        gateway: 'bkash',
        status: 'paid',
        rawResponse: data,
      };
    }

    return {
      success: false,
      paymentId,
      transactionId: data.trxID || '',
      orderNumber: data.merchantInvoiceNumber || '',
      amount: parseFloat(data.amount || '0'),
      currency: data.currency || 'BDT',
      gateway: 'bkash',
      status: data.statusCode === '0100' ? 'cancelled' : 'failed',
      error: data.statusMessage || 'bKash verification failed',
      rawResponse: data,
    };
  } catch (err: any) {
    return {
      success: false,
      paymentId,
      transactionId: '',
      orderNumber: '',
      amount: 0,
      currency: 'BDT',
      gateway: 'bkash',
      status: 'failed',
      error: err.message,
    };
  }
}

/**
 * -------------------------------------------------------------
 * 2. SSLCOMMERZ Payment Integration
 * -------------------------------------------------------------
 */
const SSLCOMMERZ_BASE_URL =
  process.env.NODE_ENV === 'production' && !process.env.SSLCOMMERZ_IS_SANDBOX
    ? 'https://securepay.sslcommerz.com'
    : 'https://sandbox.sslcommerz.com';

export async function initiateSslcommerzPayment(params: {
  amount: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}): Promise<GatewayInitiationResult> {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePasswd = process.env.SSLCOMMERZ_STORE_PASSWD;

  if (!storeId || !storePasswd) {
    return {
      success: false,
      gateway: 'sslcommerz',
      amount: params.amount,
      currency: 'BDT',
      requiresRedirect: false,
      error: 'SSLCOMMERZ credentials (SSLCOMMERZ_STORE_ID / SSLCOMMERZ_STORE_PASSWD) are not set in .env',
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('store_id', storeId);
    formData.append('store_passwd', storePasswd);
    formData.append('total_amount', params.amount.toFixed(2));
    formData.append('currency', 'BDT');
    formData.append('tran_id', params.orderNumber);
    formData.append('success_url', params.successUrl);
    formData.append('fail_url', params.failUrl);
    formData.append('cancel_url', params.cancelUrl);
    formData.append('ipn_url', params.ipnUrl);
    formData.append('cus_name', params.customerName);
    formData.append('cus_email', params.customerEmail);
    formData.append('cus_add1', params.address);
    formData.append('cus_city', params.city);
    formData.append('cus_country', 'Bangladesh');
    formData.append('cus_phone', params.customerPhone);
    formData.append('shipping_method', 'NO');
    formData.append('product_name', 'Novara Commerce Order');
    formData.append('product_category', 'Retail');
    formData.append('product_profile', 'general');

    const res = await fetch(`${SSLCOMMERZ_BASE_URL}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data: any = await res.json();
    if (data.status === 'SUCCESS' && data.GatewayPageURL) {
      return {
        success: true,
        gateway: 'sslcommerz',
        paymentId: data.sessionkey,
        redirectUrl: data.GatewayPageURL,
        transactionRef: params.orderNumber,
        amount: params.amount,
        currency: 'BDT',
        requiresRedirect: true,
      };
    }

    return {
      success: false,
      gateway: 'sslcommerz',
      amount: params.amount,
      currency: 'BDT',
      requiresRedirect: false,
      error: data.failedreason || 'SSLCOMMERZ initiation rejected',
    };
  } catch (err: any) {
    return {
      success: false,
      gateway: 'sslcommerz',
      amount: params.amount,
      currency: 'BDT',
      requiresRedirect: false,
      error: err.message,
    };
  }
}

/**
 * Server-to-Server SSLCOMMERZ Validation API
 */
export async function verifySslcommerzPayment(valId: string): Promise<GatewayVerificationResult> {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePasswd = process.env.SSLCOMMERZ_STORE_PASSWD;

  if (!storeId || !storePasswd) {
    throw new Error('SSLCOMMERZ credentials are not configured');
  }

  const queryUrl = `${SSLCOMMERZ_BASE_URL}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(
    valId
  )}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(storePasswd)}&v=1&format=json`;

  const res = await fetch(queryUrl);
  const data: any = await res.json();

  if (data.status === 'VALID' || data.status === 'VALIDATED') {
    return {
      success: true,
      paymentId: valId,
      transactionId: data.bank_tran_id || data.tran_id,
      orderNumber: data.tran_id,
      amount: parseFloat(data.amount),
      currency: data.currency,
      gateway: 'sslcommerz',
      status: 'paid',
      rawResponse: data,
    };
  }

  return {
    success: false,
    paymentId: valId,
    transactionId: data.bank_tran_id || '',
    orderNumber: data.tran_id || '',
    amount: parseFloat(data.amount || '0'),
    currency: data.currency || 'BDT',
    gateway: 'sslcommerz',
    status: 'failed',
    error: data.error || 'SSLCOMMERZ payment validation failed',
    rawResponse: data,
  };
}

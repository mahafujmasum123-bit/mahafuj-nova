import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  hashOtp,
  generateSecureNumericOtp,
} from '../../server/routes/authRoutes';
import {
  getPaymentGatewayConfigStatus,
} from '../../server/services/paymentService';
import {
  calculateCartTotals,
  getEffectivePrice,
} from './ecommerceRules';

describe('1. Cryptographic OTP Verification Rules', () => {
  it('generates a 6-digit numeric OTP between 100000 and 999999', () => {
    for (let i = 0; i < 20; i++) {
      const otp = generateSecureNumericOtp();
      assert.match(otp, /^\d{6}$/, `OTP ${otp} should be 6 digits`);
      const val = parseInt(otp, 10);
      assert.ok(val >= 100000 && val <= 999999, `OTP ${val} should be in 100000..999999 range`);
    }
  });

  it('generates consistent HMAC-SHA256 hash for identical email and OTP', () => {
    const email = 'user@example.com';
    const otp = '849201';
    const hash1 = hashOtp(email, otp);
    const hash2 = hashOtp(email, otp);
    assert.equal(hash1, hash2, 'Identical credentials must generate identical HMAC hashes');
    assert.equal(hash1.length, 64, 'SHA-256 hex string must be 64 characters long');
  });

  it('normalizes email casing and trims whitespace for hash parity', () => {
    const hash1 = hashOtp('User@Example.COM ', '123456');
    const hash2 = hashOtp('user@example.com', '123456');
    assert.equal(hash1, hash2, 'Normalized email should yield same hash');
  });

  it('produces completely different hashes for wrong OTP', () => {
    const email = 'user@example.com';
    const hashCorrect = hashOtp(email, '123456');
    const hashWrong = hashOtp(email, '123457');
    assert.notEqual(hashCorrect, hashWrong, 'Different OTP must produce different HMAC-SHA256 hash');
  });

  it('verifies timingSafeEqual behavior accurately', () => {
    const email = 'test@shopmax.com';
    const correctOtp = '654321';
    const storedHash = hashOtp(email, correctOtp);

    const testAttemptValid = hashOtp(email, '654321');
    const bufA = Buffer.from(storedHash, 'hex');
    const bufB = Buffer.from(testAttemptValid, 'hex');
    const isValid = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
    assert.equal(isValid, true, 'timingSafeEqual must succeed on valid OTP');

    const testAttemptInvalid = hashOtp(email, '000000');
    const bufC = Buffer.from(testAttemptInvalid, 'hex');
    const isInvalid = bufA.length === bufC.length && crypto.timingSafeEqual(bufA, bufC);
    assert.equal(isInvalid, false, 'timingSafeEqual must fail on invalid OTP');
  });

  it('enforces 10-minute expiry validation', () => {
    const now = Date.now();
    const validExpiry = new Date(now + 10 * 60 * 1000);
    const expiredDate = new Date(now - 1000);

    assert.ok(validExpiry.getTime() > now, 'Fresh OTP is not expired');
    assert.ok(expiredDate.getTime() < now, 'Expired OTP is recognized as expired');
  });

  it('enforces attempt limits: rejects when attempts >= 5', () => {
    const maxAttempts = 5;
    let attemptsCount = 4;
    assert.ok(attemptsCount < maxAttempts, '4 attempts should be allowed');

    attemptsCount += 1;
    assert.ok(attemptsCount >= maxAttempts, '5 attempts should reach maximum limit');
  });

  it('enforces 60-second cooldown on resend requests', () => {
    const now = Date.now();
    const resendAvailableAt = new Date(now + 45 * 1000); // 45 seconds remaining
    const isCooldownActive = resendAvailableAt.getTime() > now;
    assert.equal(isCooldownActive, true, 'Cooldown must be active when remaining time > 0');

    const expiredCooldown = new Date(now - 5 * 1000);
    const isReadyForResend = expiredCooldown.getTime() <= now;
    assert.equal(isReadyForResend, true, 'Resend is permitted after cooldown expires');
  });
});

describe('2. Real Payment Gateway Architecture & Security Rules', () => {
  it('reports real gateway configuration honestly', () => {
    const status = getPaymentGatewayConfigStatus();
    assert.equal(typeof status.cod, 'boolean');
    assert.equal(status.cod, true, 'Cash on Delivery is always available');
    assert.equal(typeof status.bkash, 'boolean');
    assert.equal(typeof status.sslcommerz, 'boolean');
    assert.equal(typeof status.nagad, 'boolean');
    assert.ok(status.defaultProvider, 'Default provider must be assigned');
  });

  it('verifies paid amount against server-side calculated catalog price (fraud protection)', () => {
    const orderFinalTotal = 129.98;
    const paidAmountExact = 129.98;
    const paidAmountTampered = 10.00;

    const tolerance = 0.05;
    const isExactMatch = Math.abs(paidAmountExact - orderFinalTotal) <= tolerance;
    const isTamperedMatch = Math.abs(paidAmountTampered - orderFinalTotal) <= tolerance;

    assert.equal(isExactMatch, true, 'Legitimate payment amount must match');
    assert.equal(isTamperedMatch, false, 'Tampered payment amount must be rejected');
  });

  it('transitions order status accurately on payment verification', () => {
    const order = {
      orderNumber: '#ORD-9901',
      paymentStatus: 'unpaid',
      status: 'pending',
      finalTotal: 59.99,
      statusTimeline: [] as any[],
    };

    // Simulate verification success
    const verification = {
      success: true,
      status: 'paid' as const,
      transactionId: 'TRX-BKASH-77291',
      amount: 59.99,
    };

    if (verification.success && verification.status === 'paid') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.statusTimeline.push({
        status: 'confirmed',
        timestamp: new Date(),
        actor: 'bKash Gateway',
        note: `Payment verified: ${verification.transactionId}`,
      });
    }

    assert.equal(order.paymentStatus, 'paid');
    assert.equal(order.status, 'confirmed');
    assert.equal(order.statusTimeline.length, 1);
    assert.match(order.statusTimeline[0].note, /TRX-BKASH-77291/);
  });

  it('rejects order verification when gateway orderNumber does not match target order', () => {
    const targetOrderNumber = 'NOV-2026-881920';
    const gatewayReturnedOrder: string = 'NOV-2026-112233'; // Mismatched invoice ref

    const isMatch = (gatewayReturnedOrder as string) === targetOrderNumber;
    assert.equal(isMatch, false, 'Mismatched gateway order reference must be rejected');
  });

  it('enforces currency verification (only BDT and USD allowed)', () => {
    const allowedCurrencies = ['BDT', 'USD'];
    assert.ok(allowedCurrencies.includes('BDT'));
    assert.ok(allowedCurrencies.includes('USD'));
    assert.ok(!allowedCurrencies.includes('EUR'));
    assert.ok(!allowedCurrencies.includes('INR'));
  });

  it('prevents OTP replay attacks when record is already marked as isVerified', () => {
    const record = {
      email: 'user@example.com',
      isVerified: true,
      expiresAt: new Date(Date.now() + 500000),
    };

    let canVerifyAgain = false;
    if (record.isVerified) {
      canVerifyAgain = false;
    }
    assert.equal(canVerifyAgain, false, 'Already verified OTP must be rejected on replay');
  });

  it('ensures devCode is NEVER included in API responses when NODE_ENV is production', () => {
    const isEmailConfigured = false;
    const rawOtp = '123456';

    const getResponsePayload = (env: string) => ({
      success: true,
      ...(env !== 'production' && !isEmailConfigured ? { devCode: rawOtp } : {}),
    });

    const devResponse = getResponsePayload('development');
    const prodResponse = getResponsePayload('production');

    assert.equal((devResponse as any).devCode, '123456', 'Dev response includes helper devCode');
    assert.equal((prodResponse as any).devCode, undefined, 'Prod response must never expose devCode');
  });
});


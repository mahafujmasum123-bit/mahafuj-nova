import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { UserModel, IUserAddress, UserRole } from '../models/User';
import { OtpVerificationModel } from '../models/OtpVerification';
import { generateToken, requireAuth } from '../middleware/auth';
import { sendEmail, generateOtpEmailTemplate, isEmailConfigured } from '../services/emailService';
import { isDbConnected } from '../db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'novara-commerce-super-secret-jwt-key-2026';

// In-memory fallback OTP store when Atlas is offline
export const inMemoryOtps = new Map<string, any>();

// Helper to securely hash an OTP code with HMAC-SHA256
export function hashOtp(email: string, otp: string): string {
  return crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${email.toLowerCase().trim()}:${otp.trim()}`)
    .digest('hex');
}

// Generate cryptographically secure 6-digit numeric OTP
export function generateSecureNumericOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

// In-memory fallback user store when Atlas is not configured yet
export let inMemoryUsers: any[] = [
  {
    id: 'user-admin',
    name: 'Novara Admin',
    email: 'admin@novara.com',
    passwordHash: bcrypt.hashSync('Admin@123', 10),
    role: 'super_admin' as UserRole,
    phone: '+880 1711 000000',
    addresses: [
      {
        id: 'addr-admin',
        name: 'Novara HQ',
        phone: '+880 1711 000000',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Gulshan',
        street: 'Road 11, Banani',
        landmark: 'Near Kemal Ataturk Ave',
        isDefault: true,
      },
    ],
    isVerified: true,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'user-customer',
    name: 'Sarah Khan',
    email: 'customer@example.com',
    passwordHash: bcrypt.hashSync('Customer@123', 10),
    role: 'customer' as UserRole,
    phone: '+880 1812 345678',
    addresses: [
      {
        id: 'addr-1',
        name: 'Sarah Khan',
        phone: '+880 1812 345678',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Dhanmondi',
        street: 'House 42, Road 9/A',
        landmark: 'Opposite Dhanmondi Lake',
        isDefault: true,
      },
    ],
    isVerified: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'user-guest-sample',
    name: 'Rafiul Islam',
    email: 'rafiul@example.com',
    passwordHash: bcrypt.hashSync('Rafiul@123', 10),
    role: 'customer' as UserRole,
    phone: '+880 1712 998877',
    addresses: [],
    isVerified: true,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// Email service status check
router.get('/email-service-status', (req: Request, res: Response) => {
  const configured = isEmailConfigured();
  res.json({
    success: true,
    configured,
    provider: 'Resend',
    sender: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    message: configured
      ? 'Resend API key is configured and active.'
      : 'RESEND_API_KEY is not set. In development/testing, OTP code is logged and returned in dev hints.',
  });
});

// Request an OTP (for registration, password reset, or email verification)
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email, purpose = 'registration', metadata } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ success: false, error: 'A valid email address is required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Account enumeration protection / existence check
    if (purpose === 'registration') {
      let existing = false;
      if (isDbConnected()) {
        const found = await UserModel.findOne({ email: normalizedEmail });
        if (found) existing = true;
      } else {
        existing = Boolean(inMemoryUsers.find((u) => u.email === normalizedEmail));
      }

      if (existing) {
        res.status(400).json({ success: false, error: 'An account with this email address already exists. Please sign in.' });
        return;
      }
    } else if (purpose === 'password_reset') {
      let existing = false;
      if (isDbConnected()) {
        const found = await UserModel.findOne({ email: normalizedEmail });
        if (found) existing = true;
      } else {
        existing = Boolean(inMemoryUsers.find((u) => u.email === normalizedEmail));
      }

      // If user does not exist, do not leak this directly, but avoid sending OTP
      if (!existing) {
        // Return friendly message with timing parity to prevent enumeration
        res.json({
          success: true,
          message: 'If an account is associated with this email, a verification code has been sent.',
          cooldownSeconds: 60,
        });
        return;
      }
    }

    // Rate-limiting & 60s cooldown check
    const now = new Date();
    let currentRecord: any = null;
    if (isDbConnected()) {
      currentRecord = await OtpVerificationModel.findOne({ email: normalizedEmail, purpose });
    } else {
      currentRecord = inMemoryOtps.get(`${normalizedEmail}:${purpose}`);
    }

    if (currentRecord && currentRecord.resendAvailableAt > now) {
      const remainingSeconds = Math.ceil((currentRecord.resendAvailableAt.getTime() - now.getTime()) / 1000);
      res.status(429).json({
        success: false,
        error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
        remainingSeconds,
      });
      return;
    }

    // Generate secure 6-digit OTP and HMAC-SHA256 hash
    const rawOtp = generateSecureNumericOtp();
    const otpHash = hashOtp(normalizedEmail, rawOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const resendAvailableAt = new Date(Date.now() + 60 * 1000); // 60 seconds

    // Securely prepare metadata if registration
    const storedMetadata = metadata ? { ...metadata } : {};
    if (storedMetadata.password) {
      storedMetadata.passwordHash = await bcrypt.hash(storedMetadata.password, 10);
      delete storedMetadata.password;
    }

    // Persist OTP record
    if (isDbConnected()) {
      await OtpVerificationModel.findOneAndUpdate(
        { email: normalizedEmail, purpose },
        {
          $set: {
            otpHash,
            expiresAt,
            attemptsCount: 0,
            maxAttempts: 5,
            resendAvailableAt,
            isVerified: false,
            metadata: storedMetadata,
          },
        },
        { upsert: true, new: true }
      );
    } else {
      inMemoryOtps.set(`${normalizedEmail}:${purpose}`, {
        email: normalizedEmail,
        otpHash,
        purpose,
        expiresAt,
        attemptsCount: 0,
        maxAttempts: 5,
        resendAvailableAt,
        isVerified: false,
        metadata: storedMetadata,
        createdAt: now,
      });
    }

    // Dispatch branded email template via Resend
    const emailSubject =
      purpose === 'password_reset'
        ? 'Your ShopMax Password Reset Code'
        : 'Your ShopMax Verification Code';

    const emailContent = generateOtpEmailTemplate({
      otp: rawOtp,
      purpose,
      recipientName: storedMetadata.name || 'Valued Customer',
      expiresInMinutes: 10,
    });

    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: emailSubject,
      html: emailContent.html,
      text: emailContent.text,
    });

    res.json({
      success: true,
      message: 'Verification code sent successfully to your email address.',
      cooldownSeconds: 60,
      expiresAt: expiresAt.toISOString(),
      emailConfigured: isEmailConfigured(),
      // In production mode, OTP is NEVER returned in response. In local dev/testing without RESEND_API_KEY, return devCode.
      ...(process.env.NODE_ENV !== 'production' && !isEmailConfigured() ? { devCode: rawOtp } : {}),
    });
  } catch (err: any) {
    console.error('send-otp error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to dispatch verification code' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp, purpose = 'registration' } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, error: 'Email and OTP code are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    let record: any = null;
    if (isDbConnected()) {
      record = await OtpVerificationModel.findOne({ email: normalizedEmail, purpose });
    } else {
      record = inMemoryOtps.get(`${normalizedEmail}:${purpose}`);
    }

    if (!record) {
      res.status(400).json({
        success: false,
        error: 'No active verification code found for this email. Please request a new code.',
      });
      return;
    }

    // Check if already used (replay attack prevention)
    if (record.isVerified) {
      res.status(400).json({
        success: false,
        error: 'This verification code has already been used. Please request a new code.',
      });
      return;
    }

    // Check expiration
    const now = new Date();
    if (new Date(record.expiresAt) < now) {
      res.status(400).json({
        success: false,
        error: 'This verification code has expired (10-minute validity). Please request a new code.',
      });
      return;
    }

    // Check attempt limits (max 5)
    if (record.attemptsCount >= record.maxAttempts) {
      res.status(429).json({
        success: false,
        error: 'Maximum verification attempts (5) exceeded. Please request a new code.',
      });
      return;
    }

    // Increment attempts
    record.attemptsCount += 1;
    if (isDbConnected()) {
      await OtpVerificationModel.updateOne(
        { _id: record._id },
        { $inc: { attemptsCount: 1 } }
      );
    }

    // Cryptographic constant-time comparison
    const computedHash = hashOtp(normalizedEmail, cleanOtp);
    const hashBufferA = Buffer.from(computedHash, 'hex');
    const hashBufferB = Buffer.from(record.otpHash, 'hex');

    const isValid =
      hashBufferA.length === hashBufferB.length &&
      crypto.timingSafeEqual(hashBufferA, hashBufferB);

    if (!isValid) {
      const remaining = Math.max(0, record.maxAttempts - record.attemptsCount);
      res.status(400).json({
        success: false,
        error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        remainingAttempts: remaining,
      });
      return;
    }

    // Mark as verified
    record.isVerified = true;
    if (isDbConnected()) {
      await OtpVerificationModel.updateOne(
        { _id: record._id },
        { $set: { isVerified: true } }
      );
    }

    // Purpose-specific fulfillment:
    if (purpose === 'registration') {
      const meta = record.metadata || {};
      const userName = meta.name || normalizedEmail.split('@')[0];
      const passwordHash = meta.passwordHash || (await bcrypt.hash('User@123', 10));
      const userPhone = meta.phone || '';

      let createdUser: any = null;

      if (isDbConnected()) {
        createdUser = await UserModel.create({
          name: userName,
          email: normalizedEmail,
          passwordHash,
          phone: userPhone,
          role: 'customer',
          addresses: [],
          isVerified: true,
        });
      } else {
        createdUser = {
          id: `user-${Date.now()}`,
          name: userName,
          email: normalizedEmail,
          passwordHash,
          phone: userPhone,
          role: 'customer' as UserRole,
          addresses: [],
          isVerified: true,
          createdAt: new Date().toISOString(),
        };
        inMemoryUsers.push(createdUser);
      }

      const token = generateToken({
        userId: createdUser._id ? createdUser._id.toString() : createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
        name: createdUser.name,
      });

      res.status(201).json({
        success: true,
        message: 'Email verified and account created successfully!',
        token,
        user: {
          id: createdUser._id ? createdUser._id.toString() : createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          phone: createdUser.phone,
          addresses: createdUser.addresses,
        },
      });
      return;
    }

    if (purpose === 'password_reset') {
      // Issue a short-lived reset token (15 mins)
      const resetToken = jwt.sign(
        { email: normalizedEmail, purpose: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({
        success: true,
        message: 'Email verified successfully. You may now choose a new password.',
        resetToken,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (err: any) {
    console.error('verify-otp error:', err);
    res.status(500).json({ success: false, error: err.message || 'OTP verification failed' });
  }
});

// Reset Password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      res.status(400).json({ success: false, error: 'Reset token and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      return;
    }

    let payload: any;
    try {
      payload = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired password reset token' });
      return;
    }

    if (payload.purpose !== 'password_reset' || !payload.email) {
      res.status(401).json({ success: false, error: 'Invalid reset token format' });
      return;
    }

    const email = payload.email.toLowerCase().trim();
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    if (isDbConnected()) {
      const user = await UserModel.findOne({ email });
      if (!user) {
        res.status(404).json({ success: false, error: 'User account not found' });
        return;
      }
      user.passwordHash = newPasswordHash;
      await user.save();
    } else {
      const user = inMemoryUsers.find((u) => u.email === email);
      if (!user) {
        res.status(404).json({ success: false, error: 'User account not found' });
        return;
      }
      user.passwordHash = newPasswordHash;
    }

    res.json({
      success: true,
      message: 'Password has been successfully updated. You can now sign in with your new password.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Password reset failed' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email, and password are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const existing = await UserModel.findOne({ email: normalizedEmail });
      if (existing) {
        res.status(400).json({ success: false, error: 'An account with this email already exists' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await UserModel.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone?.trim(),
        role: role === 'admin' ? 'admin' : 'customer',
        addresses: [],
        isVerified: true,
      });

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      });

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          addresses: user.addresses,
        },
      });
      return;
    }

    // In-memory fallback
    const existing = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (existing) {
      res.status(400).json({ success: false, error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone?.trim() || '',
      role: (role === 'admin' ? 'admin' : 'customer') as UserRole,
      addresses: [],
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    inMemoryUsers.push(newUser);

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        addresses: newUser.addresses,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await UserModel.findOne({ email: normalizedEmail });
      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      });

      res.json({
        success: true,
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          addresses: user.addresses,
        },
      });
      return;
    }

    // In-memory fallback
    const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Login failed' });
  }
});

// Me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    if (isDbConnected()) {
      const user = await UserModel.findById(userId).select('-passwordHash');
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          addresses: user.addresses,
        },
      });
      return;
    }

    const user = inMemoryUsers.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Saved address add/update
router.post('/address', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, phone, division, district, upazila, street, landmark, isDefault } = req.body;

    if (!name || !phone || !division || !district || !street) {
      res.status(400).json({ success: false, error: 'Recipient name, phone, division, district, and street are required' });
      return;
    }

    const newAddress: IUserAddress = {
      id: `addr-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      division: division.trim(),
      district: district.trim(),
      upazila: (upazila || '').trim(),
      street: street.trim(),
      landmark: landmark?.trim(),
      isDefault: Boolean(isDefault),
    };

    if (isDbConnected()) {
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      if (newAddress.isDefault) {
        user.addresses.forEach((a: IUserAddress) => (a.isDefault = false));
      }
      user.addresses.push(newAddress);
      await user.save();

      res.status(201).json({ success: true, addresses: user.addresses, address: newAddress });
      return;
    }

    const user = inMemoryUsers.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (newAddress.isDefault) {
      user.addresses.forEach((a: any) => (a.isDefault = false));
    }
    user.addresses.push(newAddress);

    res.status(201).json({ success: true, addresses: user.addresses, address: newAddress });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// OAuth status (Honest reporting: never fake OAuth success)
router.get('/oauth-status', (req: Request, res: Response) => {
  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const facebookConfigured = Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);

  res.json({
    success: true,
    providers: {
      google: {
        available: googleConfigured,
        message: googleConfigured ? 'Ready' : 'GOOGLE_CLIENT_ID not configured in environment',
      },
      facebook: {
        available: facebookConfigured,
        message: facebookConfigured ? 'Ready' : 'FACEBOOK_APP_ID not configured in environment',
      },
    },
  });
});

export default router;

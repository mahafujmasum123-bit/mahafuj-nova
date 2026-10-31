import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { closeAuthModal, setAuthModalMode, setCredentials } from '../../features/auth/authSlice';
import { addToast } from '../../features/toast/toastSlice';
import { Modal } from './Modal';
import {
  Mail,
  Lock,
  User,
  Phone,
  LogIn,
  UserPlus,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthModalOpen, authModalMode } = useAppSelector((state) => state.auth);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpStep, setOtpStep] = useState<'form' | 'otp_verify' | 'new_password'>('form');
  const [cooldown, setCooldown] = useState<number>(0);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset steps and error when modal opens or mode changes
  useEffect(() => {
    setOtpStep('form');
    setError(null);
    setDevCodeHint(null);
    setOtpDigits(['', '', '', '', '', '']);
  }, [authModalMode, isAuthModalOpen]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  if (!isAuthModalOpen) return null;

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    const nextIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  // Submit Step 1: Send OTP for registration or password reset
  const handleInitiateOtp = async (purpose: 'registration' | 'password_reset') => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          purpose,
          metadata: purpose === 'registration' ? { name, password, phone } : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch verification code');
      }

      setCooldown(data.cooldownSeconds || 60);
      if (data.devCode) {
        setDevCodeHint(data.devCode);
      }
      setOtpStep('otp_verify');
      dispatch(
        addToast({
          type: 'success',
          title: 'Code Sent',
          message: data.message || `A 6-digit code has been dispatched to ${email}`,
        })
      );
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);

    const purpose = authModalMode === 'forgot' ? 'password_reset' : 'registration';

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          purpose,
          metadata: purpose === 'registration' ? { name, password, phone } : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setCooldown(data.cooldownSeconds || 60);
      if (data.devCode) {
        setDevCodeHint(data.devCode);
      }
      setOtpDigits(['', '', '', '', '', '']);
      dispatch(
        addToast({
          type: 'info',
          title: 'Code Resent',
          message: 'A fresh verification code has been dispatched to your email.',
        })
      );
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setResending(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    const purpose = authModalMode === 'forgot' ? 'password_reset' : 'registration';

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: fullOtp, purpose }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      if (purpose === 'registration') {
        dispatch(setCredentials({ user: data.user, token: data.token }));
        dispatch(
          addToast({
            type: 'success',
            title: 'Account Verified & Created',
            message: `Welcome to ShopMax, ${data.user.name}!`,
          })
        );
        dispatch(closeAuthModal());
      } else if (purpose === 'password_reset') {
        setResetToken(data.resetToken);
        setOtpStep('new_password');
        dispatch(
          addToast({
            type: 'success',
            title: 'Email Verified',
            message: 'Please choose your new password below.',
          })
        );
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Save New Password after reset verification
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Password update failed');
      }

      dispatch(
        addToast({
          type: 'success',
          title: 'Password Updated',
          message: 'Your password was changed. You can now sign in with your new credentials.',
        })
      );
      dispatch(setAuthModalMode('login'));
      setPassword('');
      setOtpStep('form');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Direct Login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      dispatch(setCredentials({ user: data.user, token: data.token }));
      dispatch(
        addToast({
          type: 'success',
          title: 'Welcome Back!',
          message: `Signed in as ${data.user.name} (${data.user.role})`,
        })
      );
      dispatch(closeAuthModal());
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Quick dev demo logins
  const handleDemoLogin = async (role: 'admin' | 'customer') => {
    setLoading(true);
    setError(null);
    try {
      const creds =
        role === 'admin'
          ? { email: 'admin@novara.com', password: 'Admin@123' }
          : { email: 'customer@example.com', password: 'Customer@123' };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Demo login failed');

      dispatch(setCredentials({ user: data.user, token: data.token }));
      dispatch(
        addToast({
          type: 'success',
          title: 'Signed In',
          message: `Logged in as ${data.user.name} (${data.user.role})`,
        })
      );
      dispatch(closeAuthModal());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={() => dispatch(closeAuthModal())}
      title={
        otpStep === 'otp_verify'
          ? 'Email Verification Code'
          : otpStep === 'new_password'
          ? 'Set New Password'
          : authModalMode === 'login'
          ? 'Sign in to ShopMax'
          : authModalMode === 'register'
          ? 'Create a Customer Account'
          : 'Reset Your Password'
      }
      description={
        otpStep === 'otp_verify'
          ? `Enter the 6-digit code sent to ${email}`
          : otpStep === 'new_password'
          ? 'Create a strong new password for your account'
          : 'Orders, reviews, and address management require an authenticated customer account.'
      }
      maxWidth="md"
    >
      {/* Tab toggle (only show in initial form step) */}
      {otpStep === 'form' && (
        <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              dispatch(setAuthModalMode('login'));
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              authModalMode === 'login'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(setAuthModalMode('register'));
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              authModalMode === 'register'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Create Account
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* DEV CODE HINT BANNER (when email service is unconfigured or in development) */}
      {devCodeHint && otpStep === 'otp_verify' && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Test Verification Code: <strong className="font-mono text-sm tracking-wider text-amber-950">{devCodeHint}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const digits = devCodeHint.split('');
              setOtpDigits(digits);
            }}
            className="text-[11px] font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. STEP: OTP VERIFICATION VIEW                                 */}
      {/* ------------------------------------------------------------- */}
      {otpStep === 'otp_verify' && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <p className="text-xs text-gray-500">
              We have dispatched a 6-digit verification code to
            </p>
            <p className="text-xs font-bold text-gray-900 flex items-center justify-center gap-1.5">
              <span>{email}</span>
              <button
                type="button"
                onClick={() => setOtpStep('form')}
                className="text-emerald-700 hover:underline font-normal text-[11px] cursor-pointer"
              >
                (Change)
              </button>
            </p>
          </div>

          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-2 sm:gap-2.5">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={handleOtpPaste}
                autoFocus={idx === 0}
                className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white transition shadow-2xs"
              />
            ))}
          </div>

          {/* Resend Cooldown and Action */}
          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setOtpStep('form')}
              className="text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {cooldown > 0 ? (
              <span className="text-gray-400 font-medium text-[11px]">
                Resend code in <strong className="text-gray-700">{cooldown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                disabled={resending}
                onClick={handleResendOtp}
                className="text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1 underline cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otpDigits.join('').length !== 6}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify &amp; Continue</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. STEP: NEW PASSWORD (AFTER FORGOT PASSWORD OTP VERIFIED)     */}
      {/* ------------------------------------------------------------- */}
      {otpStep === 'new_password' && (
        <form onSubmit={handleSaveNewPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Save New Password &amp; Sign In</span>
            )}
          </button>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. STEP: LOGIN FORM                                            */}
      {/* ------------------------------------------------------------- */}
      {otpStep === 'form' && authModalMode === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-gray-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  dispatch(setAuthModalMode('forgot'));
                  setError(null);
                }}
                className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. STEP: REGISTER FORM (TRIGGERS REAL EMAIL OTP DISPATCH)     */}
      {/* ------------------------------------------------------------- */}
      {otpStep === 'form' && authModalMode === 'register' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleInitiateOtp('registration');
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Khan"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              A 6-digit verification code will be sent to this email address.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phone Number (Bangladesh)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 17XX XXXXXX"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Create Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Continue to Email Verification</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. STEP: FORGOT PASSWORD (EMAIL ENTRY)                         */}
      {/* ------------------------------------------------------------- */}
      {otpStep === 'form' && authModalMode === 'forgot' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleInitiateOtp('password_reset');
          }}
          className="space-y-4"
        >
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-800">
            Enter your account email address and we'll send a 6-digit verification code to reset your password.
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => dispatch(setAuthModalMode('login'))}
              className="text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Send Reset Code</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Honest 3P OAuth integration note */}
      {otpStep === 'form' && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="text-[11px] text-gray-400 text-center mb-2">Or continue with</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                dispatch(
                  addToast({
                    type: 'info',
                    title: 'Google OAuth',
                    message: 'Google Client ID requires configuration in environment variables.',
                  })
                )
              }
              className="flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() =>
                dispatch(
                  addToast({
                    type: 'info',
                    title: 'Facebook OAuth',
                    message: 'Facebook App ID requires configuration in environment variables.',
                  })
                )
              }
              className="flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>
        </div>
      )}

      {/* One-click demo test accounts */}
      {otpStep === 'form' && (
        <div className="mt-4 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Quick Demo Testing (1-Click)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => handleDemoLogin('customer')}
              className="py-1.5 px-2.5 bg-white border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 hover:bg-emerald-50 transition shadow-xs text-left cursor-pointer"
            >
              👤 Customer (Sarah)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="py-1.5 px-2.5 bg-emerald-800 text-white rounded-lg text-xs font-medium hover:bg-emerald-900 transition shadow-xs text-left cursor-pointer"
            >
              ⚡ Super Admin
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

import dotenv from 'dotenv';
dotenv.config();

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'resend' | 'unconfigured';
}

/**
 * Check if the email delivery provider is configured
 */
export function isEmailConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY;
  return Boolean(apiKey && apiKey.trim() !== '');
}

/**
 * Professional HTML template for Email OTP verification
 */
export function generateOtpEmailTemplate(params: {
  otp: string;
  recipientName?: string;
  purpose: 'registration' | 'password_reset' | 'login';
  expiresInMinutes?: number;
}): { html: string; text: string } {
  const { otp, recipientName = 'Customer', purpose, expiresInMinutes = 10 } = params;

  const purposeLabels = {
    registration: 'Verify Your Email Address',
    password_reset: 'Reset Your Account Password',
    login: 'One-Time Sign In Verification',
  };

  const actionDescriptions = {
    registration: 'Thank you for choosing Novara Commerce / ShopMax. Please use the following 6-digit verification code to complete your registration.',
    password_reset: 'We received a request to reset the password for your account. Please use the following 6-digit verification code to proceed.',
    login: 'Please use the following 6-digit verification code to securely access your account.',
  };

  const subjectHeader = purposeLabels[purpose] || 'Your Verification Code';
  const actionText = actionDescriptions[purpose] || 'Please use this code to verify your action.';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjectHeader} — ShopMax</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f3faf7;
      color: #111827;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f3faf7;
      padding: 40px 16px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #d1fae5;
      box-shadow: 0 10px 25px -5px rgba(0, 135, 90, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #0c261e 0%, #00875a 100%);
      padding: 36px 32px;
      text-align: center;
      color: #ffffff;
    }
    .logo-badge {
      display: inline-block;
      width: 48px;
      height: 48px;
      line-height: 48px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      margin-bottom: 12px;
      font-size: 24px;
    }
    .brand-title {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      margin: 4px 0 0 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #a7f3d0;
    }
    .body-content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .description {
      font-size: 14px;
      line-height: 1.6;
      color: #4b5563;
      margin-top: 0;
      margin-bottom: 28px;
    }
    .otp-card {
      background: linear-gradient(180deg, #ecfdf5 0%, #f0fdf4 100%);
      border: 2px dashed #059669;
      border-radius: 16px;
      padding: 24px 20px;
      text-align: center;
      margin-bottom: 28px;
    }
    .otp-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700;
      color: #047857;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #064e3b;
      margin: 0;
      display: inline-block;
    }
    .otp-expiry {
      margin-top: 10px;
      font-size: 12px;
      color: #059669;
      font-weight: 500;
    }
    .security-notice {
      background-color: #f9fafb;
      border-radius: 12px;
      padding: 16px 20px;
      border-left: 4px solid #10b981;
      margin-bottom: 24px;
    }
    .security-notice-title {
      font-size: 12px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px 0;
    }
    .security-notice-text {
      font-size: 12px;
      line-height: 1.5;
      color: #6b7280;
      margin: 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px 32px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    .footer-text {
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.5;
      margin: 0 0 6px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-badge">🛍️</div>
        <h1 class="brand-title">ShopMax</h1>
        <p class="brand-subtitle">Better Products, Better Life</p>
      </div>
      
      <div class="body-content">
        <h2 class="greeting">Hello ${recipientName},</h2>
        <p class="description">${actionText}</p>
        
        <div class="otp-card">
          <div class="otp-label">One-Time Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-expiry">⏱️ Expires in ${expiresInMinutes} minutes</div>
        </div>
        
        <div class="security-notice">
          <p class="security-notice-title">🛡️ Security Reminder</p>
          <p class="security-notice-text">
            Never share this OTP with anyone, including ShopMax or Novara representatives. If you did not initiate this request, please ignore this email.
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">© 2026 Novara Commerce / ShopMax Bangladesh. All rights reserved.</p>
        <p class="footer-text">Gulshan-2, Dhaka 1212, Bangladesh</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
ShopMax — Better Products, Better Life
=======================================
${subjectHeader}

Hello ${recipientName},

${actionText}

YOUR VERIFICATION CODE: ${otp}
(Expires in ${expiresInMinutes} minutes)

SECURITY REMINDER:
Never share this code with anyone. If you did not request this verification, please ignore this message.

© 2026 Novara Commerce / ShopMax Bangladesh.
Gulshan-2, Dhaka 1212, Bangladesh
  `.trim();

  return { html, text };
}

/**
 * Send email using the configured Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'Novara Commerce <onboarding@resend.dev>';

  if (!apiKey || apiKey.trim() === '') {
    console.warn(
      '⚠️ [Email Delivery] RESEND_API_KEY is not configured in .env. Email delivery will be simulated in development mode.'
    );
    return {
      success: false,
      error: 'RESEND_API_KEY environment variable is not configured',
      provider: 'unconfigured',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('❌ [Resend API Error]:', data);
      return {
        success: false,
        error: data.message || `Resend API returned HTTP ${response.status}`,
        provider: 'resend',
      };
    }

    console.log(`✅ [Email Delivery] OTP successfully sent to ${options.to} (ID: ${data.id})`);
    return {
      success: true,
      messageId: data.id,
      provider: 'resend',
    };
  } catch (error: any) {
    console.error('❌ [Email Delivery Exception]:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to email delivery provider',
      provider: 'resend',
    };
  }
}

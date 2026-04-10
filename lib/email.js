import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_PORT === '465',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

const FROM = process.env.EMAIL_FROM || 'Milan Matrimony <noreply@milan.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendOTPEmail(email, name, otp, type = 'EMAIL_VERIFY') {
  const subjects = {
    EMAIL_VERIFY: 'Verify your Milan Matrimony account',
    PASSWORD_RESET: 'Reset your Milan Matrimony password',
    LOGIN_OTP: 'Your Milan Matrimony login OTP',
  };

  const titles = {
    EMAIL_VERIFY: 'Email Verification',
    PASSWORD_RESET: 'Password Reset',
    LOGIN_OTP: 'Login OTP',
  };

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: subjects[type] || 'Milan Matrimony OTP',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#ec4899,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">💕 Milan</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Matrimony Platform</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px 32px;">
          <h2 style="color:#1f2937;margin:0 0 8px;font-size:22px;">${titles[type]}</h2>
          <p style="color:#6b7280;margin:0 0 32px;font-size:15px;">Hi ${name || 'there'}, use the OTP below:</p>
          <!-- OTP Box -->
          <div style="background:linear-gradient(135deg,#fdf2f8,#f5f3ff);border:2px solid #ec4899;border-radius:12px;padding:24px;text-align:center;margin:0 0 32px;">
            <p style="color:#6b7280;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Your OTP</p>
            <p style="color:#ec4899;font-size:42px;font-weight:800;letter-spacing:12px;margin:0;">${otp}</p>
            <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">Valid for 10 minutes</p>
          </div>
          <p style="color:#9ca3af;font-size:13px;margin:0;">If you didn't request this, please ignore this email. Do not share this OTP with anyone.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 Milan Matrimony. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendAdminVerificationEmail(email, name, trialDays = 1) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: '🎉 Your Milan Matrimony profile is verified!',
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#ec4899,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">💕 Milan</h1>
        </td></tr>
        <tr><td style="padding:40px 32px;text-align:center;">
          <div style="font-size:64px;margin-bottom:16px;">✅</div>
          <h2 style="color:#1f2937;margin:0 0 12px;">Profile Verified!</h2>
          <p style="color:#6b7280;margin:0 0 16px;">Hi ${name}, your Milan Matrimony profile has been verified by our team.</p>
          ${trialDays > 0 ? `
          <div style="background:linear-gradient(135deg,#f5f3ff,#fdf2f8);border:2px solid #8b5cf6;border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="color:#7c3aed;font-size:22px;font-weight:800;margin:0 0 4px;">🎁 ${trialDays}-Day Free Trial</p>
            <p style="color:#6b7280;font-size:13px;margin:0;">Full premium access starts now — chat, view contacts, and more!</p>
          </div>` : ''}
          <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Login now to start finding your perfect match!</p>
          <a href="${APP_URL}/login" style="background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">Login Now →</a>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">© 2026 Milan Matrimony. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendWelcomeEmail(email, name) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Welcome to Milan Matrimony! 💕',
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#ec4899,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">💕 Milan</h1>
        </td></tr>
        <tr><td style="padding:40px 32px;">
          <h2 style="color:#1f2937;margin:0 0 12px;">Welcome, ${name}! 🎉</h2>
          <p style="color:#6b7280;margin:0 0 16px;">Thank you for registering on Milan Matrimony. Your account is under review by our team.</p>
          <p style="color:#6b7280;margin:0 0 24px;">You will receive an email once your profile is verified and you can start using the platform.</p>
          <p style="color:#9ca3af;font-size:13px;">This usually takes 24-48 hours.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendPremiumActivationEmail(email, name, plan, expiry) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `🌟 ${plan} Plan Activated — Milan Matrimony`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">⭐ Premium Activated</h1>
        </td></tr>
        <tr><td style="padding:40px 32px;text-align:center;">
          <h2 style="color:#1f2937;margin:0 0 12px;">Congratulations, ${name}!</h2>
          <p style="color:#6b7280;margin:0 0 8px;">Your <strong>${plan}</strong> plan is now active.</p>
          <p style="color:#6b7280;margin:0 0 24px;">Valid until: <strong>${new Date(expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
          <a href="${APP_URL}/dashboard" style="background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block;">Go to Dashboard</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

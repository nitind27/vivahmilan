import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';
import { randomUUID } from 'crypto';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const { email, type = 'EMAIL_VERIFY' } = await req.json();

    if (!email)
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    // ── EMAIL_VERIFY: check pending_registration first ──────────────────────
    if (type === 'EMAIL_VERIFY') {
      const pending = await queryOne(
        'SELECT * FROM pending_registration WHERE email = ?',
        [email]
      );

      if (pending) {
        // Generate new OTP for pending registration
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await execute(
          'UPDATE pending_registration SET otp = ?, otpExpiresAt = ? WHERE email = ?',
          [otp, expiresAt, pending.email]
        );

        await sendOTPEmail(pending.email, pending.name, otp, type);

        return NextResponse.json({ success: true, message: 'OTP sent to your email' });
      }
    }

    // ── Non-registration OTP (PASSWORD_RESET, etc.) ──────────────────────────
    const user = await queryOne('SELECT id, name FROM `user` WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate old OTPs
    await execute(
      'UPDATE otp SET used = 1 WHERE userId = ? AND type = ? AND used = 0',
      [user.id, type]
    );

    await execute(
      `INSERT INTO otp (id, userId, code, type, expiresAt, used, createdAt)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [randomUUID(), user.id, otp, type, expiresAt]
    );

    await sendOTPEmail(email, user.name, otp, type);

    return NextResponse.json({ success: true, message: 'OTP sent to your email' });

  } catch (err) {
    console.error('Resend-otp error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

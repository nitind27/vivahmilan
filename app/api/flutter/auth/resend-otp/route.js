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
      return NextResponse.json({ error: 'email is required' }, { status: 400 });

    const user = await queryOne('SELECT id, name FROM `user` WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Invalidate old OTPs
    await execute(
      'UPDATE otp SET used = 1 WHERE userId = ? AND type = ? AND used = 0',
      [user.id, type]
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await execute(
      `INSERT INTO otp (id, userId, code, type, expiresAt, used, createdAt)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [randomUUID(), user.id, otp, type, expiresAt]
    );

    await sendOTPEmail(email, user.name, otp, type);

    return NextResponse.json({ success: true, message: 'OTP sent to your email' });

  } catch (err) {
    console.error('Flutter resend-otp error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

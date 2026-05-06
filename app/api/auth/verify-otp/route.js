import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req) {
  try {
    const { email, otp, type = 'EMAIL_VERIFY' } = await req.json();

    if (!email || !otp)
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });

    // ── EMAIL_VERIFY: check pending_registration first ──────────────────────
    if (type === 'EMAIL_VERIFY') {
      const pending = await queryOne(
        'SELECT * FROM pending_registration WHERE email = ?',
        [email]
      );

      if (pending) {
        // Validate OTP from pending_registration
        if (new Date() > new Date(pending.otpExpiresAt))
          return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
        if (pending.otp !== String(otp))
          return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });

        // OTP is valid — now create the actual user and profile
        const userId = randomUUID();
        const profileId = randomUUID();
        const now = new Date();

        await execute(
          `INSERT INTO \`user\` (id, name, email, password, phone, role, isActive, isVerified,
            adminVerified, verificationBadge, isPremium, profileBoost, phoneVerified,
            loginOtpEnabled, emailVerified, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'USER', 1, 1, 0, 0, 0, 0, 0, 0, NOW(), ?, ?)`,
          [userId, pending.name, pending.email, pending.password, pending.phone || null, now, now]
        );

        await execute(
          `INSERT INTO profile (id, userId, gender, profileComplete, maritalStatus, smoking, drinking, hidePhone, hidePhoto, createdAt, updatedAt)
           VALUES (?, ?, ?, 10, 'NEVER_MARRIED', 'NO', 'NO', 0, 0, ?, ?)`,
          [profileId, userId, pending.gender || null, now, now]
        );

        // Remove from pending_registration
        await execute('DELETE FROM pending_registration WHERE email = ?', [pending.email]);

        return NextResponse.json({
          success: true,
          message: 'Email verified successfully. Account created.',
          user: { id: userId, name: pending.name, email: pending.email },
        });
      }
    }

    // ── Non-registration OTP (PASSWORD_RESET, etc.) ──────────────────────────
    const user = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const record = await queryOne(
      'SELECT id, code, expiresAt, used FROM otp WHERE userId = ? AND type = ? AND used = 0 ORDER BY createdAt DESC LIMIT 1',
      [user.id, type]
    );

    if (!record) return NextResponse.json({ error: 'OTP not found. Request a new one.' }, { status: 400 });
    if (new Date() > new Date(record.expiresAt)) return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
    if (record.code !== String(otp)) return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });

    await execute('UPDATE otp SET used = 1 WHERE id = ?', [record.id]);

    return NextResponse.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('verify-otp error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

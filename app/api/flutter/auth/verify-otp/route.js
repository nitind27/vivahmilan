import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { signToken } from '@/lib/flutter-jwt';
import { randomUUID } from 'crypto';

const REQUIRED_FIELDS = ['gender', 'dob', 'height', 'religion', 'education', 'profession', 'country', 'city', 'aboutMe'];

export async function POST(req) {
  try {
    const { email, otp, type = 'EMAIL_VERIFY' } = await req.json();

    if (!email || !otp)
      return NextResponse.json({ error: 'email and otp are required' }, { status: 400 });

    // ── EMAIL_VERIFY: check pending_registration first ──────────────────────
    if (type === 'EMAIL_VERIFY') {
      const pending = await queryOne(
        'SELECT * FROM pending_registration WHERE email = ?',
        [email.toLowerCase().trim()]
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
          `INSERT INTO \`user\` (id, name, email, phone, password, role, isActive, isVerified,
            adminVerified, verificationBadge, isPremium, profileBoost, phoneVerified,
            loginOtpEnabled, emailVerified, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'USER', 1, 1, 0, 0, 0, 0, 0, 0, NOW(), ?, ?)`,
          [userId, pending.name, pending.email, pending.phone || null, pending.password, now, now]
        );

        await execute(
          `INSERT INTO profile (id, userId, profileComplete, maritalStatus, smoking, drinking,
            hidePhone, hidePhoto, createdAt, updatedAt)
           VALUES (?, ?, 10, 'NEVER_MARRIED', 'NO', 'NO', 0, 0, ?, ?)`,
          [profileId, userId, now, now]
        );

        // Remove from pending_registration
        await execute('DELETE FROM pending_registration WHERE email = ?', [pending.email]);

        const token = signToken({
          id: userId,
          email: pending.email,
          role: 'USER',
          isPremium: false,
        });

        return NextResponse.json({
          success: true,
          message: 'Email verified successfully. Account created.',
          token,
          user: {
            id: userId,
            name: pending.name,
            email: pending.email,
            role: 'USER',
            isPremium: false,
            premiumPlan: null,
            adminVerified: false,
          },
          profileIncomplete: true,
          missingFields: REQUIRED_FIELDS,
          profileComplete: 10,
          requiredFields: REQUIRED_FIELDS,
        });
      }
    }

    // ── Non-registration OTP (PASSWORD_RESET, PHONE_VERIFY, etc.) ───────────
    const user = await queryOne(
      'SELECT id, name, email, role, isActive, isPremium, premiumPlan, adminVerified, freeTrialExpiry FROM `user` WHERE email = ?',
      [email]
    );
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const record = await queryOne(
      'SELECT id, code, expiresAt FROM otp WHERE userId = ? AND type = ? AND used = 0 ORDER BY createdAt DESC LIMIT 1',
      [user.id, type]
    );

    if (!record)
      return NextResponse.json({ error: 'OTP not found. Request a new one.' }, { status: 400 });
    if (new Date() > new Date(record.expiresAt))
      return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
    if (record.code !== String(otp))
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });

    await execute('UPDATE otp SET used = 1 WHERE id = ?', [record.id]);

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      isPremium: !!user.isPremium,
    });

    let profileIncomplete = false;
    let missingFields = [];
    let profileComplete = 0;

    if (user.role !== 'ADMIN') {
      const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [user.id]);
      missingFields = REQUIRED_FIELDS.filter(f => !profile?.[f]);
      profileComplete = profile?.profileComplete || 0;
      profileIncomplete = missingFields.length > 0;
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: !!user.isPremium,
        premiumPlan: user.premiumPlan || null,
        adminVerified: !!user.adminVerified,
      },
      profileIncomplete,
      missingFields,
      profileComplete,
      requiredFields: REQUIRED_FIELDS,
    });

  } catch (err) {
    console.error('Flutter verify-otp error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

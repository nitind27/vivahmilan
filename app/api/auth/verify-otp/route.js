import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { recordRegistrationGeo } from '@/lib/geoTracking';
import { randomUUID } from 'crypto';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, otp, type = 'EMAIL_VERIFY' } = body;

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
        const isGoogleSignup = pending.password === 'GOOGLE_AUTH';

        if (!isGoogleSignup) {
          // Normal email/password registration
          await execute(
            `INSERT INTO \`user\` (id, name, email, password, phone, role, isActive, isVerified,
              adminVerified, verificationBadge, isPremium, profileBoost, phoneVerified,
              loginOtpEnabled, emailVerified, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, 'USER', 1, 1, 0, 0, 0, 0, 0, 0, NOW(), ?, ?)`,
            [userId, pending.name, pending.email, pending.password, pending.phone || null, now, now]
          );
        } else {
          // Google OAuth registration — no password, email already verified by Google
          await execute(
            `INSERT INTO \`user\` (id, name, email, password, phone, role, isActive, isVerified,
              adminVerified, verificationBadge, isPremium, profileBoost, phoneVerified,
              loginOtpEnabled, emailVerified, createdAt, updatedAt)
             VALUES (?, ?, ?, NULL, NULL, 'USER', 1, 1, 0, 0, 0, 0, 0, 0, NOW(), ?, ?)`,
            [userId, pending.name, pending.email, now, now]
          );
        }

        await execute(
          `INSERT INTO profile (id, userId, gender, profileComplete, maritalStatus, smoking, drinking, hidePhone, hidePhoto, createdAt, updatedAt)
           VALUES (?, ?, ?, 10, 'NEVER_MARRIED', 'NO', 'NO', 0, 0, ?, ?)`,
          [profileId, userId, pending.gender || null, now, now]
        );

        // Remove from pending_registration
        await execute('DELETE FROM pending_registration WHERE email = ?', [pending.email]);

        const storedGeo = pending.registrationIp ? {
          ip: pending.registrationIp,
          country: pending.registrationCountry,
          city: pending.registrationCity,
          region: null,
          latitude: pending.registrationLat != null ? Number(pending.registrationLat) : null,
          longitude: pending.registrationLon != null ? Number(pending.registrationLon) : null,
          geoSource: pending.registrationLat != null ? 'GPS' : 'IP',
          device: null, browser: null, os: null, platform: body.platform || 'web', userAgent: null,
        } : null;
        recordRegistrationGeo(userId, req, body, { storedGeo }).catch(e =>
          console.error('[verify-otp] geo log error:', e.message)
        );

        // Early Bird Auto-Assignment
        try {
          const ebConfigRow = await queryOne("SELECT value FROM siteconfig WHERE `key` = 'early_bird_settings'");
          if (ebConfigRow && ebConfigRow.value) {
            const ebConfig = JSON.parse(ebConfigRow.value);
            if (ebConfig.enabled && ebConfig.claimed < ebConfig.limit) {
              const endDate = new Date(Date.now() + (ebConfig.durationDays || 30) * 86400000);
              await execute(
                "INSERT INTO subscription (id, userId, plan, status, amount, currency, paymentId, startDate, endDate, createdAt) VALUES (?, ?, ?, 'ACTIVE', 0, 'INR', 'EARLY_BIRD', NOW(), ?, NOW())",
                [randomUUID(), userId, ebConfig.planId, endDate]
              );
              await execute(
                "UPDATE `user` SET isPremium = 1, premiumPlan = ?, premiumExpiry = ? WHERE id = ?",
                [ebConfig.planId, endDate, userId]
              );
              ebConfig.claimed += 1;
              await execute("UPDATE siteconfig SET value = ? WHERE `key` = 'early_bird_settings'", [JSON.stringify(ebConfig)]);
            }
          }
        } catch (e) {
          console.error('Early bird assign error:', e);
        }

        return NextResponse.json({
          success: true,
          message: 'Email verified successfully. Account created.',
          isGoogleUser: isGoogleSignup,
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

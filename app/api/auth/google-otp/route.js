import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';
import { capturePendingRegistrationGeo } from '@/lib/geoTracking';
import { randomUUID } from 'crypto';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST — initiate Google OTP verification (called before user is created)
export async function POST(req) {
  try {
    const body = await req.json();
    const { email, name } = body;
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    const geo = await capturePendingRegistrationGeo(req, body);

    // If user already exists in DB, no need for OTP — they should just login
    const existing = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (existing) return NextResponse.json({ alreadyExists: true });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const pendingId = randomUUID();

    // Upsert into pending_registration — use 'GOOGLE_AUTH' as password placeholder
    // (password column is NOT NULL in DB, so we can't insert NULL)
    await execute('DELETE FROM pending_registration WHERE email = ?', [email]);
    await execute(
      `INSERT INTO pending_registration
        (id, name, email, phone, password, gender, otp, otpExpiresAt,
         registrationIp, registrationCountry, registrationCity, registrationLat, registrationLon, createdAt)
       VALUES (?, ?, ?, NULL, 'GOOGLE_AUTH', NULL, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [pendingId, name || email.split('@')[0], email, otp, otpExpiry, geo.ip, geo.country, geo.city, geo.latitude, geo.longitude]
    );

    await sendOTPEmail(email, name || email.split('@')[0], otp, 'EMAIL_VERIFY');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('google-otp error:', err.message, err.stack);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}

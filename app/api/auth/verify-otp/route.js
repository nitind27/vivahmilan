import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export async function POST(req) {
  try {
    const { email, otp, type = 'EMAIL_VERIFY' } = await req.json();

    if (!email || !otp)
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });

    const user = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const record = await queryOne(
      'SELECT id, code, expiresAt, used FROM otp WHERE userId = ? AND type = ? AND used = 0 ORDER BY createdAt DESC LIMIT 1',
      [user.id, type]
    );

    if (!record) return NextResponse.json({ error: 'OTP not found. Request a new one.' }, { status: 400 });
    if (new Date() > new Date(record.expiresAt)) return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
    if (record.code !== otp) return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });

    // Mark OTP used
    await execute('UPDATE otp SET used = 1 WHERE id = ?', [record.id]);

    if (type === 'EMAIL_VERIFY') {
      await execute('UPDATE `user` SET emailVerified = NOW() WHERE id = ?', [user.id]);
    }

    return NextResponse.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('verify-otp error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

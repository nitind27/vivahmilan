import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, execute } from '@/lib/db';

export async function POST(req) {
  try {
    const { email, otp, password } = await req.json();

    if (!email || !otp || !password)
      return NextResponse.json({ error: 'email, otp and password are required' }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const user = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const record = await queryOne(
      'SELECT id, code, expiresAt FROM otp WHERE userId = ? AND type = ? AND used = 0 ORDER BY createdAt DESC LIMIT 1',
      [user.id, 'PASSWORD_RESET']
    );

    if (!record)
      return NextResponse.json({ error: 'OTP not found. Request a new one.' }, { status: 400 });
    if (new Date() > new Date(record.expiresAt))
      return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
    if (record.code !== String(otp))
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);

    await execute('UPDATE otp SET used = 1 WHERE id = ?', [record.id]);
    await execute('UPDATE `user` SET password = ?, updatedAt = NOW() WHERE id = ?', [hashed, user.id]);

    return NextResponse.json({ success: true, message: 'Password reset successfully. Please login.' });

  } catch (err) {
    console.error('Flutter reset-password error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

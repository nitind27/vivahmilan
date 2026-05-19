import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, execute } from '@/lib/db';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const user = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // OTP was already verified in /api/auth/verify-otp step — just reset the password
    const hashed = await bcrypt.hash(password, 12);
    await execute('UPDATE `user` SET password = ?, updatedAt = NOW() WHERE id = ?', [hashed, user.id]);

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('reset-password error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';
import { queryOne, execute } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await queryOne('SELECT password FROM `user` WHERE id = ?', [session.user.id]);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ hasPassword: !!user.password });
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword)
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    if (newPassword.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const user = await queryOne('SELECT id, password FROM `user` WHERE id = ?', [session.user.id]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.password) {
      if (!currentPassword)
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid)
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

      const sameAsOld = await bcrypt.compare(newPassword, user.password);
      if (sameAsOld)
        return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await execute(
      'UPDATE `user` SET password = ?, needsPassword = 0, updatedAt = NOW() WHERE id = ?',
      [hashed, user.id]
    );

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('change-password error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

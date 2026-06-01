import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, execute } from '@/lib/db';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { isFamilyRole, familyForbiddenResponse } from '@/lib/flutterFamilyGuard';

/** GET — whether account has password (Google users may not) */
export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  if (isFamilyRole(decoded)) return familyForbiddenResponse('change owner password');

  const user = await queryOne('SELECT password FROM `user` WHERE id = ?', [decoded.id]);
  return NextResponse.json({ hasPassword: !!user?.password });
}

/** POST — change password */
export async function POST(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    if (isFamilyRole(decoded)) return familyForbiddenResponse('change password');

    const { currentPassword, newPassword } = await req.json();
    if (!newPassword) return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const user = await queryOne('SELECT id, password FROM `user` WHERE id = ?', [decoded.id]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      const sameAsOld = await bcrypt.compare(newPassword, user.password);
      if (sameAsOld) {
        return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await execute(
      'UPDATE `user` SET password = ?, needsPassword = 0, updatedAt = NOW() WHERE id = ?',
      [hashed, decoded.id]
    );

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Flutter change-password error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

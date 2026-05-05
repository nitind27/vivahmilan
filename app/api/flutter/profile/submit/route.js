import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { queryOne, execute } from '@/lib/db';
import { sendEmail } from '@/lib/email';

const REQUIRED_FIELDS = ['gender', 'dob', 'height', 'religion', 'education', 'profession', 'country', 'city', 'aboutMe'];

// POST /api/flutter/profile/submit
// Called when user finishes filling profile — validates completeness and marks as pending admin review
export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [decoded.id]);
  const user    = await queryOne('SELECT id, name, email, adminVerified FROM `user` WHERE id = ?', [decoded.id]);

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Already approved
  if (user.adminVerified) {
    return NextResponse.json({ success: true, message: 'Profile already approved.', code: 'ALREADY_APPROVED' });
  }

  // Check all required fields
  const missingFields = REQUIRED_FIELDS.filter(f => !profile?.[f]);
  if (missingFields.length > 0) {
    return NextResponse.json({
      error: 'Profile incomplete. Fill all required fields before submitting.',
      code: 'PROFILE_INCOMPLETE',
      missingFields,
      profileComplete: profile?.profileComplete || 0,
      requiredFields: REQUIRED_FIELDS,
    }, { status: 400 });
  }

  // Mark profile as submitted for admin review (profileSubmitted flag)
  // We use profileComplete = 100 as the signal that it's ready for review
  await execute(
    'UPDATE profile SET profileComplete = 100, updatedAt = NOW() WHERE userId = ?',
    [decoded.id]
  );

  // Notify admin via notification (optional — if admin notification table exists)
  try {
    const { randomUUID } = await import('crypto');
    await execute(
      "INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt) SELECT ?, id, 'ADMIN_REVIEW', 'New Profile Submitted', ?, 0, ?, NOW() FROM `user` WHERE role = 'ADMIN' LIMIT 1",
      [randomUUID(), `${user.name} has submitted their profile for review.`, `/admin/pending`]
    );
  } catch { /* ignore if admin notification fails */ }

  return NextResponse.json({
    success: true,
    message: 'Profile submitted for admin review. You will be notified once approved.',
    code: 'PENDING_APPROVAL',
  });
}

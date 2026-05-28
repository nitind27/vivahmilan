import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { execute, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';
import { handleReportAutoHide } from '@/lib/reportAutoHide';

export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { targetId, reason, details } = await req.json();
  if (!targetId || !reason) return NextResponse.json({ error: 'targetId and reason required' }, { status: 400 });

  const id = randomUUID();
  await execute(
    'INSERT INTO report (id, reporterId, targetId, reason, details, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
    [id, decoded.id, targetId, reason, details || null, 'PENDING']
  );

  try {
    const reporter = await queryOne('SELECT name FROM `user` WHERE id = ?', [decoded.id]);
    const { notifyAdmins } = await import('@/lib/adminNotifications');
    await notifyAdmins({
      title: '🚩 New Report Submitted',
      message: `${reporter?.name || 'A user'} reported a profile: ${reason}`,
      link: '/admin/reports',
    });
  } catch {}

  const autoHide = await handleReportAutoHide(targetId);

  return NextResponse.json({
    success: true,
    id,
    message: autoHide.hidden
      ? 'Report submitted. This profile has been temporarily hidden pending admin review due to multiple community reports.'
      : 'Report submitted successfully. Our team will review it shortly.',
    autoHidden: autoHide.hidden,
    reportCount: autoHide.reportCount,
  }, { status: 201 });
}

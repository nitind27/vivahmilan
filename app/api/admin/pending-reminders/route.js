import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  sendProfilePendingReminder,
  getReminderHistory,
  getReminderStatsForUsers,
  REMINDER_TEMPLATES,
  canSendPendingReminder,
} from '@/lib/profilePendingReminder.js';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (userId) {
    const allowApproved = searchParams.get('allowApproved') === '1';
    const history = await getReminderHistory(userId, 15);
    const check = await canSendPendingReminder(userId, { force: false, allowApproved });
    return NextResponse.json({ history, canSend: check.eligible, blockReason: check.reason || null });
  }

  return NextResponse.json({ templates: REMINDER_TEMPLATES });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    userIds = [],
    userId,
    templateKey = 'pending_review',
    customTitle,
    customMessage,
    force = false,
    allowApproved = false,
  } = body;

  const ids = [...new Set((userIds.length ? userIds : userId ? [userId] : []).filter(Boolean))];
  if (!ids.length) {
    return NextResponse.json({ error: 'No users selected' }, { status: 400 });
  }

  if (ids.length > 50) {
    return NextResponse.json({ error: 'Maximum 50 users per batch' }, { status: 400 });
  }

  const results = [];
  for (const uid of ids) {
    const result = await sendProfilePendingReminder(uid, {
      adminId: session.user.id,
      templateKey,
      customTitle,
      customMessage,
      force,
      allowApproved,
    });
    results.push(result);
  }

  const sent = results.filter((r) => r.ok).length;
  const skipped = results.filter((r) => !r.ok);
  const stats = await getReminderStatsForUsers(ids);

  return NextResponse.json({
    success: sent > 0,
    sent,
    failed: skipped.length,
    results,
    stats,
  });
}

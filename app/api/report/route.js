import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { execute, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetId, reason, details } = await req.json();
  if (!targetId || !reason) return NextResponse.json({ error: 'targetId and reason required' }, { status: 400 });

  try {
    const id = randomUUID();
    await execute(
      'INSERT INTO report (id, reporterId, targetId, reason, details, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [id, session.user.id, targetId, reason, details || null, 'PENDING']
    );
    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err) {
    console.error('Report error:', err);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}

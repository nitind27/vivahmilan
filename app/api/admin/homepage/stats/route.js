import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  const stats = await query('SELECT * FROM homepage_stat WHERE isActive = 1 ORDER BY sortOrder ASC');
  return NextResponse.json(stats);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, icon, value, suffix, label, sortOrder } = await req.json();

  if (id) {
    await execute(
      'UPDATE homepage_stat SET icon = ?, value = ?, suffix = ?, label = ?, sortOrder = ?, updatedAt = NOW() WHERE id = ?',
      [icon, Number(value), suffix, label, sortOrder || 0, id]
    );
  } else {
    await execute(
      'INSERT INTO homepage_stat (id, icon, value, suffix, label, sortOrder, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
      [randomUUID(), icon, Number(value), suffix, label, sortOrder || 0]
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  await execute('DELETE FROM homepage_stat WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}

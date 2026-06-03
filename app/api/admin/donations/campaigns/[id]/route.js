import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  await ensureFeatureTables();
  const body = await req.json();

  const sets = [];
  const vals = [];
  const fields = ['title', 'story', 'beneficiaryNote', 'goalAmount', 'imageUrl', 'sortOrder'];
  for (const f of fields) {
    if (body[f] !== undefined) {
      sets.push(`\`${f}\` = ?`);
      vals.push(f === 'goalAmount' ? (body[f] != null ? Number(body[f]) : null) : body[f]);
    }
  }
  if (body.isActive !== undefined) {
    sets.push('isActive = ?');
    vals.push(body.isActive ? 1 : 0);
  }
  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  sets.push('updatedAt = NOW()');
  vals.push(id);
  await execute(`UPDATE donation_campaign SET ${sets.join(', ')} WHERE id = ?`, vals);

  return NextResponse.json({ success: true });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  await ensureFeatureTables();
  await execute('UPDATE donation_campaign SET isActive = 0, updatedAt = NOW() WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}

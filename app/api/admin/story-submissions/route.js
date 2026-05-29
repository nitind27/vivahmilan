import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureFeatureTables();
  const rows = await query(
    `SELECT s.*, u.name AS submitterName, u.email AS submitterEmail
     FROM storysubmission s
     JOIN \`user\` u ON u.id = s.userId
     ORDER BY FIELD(s.status, 'PENDING', 'APPROVED', 'REJECTED'), s.createdAt DESC`
  );

  return NextResponse.json({ submissions: rows });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, action, adminNote } = await req.json();
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'id and action (approve|reject) required' }, { status: 400 });
  }

  await ensureFeatureTables();
  const sub = await queryOne('SELECT * FROM storysubmission WHERE id = ?', [id]);
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'reject') {
    await execute(
      `UPDATE storysubmission SET status = 'REJECTED', adminNote = ?, updatedAt = NOW() WHERE id = ?`,
      [adminNote || null, id]
    );
    return NextResponse.json({ success: true, status: 'REJECTED' });
  }

  const created = await prisma.successStory.create({
    data: {
      coupleName: sub.coupleName,
      location: sub.location || '',
      story: sub.story,
      imageUrl: sub.imageUrl || null,
      isActive: true,
      sortOrder: 0,
    },
  });

  await execute(
    `UPDATE storysubmission SET status = 'APPROVED', successStoryId = ?, adminNote = ?, updatedAt = NOW() WHERE id = ?`,
    [created.id, adminNote || null, id]
  );

  return NextResponse.json({ success: true, status: 'APPROVED', successStoryId: created.id });
}

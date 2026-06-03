import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureFeatureTables();
  const body = await req.json();
  const { title, story, beneficiaryNote, goalAmount, imageUrl, isActive = true, sortOrder = 0 } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const id = randomUUID();
  await execute(
    `INSERT INTO donation_campaign
      (id, title, story, beneficiaryNote, goalAmount, imageUrl, isActive, sortOrder, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      title.trim(),
      (story || '').trim() || null,
      (beneficiaryNote || '').trim() || null,
      goalAmount != null ? Number(goalAmount) : null,
      imageUrl || null,
      isActive ? 1 : 0,
      Number(sortOrder) || 0,
    ]
  );

  return NextResponse.json({ success: true, id });
}

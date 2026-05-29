import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureFeatureTables();
  const row = await queryOne(
    `SELECT id, coupleName, location, story, imageUrl, weddingDate, metOnPlatform, status, adminNote, createdAt, updatedAt
     FROM storysubmission WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`,
    [session.user.id]
  );

  return NextResponse.json({ submission: row || null });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { coupleName, location, story, imageUrl, weddingDate, metOnPlatform } = await req.json();
  if (!coupleName?.trim() || !story?.trim()) {
    return NextResponse.json({ error: 'Couple name and story are required' }, { status: 400 });
  }
  if (story.length > 2000) {
    return NextResponse.json({ error: 'Story must be under 2000 characters' }, { status: 400 });
  }

  await ensureFeatureTables();
  const pending = await queryOne(
    `SELECT id FROM storysubmission WHERE userId = ? AND status = 'PENDING' LIMIT 1`,
    [session.user.id]
  );
  if (pending) {
    return NextResponse.json({ error: 'You already have a story pending review.' }, { status: 409 });
  }

  const id = crypto.randomUUID();
  await execute(
    `INSERT INTO storysubmission (id, userId, coupleName, location, story, imageUrl, weddingDate, metOnPlatform, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
    [
      id,
      session.user.id,
      coupleName.trim(),
      (location || '').trim(),
      story.trim(),
      imageUrl?.trim() || null,
      weddingDate || null,
      metOnPlatform !== false ? 1 : 0,
    ]
  );

  return NextResponse.json({ id, success: true, message: 'Story submitted for review.' }, { status: 201 });
}

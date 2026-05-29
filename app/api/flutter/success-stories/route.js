import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { queryOne, execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  await ensureFeatureTables();
  const row = await queryOne(
    `SELECT id, coupleName, location, story, imageUrl, weddingDate, metOnPlatform, status, adminNote, createdAt, updatedAt
     FROM storysubmission WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`,
    [decoded.id]
  );

  return NextResponse.json({ submission: row || null });
}

export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { coupleName, location, story, imageUrl, weddingDate, metOnPlatform } = await req.json();
  if (!coupleName?.trim() || !story?.trim()) {
    return NextResponse.json({ error: 'Couple name and story are required' }, { status: 400 });
  }

  await ensureFeatureTables();
  const pending = await queryOne(
    `SELECT id FROM storysubmission WHERE userId = ? AND status = 'PENDING' LIMIT 1`,
    [decoded.id]
  );
  if (pending) {
    return NextResponse.json({ error: 'You already have a story pending review.' }, { status: 409 });
  }

  const id = crypto.randomUUID();
  await execute(
    `INSERT INTO storysubmission (id, userId, coupleName, location, story, imageUrl, weddingDate, metOnPlatform, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
    [
      id, decoded.id, coupleName.trim(), (location || '').trim(), story.trim(),
      imageUrl?.trim() || null, weddingDate || null, metOnPlatform !== false ? 1 : 0,
    ]
  );

  return NextResponse.json({ id, success: true }, { status: 201 });
}

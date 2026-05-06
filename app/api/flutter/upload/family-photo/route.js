import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';
import { saveFile, deleteFile } from '@/lib/upload';
import { randomUUID } from 'crypto';

export const maxDuration = 30;

async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS family_photo (
      id VARCHAR(191) NOT NULL,
      userId VARCHAR(191) NOT NULL,
      url VARCHAR(500) NOT NULL,
      caption VARCHAR(255) NULL,
      memberCount INT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_family_photo_userId (userId)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}

let tableReady = false;
async function init() {
  if (!tableReady) { await ensureTable(); tableReady = true; }
}

// GET - list family photos
export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  await init();

  const photos = await query(
    'SELECT * FROM family_photo WHERE userId = ? ORDER BY createdAt DESC',
    [decoded.id]
  );
  return NextResponse.json(photos);
}

// POST - upload family photo
export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  await init();

  const formData = await req.formData();
  const file = formData.get('photo');
  const caption = formData.get('caption') || null;
  const memberCount = formData.get('memberCount') ? parseInt(formData.get('memberCount')) : null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Images only' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Max 10MB' }, { status: 400 });

  const existing = await query('SELECT id FROM family_photo WHERE userId = ?', [decoded.id]);
  if (existing.length >= 10) {
    return NextResponse.json({ error: 'Maximum 10 family photos allowed' }, { status: 400 });
  }

  const { url } = await saveFile(file, 'photos', decoded.id);
  const id = randomUUID();
  await execute(
    'INSERT INTO family_photo (id, userId, url, caption, memberCount, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
    [id, decoded.id, url, caption, memberCount]
  );

  const photo = await queryOne('SELECT * FROM family_photo WHERE id = ?', [id]);
  return NextResponse.json(photo, { status: 201 });
}

// DELETE - remove a family photo
export async function DELETE(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  await init();

  const { photoId } = await req.json();
  if (!photoId) return NextResponse.json({ error: 'photoId required' }, { status: 400 });

  const photo = await queryOne(
    'SELECT * FROM family_photo WHERE id = ? AND userId = ?',
    [photoId, decoded.id]
  );
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await deleteFile(photo.url);
  await execute('DELETE FROM family_photo WHERE id = ?', [photoId]);
  return NextResponse.json({ success: true });
}

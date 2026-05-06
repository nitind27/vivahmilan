import { NextResponse } from 'next/server';
import { queryOne, query, execute } from '@/lib/db';
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

// POST - upload family photo (onboarding, email-based)
export async function POST(req) {
  try {
    await init();
    const formData = await req.formData();
    const file = formData.get('photo');
    const email = formData.get('email');
    const caption = formData.get('caption') || null;
    const memberCount = formData.get('memberCount') ? parseInt(formData.get('memberCount')) : null;

    if (!email || !file) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Images only' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Max 10MB' }, { status: 400 });

    const user = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const existing = await query('SELECT id FROM family_photo WHERE userId = ?', [user.id]);
    if (existing.length >= 10) return NextResponse.json({ error: 'Maximum 10 family photos allowed' }, { status: 400 });

    const { url } = await saveFile(file, 'photos', user.id);
    const id = randomUUID();
    await execute(
      'INSERT INTO family_photo (id, userId, url, caption, memberCount, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
      [id, user.id, url, caption, memberCount]
    );

    const photo = await queryOne('SELECT * FROM family_photo WHERE id = ?', [id]);
    return NextResponse.json(photo, { status: 201 });
  } catch (err) {
    console.error('onboarding/family-photo POST error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}

// DELETE - remove family photo (onboarding, email-based)
export async function DELETE(req) {
  try {
    await init();
    const { email, photoId } = await req.json();
    if (!email || !photoId) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const user = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const photo = await queryOne(
      'SELECT * FROM family_photo WHERE id = ? AND userId = ?',
      [photoId, user.id]
    );
    if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await deleteFile(photo.url);
    await execute('DELETE FROM family_photo WHERE id = ?', [photoId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('onboarding/family-photo DELETE error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}

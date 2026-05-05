import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { queryOne, execute } from '@/lib/db';
import { saveFile, deleteFile } from '@/lib/upload';
import { randomUUID } from 'crypto';

export const maxDuration = 30;

export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('photo');
  const isMain = formData.get('isMain') === 'true';

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Max size 10MB' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only images allowed' }, { status: 400 });

  const { url } = await saveFile(file, 'photos', decoded.id);

  if (isMain) {
    await execute('UPDATE photo SET isMain = 0 WHERE userId = ? AND isMain = 1', [decoded.id]);
    await execute('UPDATE `user` SET image = ?, updatedAt = NOW() WHERE id = ?', [url, decoded.id]);
  }

  const id = randomUUID();
  await execute(
    'INSERT INTO photo (id, userId, url, isMain, createdAt) VALUES (?, ?, ?, ?, NOW())',
    [id, decoded.id, url, isMain ? 1 : 0]
  );

  const photo = await queryOne('SELECT * FROM photo WHERE id = ?', [id]);
  return NextResponse.json(photo, { status: 201 });
}

export async function DELETE(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { photoId } = await req.json();
  const photo = await queryOne('SELECT * FROM photo WHERE id = ? AND userId = ?', [photoId, decoded.id]);
  if (photo) {
    await deleteFile(photo.url);
    await execute('DELETE FROM photo WHERE id = ?', [photoId]);
  }
  return NextResponse.json({ success: true });
}

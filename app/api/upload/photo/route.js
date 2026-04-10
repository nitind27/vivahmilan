import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { saveFile, deleteFile } from '@/lib/upload';
import { randomUUID } from 'crypto';

export const maxDuration = 30;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('photo');
  const isMain = formData.get('isMain') === 'true';

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Max size 10MB' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only images allowed' }, { status: 400 });

  try {
    const { url } = await saveFile(file, 'photos', session.user.id);

    if (isMain) {
      // Unset previous main — raw SQL, no updatedAt
      await execute('UPDATE photo SET isMain = 0 WHERE userId = ? AND isMain = 1', [session.user.id]);
      await execute('UPDATE `user` SET image = ?, updatedAt = NOW() WHERE id = ?', [url, session.user.id]);
    }

    const id = randomUUID();
    const now = new Date();
    await execute(
      'INSERT INTO photo (id, userId, url, isMain, createdAt) VALUES (?, ?, ?, ?, ?)',
      [id, session.user.id, url, isMain ? 1 : 0, now]
    );

    const photo = await queryOne('SELECT * FROM photo WHERE id = ?', [id]);
    return NextResponse.json(photo, { status: 201 });
  } catch (err) {
    console.error('Photo upload error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { photoId } = await req.json();
  const photo = await queryOne('SELECT * FROM photo WHERE id = ? AND userId = ?', [photoId, session.user.id]);
  if (photo) {
    await deleteFile(photo.url);
    await execute('DELETE FROM photo WHERE id = ?', [photoId]);
  }
  return NextResponse.json({ success: true });
}

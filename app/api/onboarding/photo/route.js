import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { saveFile } from '@/lib/upload';
import { randomUUID } from 'crypto';

export const maxDuration = 30;

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('photo');
    const email = formData.get('email');

    if (!email || !file) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const user = await queryOne('SELECT id, emailVerified FROM `user` WHERE email = ?', [email]);
    if (!user || !user.emailVerified) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Max 8MB' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Images only' }, { status: 400 });

    const { url } = await saveFile(file, 'photos', user.id);

    await execute('UPDATE photo SET isMain = 0 WHERE userId = ? AND isMain = 1', [user.id]);
    await execute('UPDATE `user` SET image = ?, updatedAt = NOW() WHERE id = ?', [url, user.id]);
    await execute(
      'INSERT INTO photo (id, userId, url, isMain, createdAt) VALUES (?, ?, ?, 1, NOW())',
      [randomUUID(), user.id, url]
    );

    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error('onboarding/photo error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

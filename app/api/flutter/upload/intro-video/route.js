import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { saveFile, deleteFile } from '@/lib/upload';
import { queryOne, execute } from '@/lib/db';

export const maxDuration = 120;

export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const user = await queryOne('SELECT role FROM `user` WHERE id = ?', [decoded.id]);
  if (user?.role === 'FAMILY') {
    return NextResponse.json({ error: 'Family login cannot upload videos' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('video');
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'Max size 50MB' }, { status: 400 });
  if (!file.type.startsWith('video/')) return NextResponse.json({ error: 'Only video files allowed' }, { status: 400 });

  try {
    const { url } = await saveFile(file, 'videos', decoded.id);
    const existing = await queryOne('SELECT introVideoUrl FROM profile WHERE userId = ?', [decoded.id]);
    if (existing?.introVideoUrl) await deleteFile(existing.introVideoUrl).catch(() => {});
    await execute('UPDATE profile SET introVideoUrl = ?, updatedAt = NOW() WHERE userId = ?', [url, decoded.id]);
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error('[flutter/upload/intro-video]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const existing = await queryOne('SELECT introVideoUrl FROM profile WHERE userId = ?', [decoded.id]);
  if (existing?.introVideoUrl) await deleteFile(existing.introVideoUrl).catch(() => {});
  await execute('UPDATE profile SET introVideoUrl = NULL, updatedAt = NOW() WHERE userId = ?', [decoded.id]);
  return NextResponse.json({ success: true });
}

import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { saveFile } from '@/lib/upload';
import { randomUUID } from 'crypto';
import { hashFileBuffer, findDuplicatePhotoHash, savePhotoContentHash } from '@/lib/profileVerification';
import { resolveOnboardingUser } from '@/lib/onboardingAccess.js';

export const maxDuration = 30;

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('photo');
    const email = formData.get('email');
    const completionToken = formData.get('completionToken');

    if (!email || !file) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const access = await resolveOnboardingUser({ email, completionToken });
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status || 403 });
    const user = access.user;

    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Max 8MB' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Images only' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const contentHash = await hashFileBuffer(Buffer.from(bytes));
    const duplicate = await findDuplicatePhotoHash(contentHash, user.id);
    if (duplicate) {
      return NextResponse.json({
        error: 'This photo appears to be already used on another account. Please upload your own original photo.',
        code: 'DUPLICATE_PHOTO',
      }, { status: 409 });
    }

    const { url } = await saveFile(file, 'photos', user.id);

    await execute('UPDATE photo SET isMain = 0 WHERE userId = ? AND isMain = 1', [user.id]);
    await execute('UPDATE `user` SET image = ?, updatedAt = NOW() WHERE id = ?', [url, user.id]);
    const photoId = randomUUID();
    await execute(
      'INSERT INTO photo (id, userId, url, isMain, createdAt) VALUES (?, ?, ?, 1, NOW())',
      [photoId, user.id, url]
    );
    await savePhotoContentHash(photoId, contentHash);

    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error('onboarding/photo error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}

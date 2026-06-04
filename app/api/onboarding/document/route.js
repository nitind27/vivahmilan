import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { saveFile, deleteFile } from '@/lib/upload';
import { randomUUID } from 'crypto';
import { resolveOnboardingUser } from '@/lib/onboardingAccess.js';

export const maxDuration = 30;

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('document');
    const email = formData.get('email');
    const completionToken = formData.get('completionToken');
    const docType = formData.get('type');

    if (!email || !file || !docType) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const access = await resolveOnboardingUser({ email, completionToken });
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status || 403 });
    const user = access.user;

    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5MB' }, { status: 400 });

    const existing = await queryOne(
      "SELECT id, url FROM document WHERE userId = ? AND type = ? AND status = 'PENDING'",
      [user.id, docType]
    );
    if (existing) {
      await deleteFile(existing.url);
      await execute('DELETE FROM document WHERE id = ?', [existing.id]);
    }

    const { url } = await saveFile(file, 'documents', user.id);
    const docId = randomUUID();

    await execute(
      "INSERT INTO document (id, userId, type, url, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'PENDING', NOW(), NOW())",
      [docId, user.id, docType, url]
    );

    return NextResponse.json({ id: docId, type: docType, status: 'PENDING' });
  } catch (err) {
    console.error('onboarding/document error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}

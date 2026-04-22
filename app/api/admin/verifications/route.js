import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status'); // PENDING, APPROVED, REJECTED, or null for all

  let where = '';
  const params = [];
  if (statusFilter) {
    where = 'WHERE d.status = ?';
    params.push(statusFilter);
  }

  const docs = await query(
    `SELECT d.id, d.type, d.url, d.status, d.adminNote, d.createdAt, d.updatedAt,
            d.userId, u.name as userName, u.email as userEmail
     FROM document d
     JOIN \`user\` u ON u.id = d.userId
     ${where}
     ORDER BY d.createdAt DESC`,
    params
  );

  const result = docs.map(d => ({
    id: d.id,
    type: d.type,
    url: d.url,
    status: d.status,
    adminNote: d.adminNote,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    userId: d.userId,
    user: { id: d.userId, name: d.userName, email: d.userEmail },
  }));

  return NextResponse.json(result);
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { docId, status, adminNote } = await req.json();

  await execute(
    'UPDATE document SET status = ?, adminNote = ?, updatedAt = NOW() WHERE id = ?',
    [status, adminNote || null, docId]
  );

  if (status === 'APPROVED') {
    const doc = await query('SELECT userId FROM document WHERE id = ?', [docId]);
    if (doc[0]) {
      await execute(
        'UPDATE `user` SET isVerified = 1, verificationBadge = 1, updatedAt = NOW() WHERE id = ?',
        [doc[0].userId]
      );
      await execute(
        'INSERT INTO notification (id, userId, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, 0, NOW())',
        [randomUUID(), doc[0].userId, 'VERIFICATION_APPROVED', 'Profile Verified', 'Your profile has been verified successfully.']
      );
    }
  }

  return NextResponse.json({ success: true });
}

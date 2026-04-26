import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const user = await queryOne('SELECT * FROM `user` WHERE id = ?', [userId]);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const profile  = await queryOne('SELECT * FROM profile WHERE userId = ?', [userId]);
  const photos   = await query('SELECT * FROM photo WHERE userId = ? ORDER BY isMain DESC', [userId]);
  const documents = await query('SELECT * FROM document WHERE userId = ? ORDER BY createdAt DESC', [userId]);
  const interests = await query(
    `SELECT i.*, u.name as otherName, u.email as otherEmail
     FROM interest i
     JOIN \`user\` u ON u.id = CASE WHEN i.senderId = ? THEN i.receiverId ELSE i.senderId END
     WHERE i.senderId = ? OR i.receiverId = ?
     ORDER BY i.createdAt DESC LIMIT 20`,
    [userId, userId, userId]
  );

  return NextResponse.json({ user, profile, photos, documents, interests });
}

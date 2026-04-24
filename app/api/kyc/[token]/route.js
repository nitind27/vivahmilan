import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

// GET /api/kyc/[token] — validate token for user joining
export async function GET(req, { params }) {
  const { token } = await params;

  const kyc = await queryOne(
    `SELECT k.id, k.status, k.expiresAt, k.userId,
            u.name as userName, u.email as userEmail
     FROM kycsession k
     JOIN \`user\` u ON u.id = k.userId
     WHERE k.token = ?`,
    [token]
  );

  if (!kyc) return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
  if (new Date(kyc.expiresAt) < new Date())
    return NextResponse.json({ error: 'Link expired' }, { status: 410 });
  if (kyc.status === 'COMPLETED')
    return NextResponse.json({ error: 'Session already completed' }, { status: 410 });

  return NextResponse.json({
    sessionId: kyc.id,
    userId: kyc.userId,
    userName: kyc.userName,
    status: kyc.status,
  });
}

// POST /api/kyc/[token] — user marks themselves as joined (set ACTIVE)
export async function POST(req, { params }) {
  const { token } = await params;

  const kyc = await queryOne(
    'SELECT id, status, expiresAt FROM kycsession WHERE token = ?',
    [token]
  );

  if (!kyc) return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
  if (new Date(kyc.expiresAt) < new Date())
    return NextResponse.json({ error: 'Link expired' }, { status: 410 });

  if (kyc.status === 'PENDING') {
    await execute('UPDATE kycsession SET status = ? WHERE id = ?', ['ACTIVE', kyc.id]);
  }

  return NextResponse.json({ sessionId: kyc.id, status: 'ACTIVE' });
}

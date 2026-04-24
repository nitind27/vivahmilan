import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS kycsession (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      adminId VARCHAR(36) NOT NULL,
      token VARCHAR(128) NOT NULL UNIQUE,
      status ENUM('PENDING','ACTIVE','COMPLETED','EXPIRED') DEFAULT 'PENDING',
      capturedImages JSON,
      notes TEXT,
      createdAt DATETIME DEFAULT NOW(),
      updatedAt DATETIME DEFAULT NOW() ON UPDATE NOW(),
      expiresAt DATETIME NOT NULL,
      INDEX idx_token (token),
      INDEX idx_userId (userId)
    )
  `);
}

// GET /api/kyc/[token] — validate token for user joining
export async function GET(req, { params }) {
  const { token } = await params;

  try {
    await ensureTable();

    const kyc = await queryOne(
      `SELECT k.id, k.status, k.expiresAt, k.userId,
              u.name as userName, u.email as userEmail
       FROM kycsession k
       JOIN \`user\` u ON u.id = k.userId
       WHERE k.token = ?`,
      [token]
    );

    if (!kyc) return NextResponse.json({ error: 'Invalid link. This KYC link is not valid.' }, { status: 404 });
    if (new Date(kyc.expiresAt) < new Date())
      return NextResponse.json({ error: 'This link has expired. Please ask admin to send a new one.' }, { status: 410 });
    if (kyc.status === 'COMPLETED')
      return NextResponse.json({ error: 'This KYC session is already completed.' }, { status: 410 });

    return NextResponse.json({
      sessionId: kyc.id,
      userId: kyc.userId,
      userName: kyc.userName,
      status: kyc.status,
    });
  } catch (err) {
    console.error('[KYC GET] error:', err.message);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}

// POST /api/kyc/[token] — user marks themselves as joined (set ACTIVE)
export async function POST(req, { params }) {
  const { token } = await params;

  try {
    await ensureTable();

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
  } catch (err) {
    console.error('[KYC POST] error:', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

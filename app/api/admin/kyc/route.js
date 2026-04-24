import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';
import { sendKycInviteEmail } from '@/lib/email';

// Ensure table exists
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
  // Ensure token column is wide enough (fix if created with VARCHAR(64))
  try {
    await execute(`ALTER TABLE kycsession MODIFY COLUMN token VARCHAR(128) NOT NULL`);
  } catch { /* already correct size, ignore */ }
}

// POST /api/admin/kyc — create session & send email
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  await ensureTable();

  const user = await queryOne(
    'SELECT u.id, u.name, u.email FROM `user` u WHERE u.id = ?',
    [userId]
  );
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const id = randomUUID();
  const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await execute(
    'INSERT INTO kycsession (id, userId, adminId, token, expiresAt) VALUES (?, ?, ?, ?, ?)',
    [id, userId, session.user.id, token, expiresAt]
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vivahdwar.com';
  const kycLink = `${appUrl}/kyc/${token}`;

  try {
    await sendKycInviteEmail(user.email, user.name || 'User', kycLink);
  } catch (e) {
    console.error('KYC email error:', e.message);
  }

  return NextResponse.json({ success: true, sessionId: id, kycLink });
}

// GET /api/admin/kyc?sessionId=xxx — get session info
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureTable();

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (sessionId) {
    const kyc = await queryOne(
      `SELECT k.*, u.name as userName, u.email as userEmail
       FROM kycsession k JOIN \`user\` u ON u.id = k.userId
       WHERE k.id = ?`,
      [sessionId]
    );
    return NextResponse.json(kyc || null);
  }

  const sessions = await query(
    `SELECT k.*, u.name as userName, u.email as userEmail
     FROM kycsession k JOIN \`user\` u ON u.id = k.userId
     ORDER BY k.createdAt DESC LIMIT 50`
  );
  return NextResponse.json(sessions);
}

// PATCH /api/admin/kyc — update session (save images, notes, complete)
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { sessionId, status, capturedImages, notes } = await req.json();
  await ensureTable();

  const updates = [];
  const params = [];

  if (status) { updates.push('status = ?'); params.push(status); }
  if (capturedImages !== undefined) { updates.push('capturedImages = ?'); params.push(JSON.stringify(capturedImages)); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  params.push(sessionId);
  await execute(`UPDATE kycsession SET ${updates.join(', ')} WHERE id = ?`, params);

  return NextResponse.json({ success: true });
}

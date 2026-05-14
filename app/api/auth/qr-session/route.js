import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { execute, queryOne } from '@/lib/db';

// Ensure qr_sessions table exists
async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS qr_sessions (
      id VARCHAR(36) PRIMARY KEY,
      status ENUM('pending','scanned','confirmed','expired') DEFAULT 'pending',
      userId INT NULL,
      token TEXT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL,
      INDEX idx_expires (expiresAt),
      INDEX idx_status (status)
    )
  `);
}

// POST /api/auth/qr-session — create a new QR session
export async function POST() {
  try {
    await ensureTable();
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min TTL
    await execute(
      `INSERT INTO qr_sessions (id, status, expiresAt) VALUES (?, 'pending', ?)`,
      [id, expiresAt]
    );
    return NextResponse.json({ sessionId: id });
  } catch (err) {
    console.error('QR session create error:', err);
    return NextResponse.json({ error: 'Failed to create QR session' }, { status: 500 });
  }
}

// GET /api/auth/qr-session?id=xxx — poll status from web browser
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await ensureTable();
    const row = await queryOne(
      `SELECT id, status, token, expiresAt FROM qr_sessions WHERE id = ?`,
      [id]
    );
    if (!row) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if (new Date(row.expiresAt) < new Date()) {
      await execute(`UPDATE qr_sessions SET status='expired' WHERE id=?`, [id]);
      return NextResponse.json({ status: 'expired' });
    }

    return NextResponse.json({ status: row.status, token: row.token || null });
  } catch (err) {
    console.error('QR session poll error:', err);
    return NextResponse.json({ error: 'Failed to poll QR session' }, { status: 500 });
  }
}

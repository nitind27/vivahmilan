import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

async function columnExists(table, column) {
  const rows = await query(
    `SELECT 1 AS ok FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

export async function POST() {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS support_session (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NULL,
        guestName VARCHAR(100) NULL,
        status ENUM('bot','live','ended') DEFAULT 'bot',
        language VARCHAR(10) DEFAULT 'en',
        fallbackCount INT DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_userId (userId)
      )
    `);
    await execute(`
      CREATE TABLE IF NOT EXISTS support_message (
        id VARCHAR(36) PRIMARY KEY,
        sessionId VARCHAR(36) NOT NULL,
        sender ENUM('user','bot','admin') DEFAULT 'user',
        content TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session (sessionId)
      )
    `);
    if (!(await columnExists('support_session', 'fallbackCount'))) {
      await execute('ALTER TABLE support_session ADD COLUMN fallbackCount INT DEFAULT 0');
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Init error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

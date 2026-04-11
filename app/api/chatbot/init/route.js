import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';

// Creates support_session and support_message tables if not exist
export async function POST() {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS support_session (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NULL,
        guestName VARCHAR(100) NULL,
        status ENUM('bot','live','ended') DEFAULT 'bot',
        language VARCHAR(10) DEFAULT 'en',
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
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Init error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

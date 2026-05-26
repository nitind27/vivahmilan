import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { randomUUID } from 'crypto';

let tableReady = false;

async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS cookieconsentlog (
      id          VARCHAR(36)  PRIMARY KEY,
      choiceType  VARCHAR(20)  NOT NULL,
      functional  TINYINT(1)   NOT NULL DEFAULT 0,
      analytics   TINYINT(1)   NOT NULL DEFAULT 0,
      sessionId   VARCHAR(64)  DEFAULT NULL,
      createdAt   DATETIME     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_createdAt (createdAt),
      INDEX idx_choiceType (choiceType)
    )
  `);
}

export async function POST(req) {
  try {
    if (!tableReady) {
      await ensureTable();
      tableReady = true;
    }

    const body = await req.json().catch(() => ({}));
    const choiceType = ['all', 'essential', 'custom'].includes(body.choiceType)
      ? body.choiceType
      : 'custom';

    await execute(
      `INSERT INTO cookieconsentlog (id, choiceType, functional, analytics, sessionId, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        randomUUID(),
        choiceType,
        body.functional ? 1 : 0,
        body.analytics ? 1 : 0,
        body.sessionId?.slice(0, 64) || null,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[CookieConsent]', err.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

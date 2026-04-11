import { NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { randomUUID } from 'crypto';

// GET: admin fetches all live/pending sessions
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (sessionId) {
    // Get messages for specific session
    const messages = await query(
      'SELECT * FROM support_message WHERE sessionId = ? ORDER BY createdAt ASC',
      [sessionId]
    );
    const sess = await queryOne('SELECT * FROM support_session WHERE id = ?', [sessionId]);
    return NextResponse.json({ messages, session: sess });
  }

  // Get all active sessions
  const sessions = await query(
    `SELECT ss.*, u.name as userName, u.email as userEmail
     FROM support_session ss
     LEFT JOIN \`user\` u ON ss.userId = u.id
     WHERE ss.status IN ('live', 'bot')
     ORDER BY ss.updatedAt DESC`
  );

  // Attach last message to each session
  const enriched = await Promise.all(sessions.map(async (s) => {
    const lastMsg = await queryOne(
      'SELECT * FROM support_message WHERE sessionId = ? ORDER BY createdAt DESC LIMIT 1',
      [s.id]
    );
    const unread = await queryOne(
      `SELECT COUNT(*) as cnt FROM support_message WHERE sessionId = ? AND sender = 'user'`,
      [s.id]
    );
    return { ...s, lastMessage: lastMsg, unreadCount: unread?.cnt || 0 };
  }));

  return NextResponse.json(enriched);
}

// POST: admin sends a message or ends chat
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { sessionId, message, action } = await req.json();
  const now = new Date();

  if (action === 'end') {
    await execute('UPDATE support_session SET status = ?, updatedAt = ? WHERE id = ?', ['ended', now, sessionId]);
    // Save system message
    await execute(
      `INSERT INTO support_message (id, sessionId, sender, content, createdAt) VALUES (?, ?, 'admin', ?, ?)`,
      [randomUUID(), sessionId, '✅ Chat ended by support agent. Thank you!', now]
    );
    return NextResponse.json({ ok: true, status: 'ended' });
  }

  if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

  await execute(
    `INSERT INTO support_message (id, sessionId, sender, content, createdAt) VALUES (?, ?, 'admin', ?, ?)`,
    [randomUUID(), sessionId, message.trim(), now]
  );
  await execute('UPDATE support_session SET updatedAt = ? WHERE id = ?', [now, sessionId]);

  return NextResponse.json({ ok: true });
}

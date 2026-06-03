import { NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { randomUUID } from 'crypto';
import { getGreetingText } from '@/lib/supportAgent';

export const STORAGE_KEY = 'vd-support-session';

async function getUserContext(userId) {
  const { getSupportUserContext } = await import('@/lib/supportUserContext');
  return getSupportUserContext(userId);
}

async function loadMessages(sessionId) {
  return query(
    'SELECT * FROM support_message WHERE sessionId = ? ORDER BY createdAt ASC',
    [sessionId]
  );
}

async function findActiveSession(userId, guestSessionId) {
  if (userId) {
    const byUser = await queryOne(
      `SELECT * FROM support_session
       WHERE userId = ? AND status IN ('bot','live')
       ORDER BY updatedAt DESC LIMIT 1`,
      [userId]
    );
    if (byUser) return byUser;
  }
  if (guestSessionId) {
    return queryOne(
      `SELECT * FROM support_session
       WHERE id = ? AND status IN ('bot','live')`,
      [guestSessionId]
    );
  }
  return null;
}

async function notifyAgent(title, message, sessionId) {
  try {
    const { notifyAdminSupportEvent } = await import('@/lib/adminSupportLive');
    await notifyAdminSupportEvent({ sessionId, title, message, type: 'live' });
  } catch {}
}

async function getIssueSummary(sessionId) {
  const rows = await query(
    `SELECT content FROM support_message
     WHERE sessionId = ? AND sender = 'user'
     ORDER BY createdAt DESC LIMIT 3`,
    [sessionId]
  );
  return rows.map((r) => r.content).reverse().join(' | ').slice(0, 200);
}

/** GET — restore saved chat for logged-in user or guest session id */
export async function GET(req) {
  try {
    const authSession = await getServerSession(authOptions);
    const userId = authSession?.user?.id || null;
    const { searchParams } = new URL(req.url);
    const guestSessionId = searchParams.get('sessionId');

    const sess = await findActiveSession(userId, guestSessionId);
    if (!sess) {
      return NextResponse.json({ session: null, messages: [], storageKey: STORAGE_KEY });
    }

    if (userId && !sess.userId) {
      await execute('UPDATE support_session SET userId = ?, updatedAt = ? WHERE id = ?', [
        userId,
        new Date(),
        sess.id,
      ]);
      sess.userId = userId;
    }

    const messages = await loadMessages(sess.id);
    return NextResponse.json({ session: sess, messages, storageKey: STORAGE_KEY });
  } catch (err) {
    console.error('Session GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** POST — attach user, escalate to live agent, or start fresh chat */
export async function POST(req) {
  try {
    const body = await req.json();
    const { action, sessionId, userId: bodyUserId } = body;
    const authSession = await getServerSession(authOptions);
    const userId = authSession?.user?.id || bodyUserId || null;
    const now = new Date();

    if (action === 'attach' && sessionId && userId) {
      await execute(
        'UPDATE support_session SET userId = ?, updatedAt = ? WHERE id = ? AND (userId IS NULL OR userId = ?)',
        [userId, now, sessionId, userId]
      );
      return NextResponse.json({ ok: true, sessionId });
    }

    if (action === 'escalate') {
      let sid = sessionId;
      if (!sid && userId) {
        const existing = await findActiveSession(userId, null);
        sid = existing?.id;
      }
      if (!sid) {
        sid = randomUUID();
        await execute(
          `INSERT INTO support_session (id, userId, status, language, fallbackCount, createdAt, updatedAt)
           VALUES (?, ?, 'live', 'en', 0, ?, ?)`,
          [sid, userId, now, now]
        );
      } else {
        await execute(
          'UPDATE support_session SET status = ?, updatedAt = ? WHERE id = ?',
          ['live', now, sid]
        );
      }

      const userCtx = await getUserContext(userId);
      const escalateMsg =
        '🧑‍💼 **Connecting you to Live Support...**\n\nOur team will reply shortly. Please describe your issue in detail.';

      await execute(
        `INSERT INTO support_message (id, sessionId, sender, content, createdAt) VALUES (?, ?, 'bot', ?, ?)`,
        [randomUUID(), sid, escalateMsg, now]
      );

      const summary = await getIssueSummary(sid);
      const who = userCtx.userName || 'Guest user';
      await notifyAgent(
        '🧑‍💼 Live Support Requested',
        `${who} needs help${summary ? `: ${summary}` : ''}`,
        sid
      );

      const messages = await loadMessages(sid);
      return NextResponse.json({
        ok: true,
        sessionId: sid,
        status: 'live',
        botReply: escalateMsg,
        messages,
      });
    }

    if (action === 'end' && sessionId) {
      await execute('UPDATE support_session SET status = ?, updatedAt = ? WHERE id = ?', [
        'ended',
        now,
        sessionId,
      ]);
      await execute(
        `INSERT INTO support_message (id, sessionId, sender, content, createdAt) VALUES (?, ?, 'bot', ?, ?)`,
        [randomUUID(), sessionId, '✅ Chat ended. Thank you for contacting Vivah Dwar!', now]
      );
      return NextResponse.json({ ok: true, status: 'ended' });
    }

    if (action === 'new') {
      if (sessionId) {
        await execute('UPDATE support_session SET status = ?, updatedAt = ? WHERE id = ?', [
          'ended',
          now,
          sessionId,
        ]);
      } else if (userId) {
        await execute(
          `UPDATE support_session SET status = ?, updatedAt = ?
           WHERE userId = ? AND status IN ('bot','live')`,
          ['ended', now, userId]
        );
      }

      const sid = randomUUID();
      const userCtx = await getUserContext(userId);
      const greeting = getGreetingText('en', userCtx);

      await execute(
        `INSERT INTO support_session (id, userId, status, language, fallbackCount, createdAt, updatedAt)
         VALUES (?, ?, 'bot', 'en', 0, ?, ?)`,
        [sid, userId, now, now]
      );
      await execute(
        `INSERT INTO support_message (id, sessionId, sender, content, createdAt) VALUES (?, ?, 'bot', ?, ?)`,
        [randomUUID(), sid, greeting, now]
      );

      const messages = await loadMessages(sid);
      return NextResponse.json({
        ok: true,
        sessionId: sid,
        status: 'bot',
        messages,
        storageKey: STORAGE_KEY,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Session POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

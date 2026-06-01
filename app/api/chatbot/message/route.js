import { NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';
import { processSupportQuery, detectLang, ESCALATE_PROMPT, formatLivePlans } from '@/lib/supportAgent';
import { normalizePlans } from '@/lib/plans';

async function getUserContext(userId) {
  if (!userId) return {};
  try {
    const user = await queryOne(
      'SELECT name, isPremium, premiumExpiry FROM `user` WHERE id = ?',
      [userId]
    );
    if (!user) return {};
    const premiumActive =
      !!user.isPremium && (!user.premiumExpiry || new Date(user.premiumExpiry) > new Date());
    return { userName: user.name, isPremium: premiumActive };
  } catch {
    return {};
  }
}

async function notifyAgent(title, message, sessionId) {
  try {
    const { notifyAdmins } = await import('@/lib/adminNotifications');
    await notifyAdmins({
      title,
      message,
      link: `/admin/support?session=${sessionId}`,
    });
  } catch {}
}

export async function POST(req) {
  try {
    const { sessionId, message, userId } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const now = new Date();
    let sid = sessionId;
    const userCtx = await getUserContext(userId);

    if (!sid) {
      sid = randomUUID();
      const lang = detectLang(message);
      await execute(
        `INSERT INTO support_session (id, userId, status, language, fallbackCount, createdAt, updatedAt)
         VALUES (?, ?, 'bot', ?, 0, ?, ?)`,
        [sid, userId || null, lang, now, now]
      );
    }

    const session = await queryOne('SELECT * FROM support_session WHERE id = ?', [sid]);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if (userId && !session.userId) {
      await execute('UPDATE support_session SET userId = ?, updatedAt = ? WHERE id = ?', [
        userId,
        now,
        sid,
      ]);
    }

    await execute(
      `INSERT INTO support_message (id, sessionId, sender, content, createdAt) VALUES (?, ?, 'user', ?, ?)`,
      [randomUUID(), sid, message.trim(), now]
    );

    if (session.status === 'live') {
      await notifyAgent(
        '💬 New Support Message',
        message.trim().slice(0, 120),
        sid
      );
      return NextResponse.json({ sessionId: sid, status: 'live', botReply: null });
    }

    if (session.status === 'ended') {
      return NextResponse.json({
        sessionId: sid,
        status: 'ended',
        botReply: null,
        needsNewChat: true,
      });
    }

    const lang = detectLang(message);
    await execute('UPDATE support_session SET language = ?, updatedAt = ? WHERE id = ?', [
      lang,
      now,
      sid,
    ]);

    const result = processSupportQuery(message.trim(), { lang, ...userCtx });
    let newStatus = 'bot';
    let suggestLiveAgent = false;
    let followUps = result.followUps || [];
    let reply = result.reply;

    if (['premium', 'payment'].includes(result.intent)) {
      try {
        const rows = await query(
          'SELECT plan, price, durationDays, isActive, permissions FROM planconfig ORDER BY price ASC'
        );
        reply += formatLivePlans(normalizePlans(rows), lang);
      } catch {
        /* optional */
      }
    }

    const isLowConfidence =
      result.intent === 'fallback' ||
      (result.confidence !== undefined && result.confidence < 0.35);

    let fallbackCount = session.fallbackCount || 0;

    if (isLowConfidence && !['greeting', 'agent'].includes(result.intent)) {
      fallbackCount += 1;
      await execute('UPDATE support_session SET fallbackCount = ? WHERE id = ?', [
        fallbackCount,
        sid,
      ]);
      if (fallbackCount >= 2) {
        suggestLiveAgent = true;
        reply += ESCALATE_PROMPT[lang] || ESCALATE_PROMPT.en;
        followUps = [
          { label: '🧑‍💼 Connect Live Agent', text: '__escalate__' },
          ...followUps.filter((f) => f.text !== 'agent' && f.text !== 'talk to agent'),
        ];
        const who = userCtx.userName || 'A user';
        await notifyAgent(
          '⚠️ Support Agent — User Needs Help',
          `${who} asked: "${message.trim().slice(0, 100)}" — bot could not resolve. Consider replying.`,
          sid
        );
      }
    } else if (result.confidence >= 0.5 || ['greeting', 'agent'].includes(result.intent)) {
      if (fallbackCount > 0) {
        await execute('UPDATE support_session SET fallbackCount = 0 WHERE id = ?', [sid]);
      }
    }

    if (result.transferToAgent) {
      newStatus = 'live';
      await execute('UPDATE support_session SET status = ?, updatedAt = ? WHERE id = ?', [
        'live',
        now,
        sid,
      ]);
      const who = userCtx.userName || 'A user';
      await notifyAgent(
        '🧑‍💼 Support Agent Requested',
        `${who}: ${message.trim().slice(0, 120)}`,
        sid
      );
    }

    await execute(
      `INSERT INTO support_message (id, sessionId, sender, content, createdAt) VALUES (?, ?, 'bot', ?, ?)`,
      [randomUUID(), sid, reply, now]
    );

    return NextResponse.json({
      sessionId: sid,
      status: newStatus,
      botReply: reply,
      intent: result.intent,
      followUps,
      actions: result.actions || [],
      confidence: result.confidence ?? 0,
      suggestLiveAgent,
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const messages = await query(
    'SELECT * FROM support_message WHERE sessionId = ? ORDER BY createdAt ASC',
    [sessionId]
  );
  const session = await queryOne('SELECT * FROM support_session WHERE id = ?', [sessionId]);
  return NextResponse.json({ messages, session });
}

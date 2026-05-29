import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role === 'FAMILY') {
    return NextResponse.json({ error: 'Family login cannot send interests' }, { status: 403 });
  }

  const { receiverId, message } = await req.json();

  const user = await queryOne('SELECT isPremium, premiumPlan FROM user WHERE id = ?', [session.user.id]);
  
  let interestLimit = 5; // Default free limit
  if (user && user.isPremium && user.premiumPlan) {
    const planConfig = await queryOne('SELECT permissions FROM planconfig WHERE plan = ?', [user.premiumPlan]);
    if (planConfig && planConfig.permissions) {
      try {
        const perms = JSON.parse(planConfig.permissions);
        interestLimit = perms.interestLimit !== undefined ? perms.interestLimit : 5;
      } catch (e) {}
    }
  } else {
    // If not premium, try to get the 'FREE' plan config if it exists
    const freePlan = await queryOne('SELECT permissions FROM planconfig WHERE plan = ?', ['FREE']);
    if (freePlan && freePlan.permissions) {
      try {
        const perms = JSON.parse(freePlan.permissions);
        interestLimit = perms.interestLimit !== undefined ? perms.interestLimit : 5;
      } catch (e) {}
    }
  }

  if (interestLimit !== -1) {
    // Count interests sent this month
    const countRow = await queryOne(
      'SELECT COUNT(id) as c FROM interest WHERE senderId = ? AND MONTH(createdAt) = MONTH(NOW()) AND YEAR(createdAt) = YEAR(NOW())',
      [session.user.id]
    );
    if (countRow && countRow.c >= interestLimit) {
      return NextResponse.json({ error: `Interest limit reached. You can only send ${interestLimit} interests per month on your current plan.` }, { status: 403 });
    }
  }

  const existing = await queryOne(
    'SELECT id FROM interest WHERE senderId = ? AND receiverId = ?',
    [session.user.id, receiverId]
  );
  if (existing) return NextResponse.json({ error: 'Interest already sent' }, { status: 409 });

  const id = randomUUID();
  const now = new Date();
  await execute(
    "INSERT INTO interest (id, senderId, receiverId, message, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)",
    [id, session.user.id, receiverId, message || null, now, now]
  );

  await execute(
    "INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt) VALUES (?, ?, 'INTEREST_RECEIVED', 'New Profile Interest', ?, 0, ?, NOW())",
    [randomUUID(), receiverId, `${session.user.name} expressed interest in your profile.`, `/profile/${session.user.id}`]
  );

  try {
    const { sendPushToUser } = await import('@/lib/webpush');
    await sendPushToUser(receiverId, {
      title: '💕 New Profile Interest',
      body: `${session.user.name} expressed interest in your profile.`,
      url: `/profile/${session.user.id}`,
    });
  } catch (e) { console.error('Push error:', e.message); }

  try {
    const { emitNotificationRefresh } = await import('@/lib/interestNotifications');
    emitNotificationRefresh(receiverId);
  } catch {}

  return NextResponse.json({ id, senderId: session.user.id, receiverId, status: 'PENDING' }, { status: 201 });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get('type') || 'received';
  const limit  = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Single JOIN query — no N+1
  const col = type === 'received' ? 'i.senderId' : 'i.receiverId';
  const rows = await query(
    `SELECT
       i.id, i.senderId, i.receiverId, i.message, i.status, i.createdAt, i.updatedAt,
       u.id AS u_id, u.name AS u_name, u.email AS u_email,
       u.image AS u_image, u.isPremium AS u_isPremium, u.isVerified AS u_isVerified,
       p.gender, p.dob, p.religion, p.city, p.country, p.education, p.profession, p.profileComplete,
       ph.url AS photo_url
     FROM interest i
     JOIN \`user\` u ON u.id = ${col}
     LEFT JOIN profile p ON p.userId = ${col}
     LEFT JOIN photo ph ON ph.userId = ${col} AND ph.isMain = 1
     WHERE ${type === 'received' ? 'i.receiverId' : 'i.senderId'} = ?
     ORDER BY i.createdAt DESC
     LIMIT ? OFFSET ?`,
    [session.user.id, limit, offset]
  );

  const enriched = rows.map((r) => {
    const user = {
      id: r.u_id, name: r.u_name, email: r.u_email,
      image: r.u_image, isPremium: r.u_isPremium, isVerified: r.u_isVerified,
      profile: { gender: r.gender, dob: r.dob, religion: r.religion, city: r.city, country: r.country, education: r.education, profession: r.profession, profileComplete: r.profileComplete },
      photos: r.photo_url ? [{ url: r.photo_url }] : [],
    };
    return {
      id: r.id, senderId: r.senderId, receiverId: r.receiverId,
      message: r.message, status: r.status, createdAt: r.createdAt, updatedAt: r.updatedAt,
      sender:   type === 'received' ? user : null,
      receiver: type === 'sent'     ? user : null,
    };
  });

  return NextResponse.json(enriched);
}

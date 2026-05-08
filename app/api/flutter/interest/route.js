import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const { receiverId, message } = await req.json();
    if (!receiverId) return NextResponse.json({ error: 'receiverId required' }, { status: 400 });

    const existing = await queryOne(
      'SELECT id FROM interest WHERE senderId = ? AND receiverId = ?',
      [decoded.id, receiverId]
    );
    if (existing) return NextResponse.json({ error: 'Interest already sent' }, { status: 409 });

    const id = randomUUID();
    const now = new Date();
    await execute(
      "INSERT INTO interest (id, senderId, receiverId, message, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)",
      [id, decoded.id, receiverId, message || null, now, now]
    );

    const sender = await queryOne('SELECT name FROM `user` WHERE id = ?', [decoded.id]);
    await execute(
      "INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt) VALUES (?, ?, 'INTEREST_RECEIVED', 'New Interest Received', ?, 0, ?, NOW())",
      [randomUUID(), receiverId, `${sender?.name} has sent you an interest request.`, `/profile/${decoded.id}`]
    );

    return NextResponse.json({ id, senderId: decoded.id, receiverId, status: 'PENDING' }, { status: 201 });
  } catch (err) {
    console.error('Interest POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type   = searchParams.get('type') || 'received'; // 'received' | 'sent'
    const page   = parseInt(searchParams.get('page')  || '1');
    const limit  = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Use fixed column names — no dynamic SQL injection risk
    const isReceived  = type !== 'sent';
    const filterCol   = isReceived ? 'i.receiverId' : 'i.senderId';
    const profileCol  = isReceived ? 'i.senderId'   : 'i.receiverId'; // whose profile to show
    // COUNT query has no alias — use plain column names
    const countCol    = isReceived ? 'receiverId' : 'senderId';

    const totalRow = await queryOne(
      `SELECT COUNT(*) AS cnt FROM interest WHERE ${countCol} = ?`,
      [decoded.id]
    );
    const total = Number(totalRow?.cnt || 0);

    // Fetch interests with the other user's profile
    const rows = await query(
      `SELECT
         i.id, i.senderId, i.receiverId, i.message, i.status, i.createdAt, i.updatedAt,
         u.id AS u_id, u.name AS u_name,
         u.isPremium AS u_isPremium, u.isVerified AS u_isVerified,
         u.verificationBadge AS u_verificationBadge,
         p.gender, p.dob, p.religion, p.city, p.country,
         p.education, p.profession, p.profileComplete,
         ph.url AS photo_url
       FROM interest i
       JOIN \`user\` u ON u.id = ${profileCol}
       LEFT JOIN profile p ON p.userId = u.id
       LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
       WHERE ${filterCol} = ?
       ORDER BY i.createdAt DESC
       LIMIT ? OFFSET ?`,
      [decoded.id, limit, offset]
    );

    // Bulk interaction flags
    const userIds = rows.map(r => r.u_id).filter(Boolean);
    let shortlistSet = new Set();
    let blockSet     = new Set();
    let interestMap  = {};

    if (userIds.length) {
      const ph = userIds.map(() => '?').join(',');
      const [shortlists, blocks, sentBack] = await Promise.all([
        query(`SELECT targetId FROM shortlist WHERE ownerId = ? AND targetId IN (${ph})`, [decoded.id, ...userIds]),
        query(`SELECT blockedId FROM block WHERE blockerId = ? AND blockedId IN (${ph})`, [decoded.id, ...userIds]),
        // For received list: check if I sent interest back to any of these senders
        isReceived
          ? query(`SELECT id, receiverId, status FROM interest WHERE senderId = ? AND receiverId IN (${ph})`, [decoded.id, ...userIds])
          : Promise.resolve([]),
      ]);
      shortlistSet = new Set(shortlists.map(s => s.targetId));
      blockSet     = new Set(blocks.map(b => b.blockedId));
      interestMap  = Object.fromEntries((sentBack || []).map(i => [i.receiverId, { id: i.id, status: i.status }]));
    }

    const enriched = rows.map((r) => {
      const otherUser = {
        id:               r.u_id,
        name:             r.u_name,
        isPremium:        !!r.u_isPremium,
        isVerified:       !!r.u_isVerified,
        verificationBadge:!!r.u_verificationBadge,
        profile: {
          gender: r.gender, dob: r.dob, religion: r.religion,
          city: r.city, country: r.country,
          education: r.education, profession: r.profession,
          profileComplete: r.profileComplete,
        },
        photos:        r.photo_url ? [{ url: r.photo_url }] : [],
        // For received: did I send interest back? For sent: this IS the sent interest
        interestSent:  isReceived ? (interestMap[r.u_id] || null) : { id: r.id, status: r.status },
        isShortlisted: shortlistSet.has(r.u_id),
        isBlocked:     blockSet.has(r.u_id),
      };

      return {
        id:         r.id,
        senderId:   r.senderId,
        receiverId: r.receiverId,
        message:    r.message,
        status:     r.status,
        createdAt:  r.createdAt,
        updatedAt:  r.updatedAt,
        sender:     isReceived ? otherUser : null,
        receiver:   !isReceived ? otherUser : null,
      };
    });

    return NextResponse.json({
      data: enriched,
      total,
      page,
      limit,
      hasMore: offset + enriched.length < total,
    });
  } catch (err) {
    console.error('Interest GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

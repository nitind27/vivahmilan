import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;

  // Single query: rooms + both users + profiles + photos + last message
  const rooms = await query(
    `SELECT
       cr.id, cr.userAId, cr.userBId, cr.createdAt,
       uA.id AS uA_id, uA.name AS uA_name, uA.email AS uA_email,
       uA.image AS uA_image, uA.isPremium AS uA_isPremium,
       uA.isVerified AS uA_isVerified, uA.lastSeen AS uA_lastSeen,
       pA.gender AS pA_gender, pA.city AS pA_city,
       pA.country AS pA_country, pA.profileComplete AS pA_profileComplete,
       phA.url AS phA_url,
       uB.id AS uB_id, uB.name AS uB_name, uB.email AS uB_email,
       uB.image AS uB_image, uB.isPremium AS uB_isPremium,
       uB.isVerified AS uB_isVerified, uB.lastSeen AS uB_lastSeen,
       pB.gender AS pB_gender, pB.city AS pB_city,
       pB.country AS pB_country, pB.profileComplete AS pB_profileComplete,
       phB.url AS phB_url,
       lm.id AS lm_id, lm.content AS lm_content, lm.createdAt AS lm_createdAt,
       lm.senderId AS lm_senderId, lm.type AS lm_type, lm.isRead AS lm_isRead
     FROM chatroom cr
     JOIN \`user\` uA ON uA.id = cr.userAId
     JOIN \`user\` uB ON uB.id = cr.userBId
     LEFT JOIN profile pA ON pA.userId = cr.userAId
     LEFT JOIN profile pB ON pB.userId = cr.userBId
     LEFT JOIN photo phA ON phA.userId = cr.userAId AND phA.isMain = 1
     LEFT JOIN photo phB ON phB.userId = cr.userBId AND phB.isMain = 1
     LEFT JOIN message lm ON lm.id = (
       SELECT id FROM message WHERE chatRoomId = cr.id ORDER BY createdAt DESC LIMIT 1
     )
     WHERE cr.userAId = ? OR cr.userBId = ?
     ORDER BY COALESCE(lm.createdAt, cr.createdAt) DESC`,
    [uid, uid]
  );

  const enriched = rooms.map((r) => ({
    id: r.id,
    userAId: r.userAId,
    userBId: r.userBId,
    createdAt: r.createdAt,
    userA: {
      id: r.uA_id, name: r.uA_name, email: r.uA_email,
      image: r.uA_image, isPremium: r.uA_isPremium,
      isVerified: r.uA_isVerified, lastSeen: r.uA_lastSeen,
      profile: { gender: r.pA_gender, city: r.pA_city, country: r.pA_country, profileComplete: r.pA_profileComplete },
      photos: r.phA_url ? [{ url: r.phA_url }] : [],
    },
    userB: {
      id: r.uB_id, name: r.uB_name, email: r.uB_email,
      image: r.uB_image, isPremium: r.uB_isPremium,
      isVerified: r.uB_isVerified, lastSeen: r.uB_lastSeen,
      profile: { gender: r.pB_gender, city: r.pB_city, country: r.pB_country, profileComplete: r.pB_profileComplete },
      photos: r.phB_url ? [{ url: r.phB_url }] : [],
    },
    messages: r.lm_id ? [{
      id: r.lm_id, content: r.lm_content, createdAt: r.lm_createdAt,
      senderId: r.lm_senderId, type: r.lm_type, isRead: r.lm_isRead,
    }] : [],
  }));

  return NextResponse.json(enriched);
}

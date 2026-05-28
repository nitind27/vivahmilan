import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';
import { resolveChatAccess } from '@/lib/chatAccess';
import { getInteractionMaps, attachInteractionFlags } from '@/lib/flutter-interactions';
import { maskBlockedPeer } from '@/lib/blockUtils';

function buildChatUser(r, side, maps) {
  const id = r[`u${side}_id`];
  const flags = attachInteractionFlags(id, maps);
  const user = {
    id,
    name: r[`u${side}_name`],
    email: r[`u${side}_email`],
    image: r[`u${side}_image`],
    isPremium: r[`u${side}_isPremium`],
    isVerified: r[`u${side}_isVerified`],
    profile: {
      gender: r[`p${side}_gender`],
      city: r[`p${side}_city`],
      country: r[`p${side}_country`],
      profileComplete: r[`p${side}_profileComplete`],
    },
    photos: r[`ph${side}_url`] ? [{ url: r[`ph${side}_url`] }] : [],
    ...flags,
  };
  return maskBlockedPeer(user);
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await queryOne(
    'SELECT isPremium, premiumPlan, premiumExpiry, freeTrialExpiry FROM `user` WHERE id = ?',
    [session.user.id]
  );
  const access = resolveChatAccess(dbUser);
  if (!access.hasAccess) {
    return NextResponse.json({ error: 'Chat access required', ...access }, { status: 403 });
  }

  const uid = session.user.id;

  // Single query: rooms + both users + profiles + photos + last message
  const rooms = await query(
    `SELECT
       cr.id, cr.userAId, cr.userBId, cr.createdAt,
       uA.id AS uA_id, uA.name AS uA_name, uA.email AS uA_email,
       uA.image AS uA_image, uA.isPremium AS uA_isPremium,
       uA.isVerified AS uA_isVerified,
       pA.gender AS pA_gender, pA.city AS pA_city,
       pA.country AS pA_country, pA.profileComplete AS pA_profileComplete,
       phA.url AS phA_url,
       uB.id AS uB_id, uB.name AS uB_name, uB.email AS uB_email,
       uB.image AS uB_image, uB.isPremium AS uB_isPremium,
       uB.isVerified AS uB_isVerified,
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

  const peerIds = [...new Set(rooms.flatMap(r => [r.uA_id, r.uB_id]).filter(id => id && id !== uid))];
  const maps = peerIds.length
    ? await getInteractionMaps(uid, peerIds)
    : { interestSentMap: {}, interestReceivedMap: {}, shortlistSet: new Set(), blockSet: new Set(), blockedBySet: new Set() };

  const enriched = rooms.map((r) => ({
    id: r.id,
    userAId: r.userAId,
    userBId: r.userBId,
    createdAt: r.createdAt,
    userA: buildChatUser(r, 'A', maps),
    userB: buildChatUser(r, 'B', maps),
    messages: r.lm_id ? [{
      id: r.lm_id, content: r.lm_content, createdAt: r.lm_createdAt,
      senderId: r.lm_senderId, type: r.lm_type, isRead: r.lm_isRead,
    }] : [],
  }));

  return NextResponse.json(enriched);
}

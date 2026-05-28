import { query } from '@/lib/db';

/** Bulk-fetch interest / shortlist / block flags for a list of other user IDs. */
export async function getInteractionMaps(viewerId, userIds) {
  if (!userIds?.length) {
    return {
      interestSentMap: {},
      interestReceivedMap: {},
      shortlistSet: new Set(),
      blockSet: new Set(),
      blockedBySet: new Set(),
    };
  }

  const placeholders = userIds.map(() => '?').join(',');

  const [sentInterests, receivedInterests, shortlists, blocksByMe, blocksByOther] = await Promise.all([
    query(
      `SELECT id, receiverId, status FROM interest WHERE senderId = ? AND receiverId IN (${placeholders})`,
      [viewerId, ...userIds]
    ),
    query(
      `SELECT id, senderId, status FROM interest WHERE receiverId = ? AND senderId IN (${placeholders})`,
      [viewerId, ...userIds]
    ),
    query(
      `SELECT targetId FROM shortlist WHERE ownerId = ? AND targetId IN (${placeholders})`,
      [viewerId, ...userIds]
    ),
    query(
      `SELECT blockedId FROM block WHERE blockerId = ? AND blockedId IN (${placeholders})`,
      [viewerId, ...userIds]
    ),
    query(
      `SELECT blockerId FROM block WHERE blockedId = ? AND blockerId IN (${placeholders})`,
      [viewerId, ...userIds]
    ),
  ]);

  return {
    interestSentMap: Object.fromEntries(
      sentInterests.map(i => [i.receiverId, { id: i.id, status: i.status }])
    ),
    interestReceivedMap: Object.fromEntries(
      receivedInterests.map(i => [i.senderId, { id: i.id, status: i.status }])
    ),
    shortlistSet: new Set(shortlists.map(s => s.targetId)),
    blockSet: new Set(blocksByMe.map(b => b.blockedId)),
    blockedBySet: new Set(blocksByOther.map(b => b.blockerId)),
  };
}

/** Attach standard interaction flags to a profile/user object. */
export function attachInteractionFlags(targetUserId, maps) {
  const blockedByMe = maps.blockSet.has(targetUserId);
  const blockedByOther = maps.blockedBySet?.has(targetUserId);
  return {
    interestSent: maps.interestSentMap[targetUserId] || null,
    interestReceived: maps.interestReceivedMap[targetUserId] || null,
    isShortlisted: maps.shortlistSet.has(targetUserId),
    blockedByMe,
    blockedByOther,
    isBlocked: blockedByMe || blockedByOther,
    // legacy alias
    isBlockedByMe: blockedByMe,
  };
}

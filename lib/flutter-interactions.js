import { query } from '@/lib/db';

/** Bulk-fetch interest / shortlist / block flags for a list of other user IDs. */
export async function getInteractionMaps(viewerId, userIds) {
  if (!userIds?.length) {
    return {
      interestSentMap: {},
      interestReceivedMap: {},
      shortlistSet: new Set(),
      blockSet: new Set(),
    };
  }

  const placeholders = userIds.map(() => '?').join(',');

  const [sentInterests, receivedInterests, shortlists, blocks] = await Promise.all([
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
  ]);

  return {
    interestSentMap: Object.fromEntries(
      sentInterests.map(i => [i.receiverId, { id: i.id, status: i.status }])
    ),
    interestReceivedMap: Object.fromEntries(
      receivedInterests.map(i => [i.senderId, { id: i.id, status: i.status }])
    ),
    shortlistSet: new Set(shortlists.map(s => s.targetId)),
    blockSet: new Set(blocks.map(b => b.blockedId)),
  };
}

/** Attach standard interaction flags to a profile/user object. */
export function attachInteractionFlags(targetUserId, maps) {
  return {
    interestSent: maps.interestSentMap[targetUserId] || null,
    interestReceived: maps.interestReceivedMap[targetUserId] || null,
    isShortlisted: maps.shortlistSet.has(targetUserId),
    isBlocked: maps.blockSet.has(targetUserId),
  };
}

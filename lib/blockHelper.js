import { queryOne } from '@/lib/db';

/** Block status between viewer and a single peer (server-only). */
export async function getBlockBetween(viewerId, peerId) {
  if (!viewerId || !peerId) {
    return { isBlocked: false, blockedByMe: false, blockedByOther: false };
  }

  const byMe = await queryOne(
    'SELECT id FROM block WHERE blockerId = ? AND blockedId = ?',
    [viewerId, peerId]
  );
  if (byMe) {
    return { isBlocked: true, blockedByMe: true, blockedByOther: false };
  }

  const byOther = await queryOne(
    'SELECT id FROM block WHERE blockerId = ? AND blockedId = ?',
    [peerId, viewerId]
  );
  if (byOther) {
    return { isBlocked: true, blockedByMe: false, blockedByOther: true };
  }

  return { isBlocked: false, blockedByMe: false, blockedByOther: false };
}

export { maskBlockedPeer, blockedChatMessage } from '@/lib/blockUtils';

/** @param {string|null|undefined} type */
export function normalizeLocationType(type) {
  const t = String(type || 'current').toLowerCase();
  return t === 'live' ? 'live' : 'current';
}

/** @param {'current'|'live'} locationType */
export function buildLocationContent(locationType) {
  return locationType === 'live' ? 'Shared live location' : 'Shared a location';
}

/** @param {string|Date|null|undefined} expiry @param {'current'|'live'} locationType */
export function parseLocationExpiry(expiry, locationType) {
  if (locationType !== 'live' || !expiry) return null;
  const d = new Date(expiry);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** @param {string|Date|null|undefined} locationExpiry */
export function isLocationExpired(locationExpiry) {
  if (!locationExpiry) return false;
  return new Date() > new Date(locationExpiry);
}

/** @param {object} msg row from message table */
export function formatLocationPayload(msg) {
  const locationType = msg.locationType || null;
  const expired = locationType === 'live' && isLocationExpired(msg.locationExpiry);

  return {
    id: msg.id,
    chatRoomId: msg.chatRoomId,
    senderId: msg.senderId,
    receiverId: msg.receiverId,
    latitude: msg.latitude != null ? Number(msg.latitude) : null,
    longitude: msg.longitude != null ? Number(msg.longitude) : null,
    locationType,
    locationExpiry: msg.locationExpiry || null,
    isLive: locationType === 'live',
    isExpired: expired,
    isActive: locationType === 'live' && !expired,
  };
}

/** Broadcast live location coordinate update via Socket.io */
export function emitLocationUpdate(msg, latitude, longitude) {
  const io = global.getIO?.();
  if (!io || !msg?.chatRoomId) return;

  const payload = {
    msgId: msg.id,
    roomId: msg.chatRoomId,
    latitude: Number(latitude),
    longitude: Number(longitude),
  };

  io.to(msg.chatRoomId).emit('location:update', payload);
  if (msg.receiverId) io.to(`user:${msg.receiverId}`).emit('location:update', payload);
}

/** Parse LOCATION body fields from JSON request */
export function parseLocationBody(body) {
  const latitude = body.latitude != null ? parseFloat(body.latitude) : undefined;
  const longitude = body.longitude != null ? parseFloat(body.longitude) : undefined;
  const locationType = normalizeLocationType(body.locationType);
  const locationExpiry = parseLocationExpiry(body.locationExpiry, locationType);
  const content = body.content?.trim() || buildLocationContent(locationType);

  return { latitude, longitude, locationType, locationExpiry, content };
}

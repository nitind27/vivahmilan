import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { queryOne, execute } from '@/lib/db';
import {
  formatLocationPayload,
  isLocationExpired,
  emitLocationUpdate,
} from '@/lib/chatLocation';

async function getAuthorizedMessage(msgId, userId) {
  const msg = await queryOne(
    `SELECT id, chatRoomId, senderId, receiverId, type, latitude, longitude, locationType, locationExpiry
     FROM message WHERE id = ?`,
    [msgId]
  );

  if (!msg || msg.type !== 'LOCATION') return { error: 'Location message not found', status: 404 };
  if (msg.senderId !== userId && msg.receiverId !== userId) {
    return { error: 'Forbidden', status: 403 };
  }

  return { msg };
}

// GET — fetch current coordinates for a location message (poll fallback)
export async function GET(req, { params }) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { msgId } = await params;
  const result = await getAuthorizedMessage(msgId, decoded.id);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json(formatLocationPayload(result.msg));
}

// PATCH — update live location coordinates (sender only)
export async function PATCH(req, { params }) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { msgId } = await params;
  const result = await getAuthorizedMessage(msgId, decoded.id);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  const msg = result.msg;
  if (msg.senderId !== decoded.id) {
    return NextResponse.json({ error: 'Only the sender can update live location' }, { status: 403 });
  }

  if (msg.locationType !== 'live') {
    return NextResponse.json({ error: 'This is not a live location message' }, { status: 400 });
  }

  if (isLocationExpired(msg.locationExpiry)) {
    return NextResponse.json({ error: 'Live location expired' }, { status: 410 });
  }

  const body = await req.json();
  const latitude = parseFloat(body.latitude);
  const longitude = parseFloat(body.longitude);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json({ error: 'latitude and longitude required' }, { status: 400 });
  }

  await execute(
    'UPDATE message SET latitude = ?, longitude = ? WHERE id = ?',
    [latitude, longitude, msgId]
  );

  const updated = await queryOne(
    `SELECT id, chatRoomId, senderId, receiverId, type, latitude, longitude, locationType, locationExpiry
     FROM message WHERE id = ?`,
    [msgId]
  );

  emitLocationUpdate(updated, latitude, longitude);

  return NextResponse.json(formatLocationPayload(updated));
}

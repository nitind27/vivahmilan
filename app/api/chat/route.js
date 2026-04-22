import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rooms = await query(
    'SELECT * FROM chatroom WHERE userAId = ? OR userBId = ? ORDER BY createdAt DESC',
    [session.user.id, session.user.id]
  );

  const enriched = await Promise.all(rooms.map(async (room) => {
    const otherUserId = room.userAId === session.user.id ? room.userBId : room.userAId;

    const userA = await queryOne('SELECT id, name, email, image, isPremium, isVerified, lastSeen FROM `user` WHERE id = ?', [room.userAId]);
    const userB = await queryOne('SELECT id, name, email, image, isPremium, isVerified, lastSeen FROM `user` WHERE id = ?', [room.userBId]);

    const profileA = await queryOne('SELECT gender, city, country, profileComplete FROM profile WHERE userId = ?', [room.userAId]);
    const profileB = await queryOne('SELECT gender, city, country, profileComplete FROM profile WHERE userId = ?', [room.userBId]);

    const photoA = await queryOne('SELECT url FROM photo WHERE userId = ? AND isMain = 1 LIMIT 1', [room.userAId]);
    const photoB = await queryOne('SELECT url FROM photo WHERE userId = ? AND isMain = 1 LIMIT 1', [room.userBId]);

    const lastMsg = await queryOne(
      'SELECT * FROM message WHERE chatRoomId = ? ORDER BY createdAt DESC LIMIT 1',
      [room.id]
    );

    return {
      ...room,
      userA: { ...userA, profile: profileA, photos: photoA ? [photoA] : [] },
      userB: { ...userB, profile: profileB, photos: photoB ? [photoB] : [] },
      messages: lastMsg ? [lastMsg] : [],
    };
  }));

  // Sort by latest message
  enriched.sort((a, b) => {
    const aTime = a.messages?.[0]?.createdAt ? new Date(a.messages[0].createdAt) : new Date(a.createdAt);
    const bTime = b.messages?.[0]?.createdAt ? new Date(b.messages[0].createdAt) : new Date(b.createdAt);
    return bTime - aTime;
  });

  return NextResponse.json(enriched);
}

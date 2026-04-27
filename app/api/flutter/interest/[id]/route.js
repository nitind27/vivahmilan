import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';
import { differenceInYears } from 'date-fns';

function buildProfileMessage(user, profile, isPremium) {
  const age = profile?.dob ? differenceInYears(new Date(), new Date(profile.dob)) : null;
  const lines = [
    `👤 *${user.name}*`,
    age ? `🎂 Age: ${age} years` : null,
    profile?.gender ? `⚧ Gender: ${profile.gender}` : null,
    profile?.religion ? `🙏 Religion: ${profile.religion}${profile.caste ? ` (${profile.caste})` : ''}` : null,
    (profile?.city || profile?.country) ? `📍 Location: ${[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}` : null,
    profile?.education ? `🎓 Education: ${profile.education}` : null,
    profile?.profession ? `💼 Profession: ${profile.profession}` : null,
    profile?.maritalStatus ? `💍 Marital Status: ${profile.maritalStatus.replace(/_/g, ' ')}` : null,
    isPremium && user.phone && !profile?.hidePhone ? `\n📞 Phone: ${user.phone}` : null,
    isPremium && user.email ? `📧 Email: ${user.email}` : null,
  ].filter(Boolean);

  const header = isPremium ? '🌟 *Premium Profile Details*\n━━━━━━━━━━━━━━━━━━━━' : '✨ *Profile Details*\n━━━━━━━━━━━━━━━━━━━━';
  const footer = isPremium ? '\n━━━━━━━━━━━━━━━━━━━━\n✅ Contact details shared (Premium)' : '\n━━━━━━━━━━━━━━━━━━━━\n🔒 Upgrade to Premium to see contact details';
  return `${header}\n${lines.join('\n')}${footer}`;
}

export async function PATCH(req, { params }) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  const interest = await queryOne('SELECT * FROM interest WHERE id = ?', [id]);
  if (!interest || interest.receiverId !== decoded.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await execute('UPDATE interest SET status = ?, updatedAt = NOW() WHERE id = ?', [status, id]);

  if (status === 'ACCEPTED') {
    const [a, b] = [interest.senderId, interest.receiverId].sort();
    let room = await queryOne('SELECT id FROM chatroom WHERE userAId = ? AND userBId = ?', [a, b]);
    if (!room) {
      const roomId = randomUUID();
      await execute('INSERT INTO chatroom (id, userAId, userBId, createdAt) VALUES (?, ?, ?, NOW())', [roomId, a, b]);
      room = { id: roomId };
    }

    await execute(
      "DELETE FROM message WHERE chatRoomId = ? AND (content LIKE '🌟 *Premium Profile Details*%' OR content LIKE '✨ *Profile Details*%')",
      [room.id]
    );

    const sender   = await queryOne('SELECT * FROM `user` WHERE id = ?', [interest.senderId]);
    const receiver = await queryOne('SELECT * FROM `user` WHERE id = ?', [interest.receiverId]);
    const senderProfile   = await queryOne('SELECT * FROM profile WHERE userId = ?', [interest.senderId]);
    const receiverProfile = await queryOne('SELECT * FROM profile WHERE userId = ?', [interest.receiverId]);

    await execute(
      "INSERT INTO message (id, chatRoomId, senderId, receiverId, content, type, isRead, createdAt) VALUES (?, ?, ?, ?, ?, 'TEXT', 0, NOW())",
      [randomUUID(), room.id, interest.receiverId, interest.senderId, buildProfileMessage(receiver, receiverProfile, !!receiver?.isPremium)]
    );
    await execute(
      "INSERT INTO message (id, chatRoomId, senderId, receiverId, content, type, isRead, createdAt) VALUES (?, ?, ?, ?, ?, 'TEXT', 0, NOW())",
      [randomUUID(), room.id, interest.senderId, interest.receiverId, buildProfileMessage(sender, senderProfile, !!sender?.isPremium)]
    );

    const currentUser = await queryOne('SELECT name FROM `user` WHERE id = ?', [decoded.id]);
    await execute(
      "INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt) VALUES (?, ?, 'INTEREST_ACCEPTED', '💕 Interest Accepted!', ?, 0, ?, NOW())",
      [randomUUID(), interest.senderId, `${currentUser?.name} accepted your interest. Start chatting!`, `/chat?userId=${decoded.id}`]
    );
  }

  const updated = await queryOne('SELECT * FROM interest WHERE id = ?', [id]);
  return NextResponse.json(updated);
}

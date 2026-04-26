import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
    profile?.motherTongue ? `🗣 Mother Tongue: ${profile.motherTongue}` : null,
    (profile?.city || profile?.country) ? `📍 Location: ${[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}` : null,
    profile?.education ? `🎓 Education: ${profile.education}` : null,
    profile?.profession ? `💼 Profession: ${profile.profession}` : null,
    profile?.income ? `💰 Income: ${profile.income}` : null,
    profile?.maritalStatus ? `💍 Marital Status: ${profile.maritalStatus.replace(/_/g, ' ')}` : null,
    profile?.height ? `📏 Height: ${profile.height} cm` : null,
    profile?.diet ? `🍽 Diet: ${profile.diet}` : null,
    profile?.familyType ? `👨‍👩‍👧 Family: ${profile.familyType}${profile.familyStatus ? ` · ${profile.familyStatus}` : ''}` : null,
    profile?.aboutMe ? `\n💬 About: ${profile.aboutMe}` : null,
    isPremium && user.phone && !profile?.hidePhone ? `\n📞 Phone: ${user.phone}` : null,
    isPremium && user.email ? `📧 Email: ${user.email}` : null,
  ].filter(Boolean);

  const header = isPremium
    ? '🌟 *Premium Profile Details*\n━━━━━━━━━━━━━━━━━━━━'
    : '✨ *Profile Details*\n━━━━━━━━━━━━━━━━━━━━';
  const footer = isPremium
    ? '\n━━━━━━━━━━━━━━━━━━━━\n✅ Contact details shared (Premium)'
    : '\n━━━━━━━━━━━━━━━━━━━━\n🔒 Upgrade to Premium to see contact details';

  return `${header}\n${lines.join('\n')}${footer}`;
}

async function sendMessage(chatRoomId, senderId, receiverId, content) {
  await execute(
    "INSERT INTO message (id, chatRoomId, senderId, receiverId, content, type, isRead, createdAt) VALUES (?, ?, ?, ?, ?, 'TEXT', 0, NOW())",
    [randomUUID(), chatRoomId, senderId, receiverId, content]
  );
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  const interest = await queryOne('SELECT * FROM interest WHERE id = ?', [id]);
  if (!interest || interest.receiverId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await execute('UPDATE interest SET status = ?, updatedAt = NOW() WHERE id = ?', [status, id]);

  if (status === 'ACCEPTED') {
    // Create or get chat room
    const [a, b] = [interest.senderId, interest.receiverId].sort();
    let room = await queryOne('SELECT id FROM chatroom WHERE userAId = ? AND userBId = ?', [a, b]);
    if (!room) {
      const roomId = randomUUID();
      await execute(
        'INSERT INTO chatroom (id, userAId, userBId, createdAt) VALUES (?, ?, ?, NOW())',
        [roomId, a, b]
      );
      room = { id: roomId };
    }

    // Delete any previously inserted profile messages for this room (re-insert fresh)
    await execute(
      "DELETE FROM message WHERE chatRoomId = ? AND (content LIKE '🌟 *Premium Profile Details*%' OR content LIKE '✨ *Profile Details*%')",
      [room.id]
    );

    // Fetch both users with profiles
    const sender = await queryOne('SELECT * FROM `user` WHERE id = ?', [interest.senderId]);
    const receiver = await queryOne('SELECT * FROM `user` WHERE id = ?', [interest.receiverId]);
    const senderProfile = await queryOne('SELECT * FROM profile WHERE userId = ?', [interest.senderId]);
    const receiverProfile = await queryOne('SELECT * FROM profile WHERE userId = ?', [interest.receiverId]);

    // RULE: each user sees the OTHER person's profile card
    // sender sees receiver's profile → message senderId=receiver, receiverId=sender
    // receiver sees sender's profile → message senderId=sender, receiverId=receiver
    const senderIsPremium = !!sender?.isPremium;
    const receiverIsPremium = !!receiver?.isPremium;

    // Sender gets to see receiver's profile card (receiver "sent" it to sender)
    await sendMessage(room.id, interest.receiverId, interest.senderId,
      buildProfileMessage(receiver, receiverProfile, receiverIsPremium));

    // Receiver gets to see sender's profile card (sender "sent" it to receiver)
    await sendMessage(room.id, interest.senderId, interest.receiverId,
      buildProfileMessage(sender, senderProfile, senderIsPremium));

    // Notification to sender
    const notifId = randomUUID();
    await execute(
      "INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt) VALUES (?, ?, 'INTEREST_ACCEPTED', '💕 Interest Accepted!', ?, 0, ?, NOW())",
      [
        notifId,
        interest.senderId,
        `${session.user.name} accepted your interest. Start chatting!`,
        `/chat?userId=${session.user.id}`,
      ]
    );

    // Real-time: notify sender via socket
    try {
      const io = global.getIO?.();
      if (io) {
        io.emit('notification:new', { userId: interest.senderId });
        // Don't emit fake message:receive — let users reload their chat to see profile cards
      }
    } catch {}
  }

  const updated = await queryOne('SELECT * FROM interest WHERE id = ?', [id]);
  return NextResponse.json(updated);
}

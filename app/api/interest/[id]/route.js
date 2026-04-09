import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { differenceInYears } from 'date-fns';

// Build a formatted profile card message
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
    // Contact details only for premium
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

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  const interest = await prisma.interest.findUnique({ where: { id } });
  if (!interest || interest.receiverId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.interest.update({ where: { id }, data: { status } });

  if (status === 'ACCEPTED') {
    // Create chat room
    const [a, b] = [interest.senderId, interest.receiverId].sort();
    const room = await prisma.chatRoom.upsert({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      create: { userAId: a, userBId: b },
      update: {},
    });

    // Fetch both users with profiles
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { id: interest.senderId },
        include: { profile: true },
      }),
      prisma.user.findUnique({
        where: { id: interest.receiverId },
        include: { profile: true },
      }),
    ]);

    // ── Auto-send profile cards if either user is premium ──────────────────

    // 1. Sender's profile → sent to receiver (if sender is premium)
    if (sender?.isPremium) {
      const msg = buildProfileMessage(sender, sender.profile, true);
      await prisma.message.create({
        data: {
          chatRoomId: room.id,
          senderId: interest.senderId,
          receiverId: interest.receiverId,
          content: msg,
          type: 'TEXT',
        },
      });
    }

    // 2. Receiver's profile → sent to sender (if receiver is premium)
    if (receiver?.isPremium) {
      const msg = buildProfileMessage(receiver, receiver.profile, true);
      await prisma.message.create({
        data: {
          chatRoomId: room.id,
          senderId: interest.receiverId,
          receiverId: interest.senderId,
          content: msg,
          type: 'TEXT',
        },
      });
    }

    // 3. If neither is premium — send basic profile cards (no contact)
    if (!sender?.isPremium && !receiver?.isPremium) {
      // Sender's basic profile to receiver
      const senderMsg = buildProfileMessage(sender, sender?.profile, false);
      await prisma.message.create({
        data: {
          chatRoomId: room.id,
          senderId: interest.senderId,
          receiverId: interest.receiverId,
          content: senderMsg,
          type: 'TEXT',
        },
      });
      // Receiver's basic profile to sender
      const receiverMsg = buildProfileMessage(receiver, receiver?.profile, false);
      await prisma.message.create({
        data: {
          chatRoomId: room.id,
          senderId: interest.receiverId,
          receiverId: interest.senderId,
          content: receiverMsg,
          type: 'TEXT',
        },
      });
    }

    // Notification to sender
    await prisma.notification.create({
      data: {
        userId: interest.senderId,
        type: 'INTEREST_ACCEPTED',
        title: '💕 Interest Accepted!',
        message: `${session.user.name} accepted your interest. ${sender?.isPremium || receiver?.isPremium ? 'Profile details shared in chat.' : 'Start chatting!'}`,
        link: `/chat?userId=${session.user.id}`,
      },
    });
  }

  return NextResponse.json(updated);
}

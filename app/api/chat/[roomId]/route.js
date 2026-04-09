import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { saveFile } from '@/lib/upload';

// Increase body size limit to 20MB for file uploads
export const config = {
  api: { bodyParser: false },
};

// Next.js App Router body size config
export const maxDuration = 30;

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room || (room.userAId !== session.user.id && room.userBId !== session.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { chatRoomId: roomId },
    orderBy: { createdAt: 'desc' },
    take: 40,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  await prisma.message.updateMany({
    where: { chatRoomId: roomId, receiverId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json(messages.reverse());
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!session.user.isPremium) {
    return NextResponse.json({ error: 'Chat requires a Premium subscription' }, { status: 403 });
  }

  const { roomId } = await params;

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room || (room.userAId !== session.user.id && room.userBId !== session.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const receiverId = room.userAId === session.user.id ? room.userBId : room.userAId;
  const contentType = req.headers.get('content-type') || '';

  let messageData = { chatRoomId: roomId, senderId: session.user.id, receiverId };

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file');
    const type = formData.get('type');
    // Client sends pre-compressed base64 for images
    const base64Data = formData.get('base64'); // compressed base64 from client

    if (!file && !base64Data) return NextResponse.json({ error: 'No file' }, { status: 400 });

    let fileUrl;
    let fileName;
    let fileSize;

    if (file) {
      const maxSize = 15 * 1024 * 1024;
      if (file.size > maxSize) return NextResponse.json({ error: 'Max file size: 15MB' }, { status: 400 });
      const saved = await saveFile(file, 'chat', session.user.id);
      fileUrl = saved.url;
      fileName = file.name;
      fileSize = file.size;
    } else {
      // base64 fallback from client (compressed image)
      fileUrl = base64Data;
      fileName = formData.get('fileName') || 'image.jpg';
      fileSize = parseInt(formData.get('fileSize') || '0');
    }

    messageData = {
      ...messageData,
      content: fileName,
      type,
      fileUrl,
      fileName,
      fileSize,
    };
  } else {
    const body = await req.json();
    const { content, type = 'TEXT', latitude, longitude } = body;

    if (type === 'LOCATION') {
      const expiry = body.locationExpiry ? new Date(body.locationExpiry) : null;
      messageData = {
        ...messageData,
        content: body.locationType === 'live' ? 'Shared live location' : 'Shared a location',
        type: 'LOCATION',
        latitude: parseFloat(body.latitude),
        longitude: parseFloat(body.longitude),
        locationType: body.locationType || 'current',
        locationExpiry: expiry,
      };
    } else {
      if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
      messageData = { ...messageData, content: content.trim(), type: 'TEXT' };
    }
  }

  const message = await prisma.message.create({ data: messageData });

  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'MESSAGE_RECEIVED',
      title: 'New Message',
      message: `${session.user.name} sent you a ${(messageData.type || 'message').toLowerCase()}.`,
      link: `/chat?userId=${session.user.id}`,
    },
  });

  return NextResponse.json(message, { status: 201 });
}

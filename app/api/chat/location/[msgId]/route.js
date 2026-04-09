import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Update live location coordinates
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { msgId } = await params;
  const { latitude, longitude } = await req.json();

  const msg = await prisma.message.findUnique({ where: { id: msgId } });
  if (!msg || msg.senderId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check if still within expiry
  if (msg.locationExpiry && new Date() > new Date(msg.locationExpiry)) {
    return NextResponse.json({ error: 'Live location expired' }, { status: 410 });
  }

  const updated = await prisma.message.update({
    where: { id: msgId },
    data: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
  });

  return NextResponse.json(updated);
}

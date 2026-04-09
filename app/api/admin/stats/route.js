import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalUsers, premiumUsers, pendingVerifications, pendingReports,
    totalMessages, newUsersToday, newUsersMonth, pendingAdminVerify,
    totalSubscriptions, activeSubscriptions, totalInterests, totalChats,
    maleUsers, femaleUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPremium: true } }),
    prisma.document.count({ where: { status: 'PENDING' } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.message.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.user.count({ where: { adminVerified: false, role: 'USER' } }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.interest.count(),
    prisma.chatRoom.count(),
    prisma.user.count({ where: { profile: { gender: 'MALE' } } }),
    prisma.user.count({ where: { profile: { gender: 'FEMALE' } } }),
  ]);

  return NextResponse.json({
    totalUsers, premiumUsers, pendingVerifications, pendingReports,
    totalMessages, newUsersToday, newUsersMonth, pendingAdminVerify,
    totalSubscriptions, activeSubscriptions, totalInterests, totalChats,
    maleUsers, femaleUsers,
  });
}

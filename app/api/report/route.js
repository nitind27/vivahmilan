import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetId, reason, details } = await req.json();

  const report = await prisma.report.create({
    data: { reporterId: session.user.id, targetId, reason, details },
  });

  return NextResponse.json(report, { status: 201 });
}

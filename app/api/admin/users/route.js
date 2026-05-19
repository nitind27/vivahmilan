import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get('page')  || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || ''; // 'pending', 'approved', 'rejected'

  const where = {
    role: 'USER',
    ...(search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : {}),
  };

  if (status === 'pending') {
    where.adminVerified = false;
    where.isActive = true;
  } else if (status === 'approved') {
    where.adminVerified = true;
    where.isActive = true;
  } else if (status === 'rejected') {
    where.isActive = false;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        profile: true,
        photos: { orderBy: { isMain: 'desc' }, take: 5 },
        documents: { orderBy: { createdAt: 'desc' } }, // all docs with url
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, totalPages: Math.ceil(total / limit) });
}

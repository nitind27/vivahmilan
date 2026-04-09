import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const plans = await prisma.planConfig.findMany({ orderBy: { price: 'asc' } });
  return NextResponse.json(plans);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { plan, displayName, price, currency, durationDays, permissions, description, isActive } = await req.json();

  const existing = await prisma.planConfig.findUnique({ where: { plan } });
  if (existing) {
    const updated = await prisma.planConfig.update({
      where: { plan },
      data: { displayName, price, currency, durationDays, permissions: JSON.stringify(permissions), description, isActive },
    });
    return NextResponse.json(updated);
  }

  const created = await prisma.planConfig.create({
    data: { plan, displayName, price, currency, durationDays, permissions: JSON.stringify(permissions), description, isActive: isActive ?? true },
  });
  return NextResponse.json(created, { status: 201 });
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const coupons = await prisma.couponCode.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(coupons);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { code, discountPct, maxUses, expiresAt } = await req.json();
  if (!code || !discountPct || !maxUses)
    return NextResponse.json({ error: 'code, discountPct, maxUses required' }, { status: 400 });

  const existing = await prisma.couponCode.findUnique({ where: { code: code.toUpperCase() } });
  if (existing)
    return NextResponse.json({ error: 'Code already exists' }, { status: 409 });

  const coupon = await prisma.couponCode.create({
    data: {
      code: code.toUpperCase(),
      discountPct: parseInt(discountPct),
      maxUses: parseInt(maxUses),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
  return NextResponse.json(coupon, { status: 201 });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, isActive } = await req.json();
  const updated = await prisma.couponCode.update({ where: { id }, data: { isActive } });
  return NextResponse.json(updated);
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  await prisma.couponCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

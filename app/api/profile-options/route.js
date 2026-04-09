import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET — fetch options by category (public)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  if (!category) {
    // Return all categories summary for admin
    const all = await prisma.profileOption.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
    return NextResponse.json(all);
  }

  const options = await prisma.profileOption.findMany({
    where: { category, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    select: { id: true, value: true, label: true, group: true, sortOrder: true },
  });

  return NextResponse.json(options);
}

// POST — add new option (admin only)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { category, value, label, group, sortOrder } = await req.json();
  if (!category || !value || !label) return NextResponse.json({ error: 'category, value, label required' }, { status: 400 });

  const existing = await prisma.profileOption.findUnique({ where: { category_value: { category, value } } });
  if (existing) return NextResponse.json({ error: 'Option already exists' }, { status: 409 });

  const option = await prisma.profileOption.create({
    data: { category, value: value.trim(), label: label.trim(), group: group || null, sortOrder: sortOrder || 0 },
  });
  return NextResponse.json(option, { status: 201 });
}

// PATCH — update option (admin only)
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, ...data } = await req.json();
  const option = await prisma.profileOption.update({ where: { id }, data });
  return NextResponse.json(option);
}

// DELETE — remove option (admin only)
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  await prisma.profileOption.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

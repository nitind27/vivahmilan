import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET all site config
export async function GET() {
  const configs = await prisma.siteconfig.findMany();
  const map = {};
  for (const c of configs) map[c.key] = c.value;
  return NextResponse.json(map);
}

// POST/update a config key
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

  const config = await prisma.siteconfig.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
  return NextResponse.json(config);
}

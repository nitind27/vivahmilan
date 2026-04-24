import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const stories = await prisma.successStory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(stories);
}

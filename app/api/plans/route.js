import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePlans } from '@/lib/plans.js';

export async function GET() {
  try {
    const plans = await prisma.planConfig.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    return NextResponse.json(normalizePlans(plans));
  } catch (err) {
    console.error('[api/plans]', err.message);
    return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 });
  }
}

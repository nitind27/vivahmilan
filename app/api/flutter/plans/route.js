import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const plans = await prisma.planConfig.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    // Parse permissions JSON string if stored as string
    const result = plans.map(p => ({
      ...p,
      permissions: typeof p.permissions === 'string'
        ? JSON.parse(p.permissions || '[]')
        : (p.permissions || []),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('Flutter plans error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

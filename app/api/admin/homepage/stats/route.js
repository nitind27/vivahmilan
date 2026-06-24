import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { execute } from '@/lib/db';
import {
  getHomepageStatsBundle,
  updateCustomStat,
  HOMEPAGE_STAT_DEFS,
  setHomepageStatsMode,
} from '@/lib/homepageStats';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const bundle = await getHomepageStatsBundle();
  return NextResponse.json(bundle);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  if (body.action === 'set_mode') {
    const mode = body.mode === 'manual' ? 'manual' : 'live';
    await setHomepageStatsMode(mode);
    const bundle = await getHomepageStatsBundle();
    return NextResponse.json({ success: true, ...bundle });
  }

  if (body.id && HOMEPAGE_STAT_DEFS.some((d) => d.id === body.id)) {
    await updateCustomStat(body.id, { value: body.value, suffix: body.suffix });
    const bundle = await getHomepageStatsBundle();
    return NextResponse.json({ success: true, ...bundle });
  }

  // Legacy: full stat row update (slides admin compatibility)
  const { id, icon, value, suffix, label, sortOrder } = body;
  if (id && HOMEPAGE_STAT_DEFS.some((d) => d.id === id)) {
    await execute(
      'UPDATE homepage_stat SET icon = ?, value = ?, suffix = ?, label = ?, sortOrder = ?, updatedAt = NOW() WHERE id = ?',
      [icon, Number(value), suffix, label, sortOrder || 0, id]
    );
    const bundle = await getHomepageStatsBundle();
    return NextResponse.json({ success: true, ...bundle });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Homepage stats are fixed — edit values instead of deleting.' },
    { status: 400 }
  );
}

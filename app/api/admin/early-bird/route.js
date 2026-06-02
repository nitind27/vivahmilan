import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getEarlyBirdSettings,
  normalizeEarlyBirdSettings,
  syncEarlyBirdClaimedCount,
  formatDurationLabel,
} from '@/lib/earlyBird';
import { queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

const CONFIG_KEY = 'early_bird_settings';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const settings = await syncEarlyBirdClaimedCount();
  return NextResponse.json({
    settings,
    durationLabel: formatDurationLabel(settings),
    slotsLeft: Math.max(0, settings.limit - settings.claimed),
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const current = await getEarlyBirdSettings();
    const merged = normalizeEarlyBirdSettings({
      ...current,
      ...body,
      enabled: body.enabled !== undefined ? body.enabled : current.enabled,
      limit: body.limit !== undefined ? body.limit : current.limit,
      planId: body.planId || current.planId,
      durationUnit: body.durationUnit || current.durationUnit,
      durationValue: body.durationValue !== undefined ? body.durationValue : current.durationValue,
      autoAssignOnSignup: body.autoAssignOnSignup !== undefined ? body.autoAssignOnSignup : current.autoAssignOnSignup,
      title: body.title ?? current.title,
      subtitle: body.subtitle ?? current.subtitle,
      claimed: body.resetClaimed ? 0 : current.claimed,
    });

    const actualClaimed = body.resetClaimed ? 0 : merged.claimed;
    const toSave = { ...merged, claimed: actualClaimed };

    const existing = await queryOne('SELECT id FROM siteconfig WHERE `key` = ?', [CONFIG_KEY]);
    const value = JSON.stringify(toSave);
    if (existing) {
      await execute('UPDATE siteconfig SET value = ?, updatedAt = NOW() WHERE `key` = ?', [value, CONFIG_KEY]);
    } else {
      await execute(
        'INSERT INTO siteconfig (id, `key`, value, updatedAt, createdAt) VALUES (?, ?, ?, NOW(), NOW())',
        [randomUUID(), CONFIG_KEY, value]
      );
    }

    const synced = body.resetClaimed ? toSave : await syncEarlyBirdClaimedCount();

    return NextResponse.json({
      success: true,
      settings: synced,
      durationLabel: formatDurationLabel(synced),
      slotsLeft: Math.max(0, synced.limit - synced.claimed),
      message: `Saved: first ${synced.limit} users get ${synced.planId} free for ${formatDurationLabel(synced)}`,
    });
  } catch (err) {
    console.error('[admin/early-bird]', err);
    return NextResponse.json({ error: err.message || 'Save failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getEarlyBirdSettings,
  getEarlyBirdClaimedCount,
  normalizeEarlyBirdSettings,
  formatDurationLabel,
  getPublicEarlyBirdCounts,
  getRealEarlyBirdCounts,
} from '@/lib/earlyBird';
import { queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

const CONFIG_KEY = 'early_bird_settings';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const settings = await getEarlyBirdSettings();
  const actualClaimed = await getEarlyBirdClaimedCount();
  const settingsSynced = { ...settings, claimed: actualClaimed };
  const real = getRealEarlyBirdCounts(settingsSynced, actualClaimed);
  const display = getPublicEarlyBirdCounts(settingsSynced);
  return NextResponse.json({
    settings: settingsSynced,
    durationLabel: formatDurationLabel(settingsSynced),
    real,
    display,
    slotsLeft: display.slotsLeft,
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
      displayLimit: body.displayLimit !== undefined ? body.displayLimit : current.displayLimit,
      displayClaimed: body.displayClaimed !== undefined ? body.displayClaimed : current.displayClaimed,
      planId: body.planId || current.planId,
      durationUnit: body.durationUnit || current.durationUnit,
      durationValue: body.durationValue !== undefined ? body.durationValue : current.durationValue,
      autoAssignOnSignup: body.autoAssignOnSignup !== undefined ? body.autoAssignOnSignup : current.autoAssignOnSignup,
      guestPopupEnabled: body.guestPopupEnabled !== undefined ? body.guestPopupEnabled : current.guestPopupEnabled,
      title: body.title ?? current.title,
      subtitle: body.subtitle ?? current.subtitle,
    });

    const actualClaimed = await getEarlyBirdClaimedCount();
    const finalSettings = { ...merged, claimed: actualClaimed };

    const existing = await queryOne('SELECT id FROM siteconfig WHERE `key` = ?', [CONFIG_KEY]);
    const value = JSON.stringify(finalSettings);
    if (existing) {
      await execute('UPDATE siteconfig SET value = ?, updatedAt = NOW() WHERE `key` = ?', [value, CONFIG_KEY]);
    } else {
      await execute(
        'INSERT INTO siteconfig (id, `key`, value, updatedAt, createdAt) VALUES (?, ?, ?, NOW(), NOW())',
        [randomUUID(), CONFIG_KEY, value]
      );
    }

    const real = getRealEarlyBirdCounts(finalSettings, finalSettings.claimed);
    const display = getPublicEarlyBirdCounts(finalSettings);

    return NextResponse.json({
      success: true,
      settings: finalSettings,
      durationLabel: formatDurationLabel(finalSettings),
      real,
      display,
      slotsLeft: display.slotsLeft,
      message: `Saved. Site shows ${display.claimedCount} / ${display.limit} claimed (${display.slotsLeft} left). Actual: ${real.claimedCount} / ${real.limit}.`,
    });
  } catch (err) {
    console.error('[admin/early-bird]', err);
    return NextResponse.json({ error: err.message || 'Save failed' }, { status: 500 });
  }
}

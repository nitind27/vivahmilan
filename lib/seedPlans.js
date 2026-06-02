import prisma from '@/lib/prisma';
import { DEFAULT_PLANS } from '@/lib/defaultPlans';
import { randomUUID } from 'crypto';
import { queryOne, execute } from '@/lib/db';

/** Upsert all default plans via Prisma */
export async function seedDefaultPlans() {
  const results = [];
  for (const p of DEFAULT_PLANS) {
    const permissions = JSON.stringify(p.permissions);
    const existing = await prisma.planConfig.findUnique({ where: { plan: p.plan } });
    if (existing) {
      const updated = await prisma.planConfig.update({
        where: { plan: p.plan },
        data: {
          displayName: p.displayName,
          price: p.price,
          currency: p.currency,
          durationDays: p.durationDays,
          permissions,
          description: p.description,
          isActive: p.isActive,
        },
      });
      results.push({ plan: p.plan, action: 'updated', id: updated.id });
    } else {
      const created = await prisma.planConfig.create({
        data: {
          plan: p.plan,
          displayName: p.displayName,
          price: p.price,
          currency: p.currency,
          durationDays: p.durationDays,
          permissions,
          description: p.description,
          isActive: p.isActive,
        },
      });
      results.push({ plan: p.plan, action: 'created', id: created.id });
    }
  }
  return results;
}

/** Ensure early_bird_settings exists in siteconfig */
export async function ensureEarlyBirdConfig() {
  const { DEFAULT_EARLY_BIRD_SETTINGS } = await import('@/lib/defaultPlans');
  const { normalizeEarlyBirdSettings } = await import('@/lib/earlyBird');
  const existing = await queryOne('SELECT id, value FROM siteconfig WHERE `key` = ?', ['early_bird_settings']);
  if (!existing) {
    const normalized = normalizeEarlyBirdSettings(DEFAULT_EARLY_BIRD_SETTINGS);
    await execute(
      'INSERT INTO siteconfig (id, `key`, value, updatedAt, createdAt) VALUES (?, ?, ?, NOW(), NOW())',
      [randomUUID(), 'early_bird_settings', JSON.stringify(normalized)]
    );
    return normalized;
  }
  try {
    return normalizeEarlyBirdSettings(JSON.parse(existing.value));
  } catch {
    return normalizeEarlyBirdSettings(DEFAULT_EARLY_BIRD_SETTINGS);
  }
}

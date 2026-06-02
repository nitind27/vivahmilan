import { getSiteConfig } from '@/lib/siteconfig';
import { queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export const SHOW_PRICING_KEY = 'show_pricing_section';

export async function getShowPricingSection() {
  const v = await getSiteConfig(SHOW_PRICING_KEY);
  if (v === null || v === undefined || v === '') return true;
  return v === '1' || v === 'true';
}

export async function setShowPricingSection(enabled) {
  const value = enabled ? '1' : '0';
  const existing = await queryOne('SELECT id FROM siteconfig WHERE `key` = ?', [SHOW_PRICING_KEY]);
  if (existing) {
    await execute('UPDATE siteconfig SET value = ?, updatedAt = NOW() WHERE `key` = ?', [value, SHOW_PRICING_KEY]);
  } else {
    await execute(
      'INSERT INTO siteconfig (id, `key`, value, updatedAt, createdAt) VALUES (?, ?, ?, NOW(), NOW())',
      [randomUUID(), SHOW_PRICING_KEY, value]
    );
  }
  return enabled;
}

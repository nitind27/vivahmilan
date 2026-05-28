import { query, queryOne } from '@/lib/db';

const DEFAULTS = {
  freeTrialDays: '1', // 1 day free trial for new users
  welcome_gate_enabled: '0', // 1 = welcome.html login required, 0 = open site directly
  play_store_url: '',
  app_store_url: '',
  app_nav_enabled: '1',
};

export async function getSiteConfig(key) {
  try {
    const config = await queryOne('SELECT `value` FROM siteconfig WHERE `key` = ?', [key]);
    return config ? config.value : DEFAULTS[key] ?? null;
  } catch (error) {
    console.error('getSiteConfig error:', error);
    return DEFAULTS[key] ?? null;
  }
}

export async function getAllSiteConfig() {
  try {
    const configs = await query('SELECT `key`, `value` FROM siteconfig');
    const map = { ...DEFAULTS };
    for (const c of configs) map[c.key] = c.value;
    return map;
  } catch (error) {
    console.error('getAllSiteConfig error:', error);
    return { ...DEFAULTS };
  }
}

import { query, queryOne } from '@/lib/db';

const DEFAULTS = {
  freeTrialDays: '1', // days of free trial granted on admin approval (0 = disabled)
  freeTrialEmailEnabled: '1', // 1 = mention trial/Early Bird access in approval email
  welcome_gate_enabled: '0', // 1 = welcome.html login required, 0 = open site directly
  user_portal_access: '0', // 1 = full portal open, 0 = verified users see launch page after login
  developer_portal_emails: '', // comma-separated developer emails with full portal bypass
  play_store_url: '',
  app_store_url: '',
  app_nav_enabled: '1',
  donation_enabled: '0',
  donation_page_title: 'Shaadi Sahayata — Wedding Support Fund',
  donation_page_subtitle:
    'Help verified members without parental support for their wedding. Every donation is tracked publicly.',
  donation_transparency_note:
    'All expenses are published by our admin team. You can see exactly how funds are used — no hidden charges.',
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

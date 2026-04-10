import prisma from '@/lib/prisma';

const DEFAULTS = {
  freeTrialDays: '1', // 1 day free trial for new users
};

export async function getSiteConfig(key) {
  try {
    const config = await prisma.siteconfig.findUnique({ where: { key } });
    return config ? config.value : DEFAULTS[key] ?? null;
  } catch {
    return DEFAULTS[key] ?? null;
  }
}

export async function getAllSiteConfig() {
  try {
    const configs = await prisma.siteconfig.findMany();
    const map = { ...DEFAULTS };
    for (const c of configs) map[c.key] = c.value;
    return map;
  } catch {
    return { ...DEFAULTS };
  }
}

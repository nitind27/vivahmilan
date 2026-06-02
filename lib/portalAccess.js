import { getSiteConfig } from '@/lib/siteconfig';
import { isDeveloperBypassEmail, parseDeveloperEmails } from '@/lib/developerAccess';
import { SITE_CONTACT } from '@/lib/siteContact';

export const PORTAL_CONTACT = SITE_CONTACT;

const DEFAULT_LAUNCH_MESSAGE = {
  title: 'Your Profile Will Be Live Soon',
  subtitle: 'Congratulations! Your registration has been verified.',
  body:
    'We are putting the final touches on your profile. Very soon you will be able to view your complete profile, explore matches, and use all features.',
  updateNote: 'When your access is enabled, you will receive an update via email or SMS.',
  supportNote: 'If you face any issue, please contact us using the phone number or email below.',
  steps: [
    { label: 'Registration complete', done: true },
    { label: 'Verified by admin', done: true },
    { label: 'Profile launching very soon', done: false, active: true },
    { label: 'You will receive an update', done: false },
  ],
};

/** Map legacy Hindi/EN JSON from siteconfig to English-only shape */
function normalizeLaunchMessage(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_LAUNCH_MESSAGE;
  return {
    title: raw.title || raw.titleEn || raw.titleHi || DEFAULT_LAUNCH_MESSAGE.title,
    subtitle: raw.subtitle || raw.subtitleEn || raw.subtitleHi || DEFAULT_LAUNCH_MESSAGE.subtitle,
    body: raw.body || raw.bodyEn || raw.bodyHi || DEFAULT_LAUNCH_MESSAGE.body,
    updateNote: raw.updateNote || raw.updateNoteEn || raw.updateNoteHi || DEFAULT_LAUNCH_MESSAGE.updateNote,
    supportNote: raw.supportNote || raw.supportNoteEn || raw.supportNoteHi || DEFAULT_LAUNCH_MESSAGE.supportNote,
    steps: Array.isArray(raw.steps)
      ? raw.steps.map((s) => ({
          label: s.label || s.en || s.hi || '',
          done: !!s.done,
          active: !!s.active,
        }))
      : DEFAULT_LAUNCH_MESSAGE.steps,
  };
}

export async function isUserPortalOpen() {
  const value = await getSiteConfig('user_portal_access');
  return value === '1';
}

export async function getDeveloperPortalEmails() {
  const raw = await getSiteConfig('developer_portal_emails');
  return parseDeveloperEmails(raw);
}

export { isDeveloperBypassEmail };

export async function getPortalLaunchMessage() {
  try {
    const raw = await getSiteConfig('portal_launch_message');
    if (!raw) return DEFAULT_LAUNCH_MESSAGE;
    const parsed = JSON.parse(raw);
    return normalizeLaunchMessage({ ...DEFAULT_LAUNCH_MESSAGE, ...parsed });
  } catch {
    return DEFAULT_LAUNCH_MESSAGE;
  }
}

/** Whether this account may use the full user portal (web + app features). */
export async function getPortalAccessForUser({ email, role } = {}) {
  if (role === 'ADMIN') {
    return { granted: true, reason: 'admin' };
  }
  if (await isDeveloperBypassEmail(email)) {
    return { granted: true, reason: 'developer' };
  }
  const open = await isUserPortalOpen();
  if (open) {
    return { granted: true, reason: 'portal_open' };
  }
  const message = await getPortalLaunchMessage();
  return {
    granted: false,
    reason: 'portal_closed',
    message,
    contact: PORTAL_CONTACT,
  };
}

export function getPostLoginPath({ role, portalAccessGranted }) {
  if (role === 'ADMIN') return '/admin';
  if (portalAccessGranted === false) return '/profile-launch';
  return '/dashboard';
}

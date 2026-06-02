import { getSiteConfig } from '@/lib/siteconfig';
import { isDeveloperBypassEmail, parseDeveloperEmails } from '@/lib/developerAccess';

export const PORTAL_CONTACT = {
  phone: '8735995467',
  phoneDisplay: '+91 87359 95467',
  email: 'supportvivahdwar@gmail.com',
};

const DEFAULT_LAUNCH_MESSAGE = {
  titleHi: 'Aapki Profile Jald Hi Tayyar Hogi!',
  titleEn: 'Your Profile Will Be Live Soon',
  subtitleHi: 'Badhai ho! Aapka registration verify ho chuka hai.',
  subtitleEn: 'Congratulations! Your registration has been verified.',
  bodyHi:
    'Hum aapki profile ko final touches de rahe hain. Jald hi aap apna complete profile dekh payenge, matches explore kar payenge, aur saari features use kar payenge.',
  bodyEn:
    'We are putting the final touches on your profile. Very soon you will be able to view your complete profile, explore matches, and use all features.',
  updateNoteHi: 'Jab aapka access khul jayega, aapko email ya SMS ke through update mil jayegi.',
  updateNoteEn: 'When your access is enabled, you will receive an update via email or SMS.',
  supportNoteHi: 'Koi samasya ho to neeche diye gaye number ya email par sampark karein.',
  supportNoteEn: 'If you face any issue, please contact us using the phone number or email below.',
  steps: [
    { hi: 'Registration poora ho gaya', en: 'Registration complete', done: true },
    { hi: 'Admin ne verify kar diya', en: 'Verified by admin', done: true },
    { hi: 'Profile jald launch hogi', en: 'Profile launching very soon', done: false, active: true },
    { hi: 'Aapko update notification milegi', en: 'You will receive an update', done: false },
  ],
};

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
    return { ...DEFAULT_LAUNCH_MESSAGE, ...parsed };
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

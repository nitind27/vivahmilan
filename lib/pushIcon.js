/** Brand icon for web push, service worker, and FCM image notifications */
export const PUSH_ICON_PATH = '/logo/icon.png';

export function getPushIconUrl(origin) {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000';
  return `${String(base).replace(/\/$/, '')}${PUSH_ICON_PATH}`;
}

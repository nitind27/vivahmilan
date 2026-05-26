/** Remember-me helpers (email only — never store password in the browser). */

export const REMEMBER_EMAIL_KEY = 'vd_remember_email';
export const REMEMBER_ENABLED_KEY = 'vd_remember_enabled';

export function getRememberedEmail() {
  if (typeof window === 'undefined') return '';
  try {
    if (localStorage.getItem(REMEMBER_ENABLED_KEY) !== '1') return '';
    return localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function getRememberPreference() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(REMEMBER_ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveRememberLogin(email, enabled) {
  if (typeof window === 'undefined') return;
  try {
    if (enabled && email?.trim()) {
      localStorage.setItem(REMEMBER_ENABLED_KEY, '1');
      localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim().toLowerCase());
    } else {
      localStorage.removeItem(REMEMBER_ENABLED_KEY);
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  } catch {
    /* ignore */
  }
}

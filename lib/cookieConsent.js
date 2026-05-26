/** Cookie consent preferences (localStorage + optional anonymous server log). */

export const CONSENT_KEY = 'vd_cookie_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_SESSION_KEY = 'vd_consent_sid';

/** @typedef {{ essential: true, functional: boolean, analytics: boolean, version: number, updatedAt: string }} CookieConsent */

export function getConsentSessionId() {
  if (typeof window === 'undefined') return null;
  let sid = sessionStorage.getItem(CONSENT_SESSION_KEY);
  if (!sid) {
    sid = `cs_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    sessionStorage.setItem(CONSENT_SESSION_KEY, sid);
  }
  return sid;
}

/** @returns {CookieConsent | null} */
export function getConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.version !== CONSENT_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

/** @param {{ functional: boolean, analytics: boolean }} prefs */
export function setConsent(prefs, choiceType = 'custom') {
  if (typeof window === 'undefined') return;
  /** @type {CookieConsent} */
  const data = {
    essential: true,
    functional: !!prefs.functional,
    analytics: !!prefs.analytics,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('vd-cookie-consent', { detail: data }));
  logConsentToServer(data, choiceType);
}

/** @param {CookieConsent} data @param {'all'|'essential'|'custom'} choiceType */
export function logConsentToServer(data, choiceType) {
  if (typeof window === 'undefined') return;
  fetch('/api/cookie-consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      choiceType,
      functional: data.functional,
      analytics: data.analytics,
      sessionId: getConsentSessionId(),
    }),
    keepalive: true,
  }).catch(() => {});
}

export function hasConsentChoice() {
  return getConsent() !== null;
}

export function acceptAll() {
  setConsent({ functional: true, analytics: true }, 'all');
}

export function essentialOnly() {
  setConsent({ functional: false, analytics: false }, 'essential');
}

export function acceptsFunctional() {
  const c = getConsent();
  return c?.functional === true;
}

export function acceptsAnalytics() {
  const c = getConsent();
  return c?.analytics === true;
}

/** Re-open settings modal/banner from footer link */
export function openCookieSettings() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('vd-open-cookie-settings'));
}

const LOGIN_GEO_SESSION_KEY = 'vd_login_geo_logged';

/**
 * Browser GPS (high accuracy when possible). Resolves null if denied/unsupported/timeout.
 */
export function getClientGeo(timeoutMs = 8000, { highAccuracy = true } = {}) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy != null ? Math.round(pos.coords.accuracy) : null,
        });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: timeoutMs,
        maximumAge: 0,
      }
    );
  });
}

/** Public IP from browser (fallback when server only sees localhost / proxy). */
export async function getClientPublicIP() {
  const providers = [
    () => fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3500), cache: 'no-store' }),
    () => fetch('https://api64.ipify.org?format=json', { signal: AbortSignal.timeout(3500), cache: 'no-store' }),
  ];
  for (const fetchFn of providers) {
    try {
      const res = await fetchFn();
      const data = await res.json();
      if (data?.ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(data.ip)) return data.ip;
    } catch {}
  }
  return null;
}

const PUB_IP_CACHE_KEY = '_vd_pubip';

/** Session-cached public IP for analytics (one lookup per tab). */
export async function getCachedClientPublicIP() {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(PUB_IP_CACHE_KEY);
    if (cached && cached !== 'null') return cached;
  } catch {}
  const ip = await getClientPublicIP();
  if (ip) {
    try { sessionStorage.setItem(PUB_IP_CACHE_KEY, ip); } catch {}
  }
  return ip;
}

async function buildLoginGeoPayload() {
  const [geo, clientPublicIp] = await Promise.all([
    getClientGeo(8000, { highAccuracy: true }),
    getClientPublicIP(),
  ]);
  return {
    platform: 'web',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent?.slice(0, 500) : null,
    ...(clientPublicIp ? { clientPublicIp } : {}),
    ...(geo || {}),
  };
}

/**
 * Log login geo after successful web login (IP always; GPS when browser allows).
 */
export async function logWebLogin() {
  if (typeof window === 'undefined') return;
  try {
    const payload = await buildLoginGeoPayload();
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 700));
      const res = await fetch('/api/auth/log-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
        keepalive: true,
      });
      if (res.ok) {
        try { sessionStorage.setItem(LOGIN_GEO_SESSION_KEY, '1'); } catch {}
        return;
      }
      if (res.status !== 401) break;
    }
  } catch {}
}

/** Once per browser session after OAuth / direct dashboard entry. */
export async function logWebLoginIfNeeded() {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(LOGIN_GEO_SESSION_KEY)) return;
  } catch {}
  await logWebLogin();
}

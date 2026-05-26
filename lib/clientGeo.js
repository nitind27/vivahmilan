/**
 * Browser GPS coordinates (optional). Falls back silently if denied/unsupported.
 */
export function getClientGeo(timeoutMs = 5000) {
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
        });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 120000 }
    );
  });
}

/** Log login geo to admin panel after successful web login. */
export async function logWebLogin() {
  try {
    const geo = await getClientGeo(4000);
    const payload = JSON.stringify({ platform: 'web', ...geo });
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 600));
      const res = await fetch('/api/auth/log-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      });
      if (res.ok) break;
    }
  } catch {}
}

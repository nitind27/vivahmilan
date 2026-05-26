// Milan Matrimony — Service Worker v3
const PUSH_ICON = '/logo/icon.png';

function showAppNotification({ title, body, icon, url, tag }) {
  const iconUrl = icon || PUSH_ICON;
  const absoluteIcon =
    iconUrl.startsWith('http') ? iconUrl : new URL(iconUrl, self.location.origin).href;

  return self.registration.showNotification(title, {
    body,
    icon: absoluteIcon,
    badge: absoluteIcon,
    tag: tag || 'milan-push',
    renotify: true,
    requireInteraction: false,
    data: { url: url || '/' },
  });
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// In-page notification (optional client postMessage)
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'SHOW_NOTIFICATION') return;
  event.waitUntil(
    showAppNotification({
      title: event.data.title || 'Vivah Dwar',
      body: event.data.body || '',
      icon: event.data.icon,
      url: event.data.url,
      tag: 'milan-local',
    })
  );
});

// ── Web Push from server ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'Vivah Dwar',
    body: 'You have a new notification',
    icon: PUSH_ICON,
    url: '/',
    tag: 'milan-push',
  };

  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {}

  event.waitUntil(
    showAppNotification({
      title: data.title,
      body: data.body,
      icon: data.icon,
      url: data.url,
      tag: data.tag,
    })
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

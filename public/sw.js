// Milan Matrimony Service Worker — Web Push Notifications

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// ── Real Web Push (from server) ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Milan Matrimony', body: 'You have a new notification', icon: '/favicon.ico', url: '/' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'milan-' + Date.now(),
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
    })
  );
});

// ── In-app message (when tab is open but in background) ───────────────────────
self.addEventListener('message', (event) => {
  const { type, title, body, icon, url } = event.data || {};
  if (type !== 'SHOW_NOTIFICATION') return;

  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const anyFocused = clients.some(c => c.focused);
    if (!anyFocused) {
      self.registration.showNotification(title || 'Milan Matrimony', {
        body: body || 'You have a new notification',
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'milan-msg-' + Date.now(),
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: url || '/' },
      });
    }
  });
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      self.clients.openWindow(targetUrl);
    })
  );
});

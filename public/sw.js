// Milan Matrimony — Service Worker v2

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// ── Web Push from server ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'Milan Matrimony',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    url: '/',
    tag: 'milan-push',
  };

  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: '/favicon.ico',
      // Same tag = replaces previous notification of same type (no duplicates)
      tag: data.tag || 'milan-push',
      renotify: true,
      requireInteraction: false,
      data: { url: data.url || '/' },
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

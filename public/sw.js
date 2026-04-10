// Milan Matrimony — Service Worker v2

self.addEventListener('install', (e) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[SW] Activated');
  e.waitUntil(self.clients.claim());
});

// ── Web Push from server ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: 'Milan Matrimony',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    url: '/',
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    console.error('[SW] Push parse error:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'milan-' + Date.now(),
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || '/' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Open new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ── In-page message (tab open but not focused) ────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'SHOW_NOTIFICATION') return;

  const { title, body, icon, url } = event.data;

  self.registration.showNotification(title || 'Milan Matrimony', {
    body: body || '',
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'milan-msg-' + Date.now(),
    renotify: true,
    data: { url: url || '/' },
  });
});

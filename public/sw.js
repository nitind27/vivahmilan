// Milan Matrimony Service Worker — Background Push Notifications

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Listen for messages from the app
self.addEventListener('message', (event) => {
  const { type, title, body, icon, url } = event.data || {};

  if (type === 'SHOW_NOTIFICATION') {
    // Check if any client (tab) is focused — if yes, skip OS notification
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const anyFocused = clients.some(c => c.focused);
      if (!anyFocused) {
        self.registration.showNotification(title || 'Milan Matrimony', {
          body: body || 'You have a new notification',
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: type + '_' + Date.now(),
          renotify: true,
          data: { url: url || '/' },
        });
      }
    });
  }
});

// Notification click — open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // If app already open, focus it
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open new tab
      self.clients.openWindow(targetUrl);
    })
  );
});

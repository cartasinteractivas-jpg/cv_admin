self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', (event) => {
  let data = { title: 'WebPocket', body: 'Nuevo pedido' };
  try { if (event.data) data = Object.assign(data, event.data.json()); } catch (_) {}
  event.waitUntil(self.registration.showNotification(data.title || 'WebPocket · Pedido', {
    body: data.body || 'Tienes un pedido nuevo',
    tag: data.tag || 'wp-pedido',
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const c of clients) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('./');
  }));
});

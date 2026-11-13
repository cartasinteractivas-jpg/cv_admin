self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', (event) => {
  let data = { title: 'WebPocket', body: '¡Nuevo pedido recibido!' };
  
  try {
    if (event.data) {
      const parsed = event.data.json();
      if (parsed) data = { ...data, ...parsed };
    }
  } catch (_) {}

  const options = {
    body: data.body || "Tienes un nuevo pedido pendiente.",
    vibrate: [500, 200, 500, 200, 500, 200, 500],
    tag: data.tag || 'wp-pedido-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: { url: './' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'WebPocket · Nuevo pedido', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

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
    vibrate: [1000, 500, 1000, 500, 1000, 500, 1000],
    tag: 'wp-pedido-nuevo',
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: { url: './' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Si la app ya está abierta, le avisamos para que suene
      for (const client of clientList) {
        client.postMessage({ action: 'play_audio_pedido' });
        return client.focus();
      }
      // 2. Si está cerrada, la abrimos con ?pedido_nuevo=1
      if (clients.openWindow) {
        return clients.openWindow('./?pedido_nuevo=1');
      }
    })
  );
});

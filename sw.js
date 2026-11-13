self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', (event) => {
  let data = { title: 'WebPocket', body: '¡Nuevo pedido recibido!' };
  
  // Intentar leer los datos que envía Supabase
  try {
    if (event.data) {
      const parsed = event.data.json();
      if (parsed) data = { ...data, ...parsed };
    }
  } catch (_) {}

  const options = {
    body: data.body || "Tienes un nuevo pedido pendiente.",
    icon: 'https://cartasinteractivas-jpg.github.io/cv_start/logo.png', // Pon la ruta de tu logo si tienes
    badge: 'https://cartasinteractivas-jpg.github.io/cv_start/logo.png',
    vibrate: [500, 200, 500, 200, 500, 200, 500], // Vibración larga e insistente
    tag: data.tag || 'wp-pedido-' + Date.now(), // Si pones un tag único, sonará cada vez. Si pones uno fijo, lo reemplaza.
    renotify: true, // Obliga a que suene y vibre de nuevo aunque ya haya una notificación
    requireInteraction: true, // La notificación se queda en pantalla hasta que la toquen (no desaparece sola)
    silent: false, // Asegura que el sistema haga ruido
    data: { url: data.url || './' }
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

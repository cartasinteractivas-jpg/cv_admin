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

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // 1. Guardamos la bandera para que suene el MP3 al abrir
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya está abierto, enviamos un mensaje directo
      for (const client of clientList) {
        client.postMessage({ action: 'play_audio_pedido' });
      }
      
      // Si está cerrado, abrimos la app con una variable en la URL (?pedido=1)
      if (clients.openWindow) {
        return clients.openWindow('./?pedido_nuevo=1');
      }
    })
  );
});

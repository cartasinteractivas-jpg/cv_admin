/* WebPocket service worker — notificaciones de pedidos (móvil suspendido) */
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "WebPocket · Nuevo pedido",
    body: "¡Nuevo pedido recibido!",
    tag: "wp-pedido-nuevo",
    vibrate: [500, 200, 500, 200, 500, 200, 800],
    playBeep: true,
    action: "pedido_nuevo",
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      if (parsed && typeof parsed === "object") data = { ...data, ...parsed };
    }
  } catch (_) {
    try {
      const t = event.data && event.data.text && event.data.text();
      if (t) data.body = String(t);
    } catch (_) {}
  }

  const options = {
    body: data.body || "Tienes un nuevo pedido pendiente.",
    vibrate: data.vibrate || [500, 200, 500, 200, 500, 200, 800],
    tag: data.tag || "wp-pedido-nuevo",
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      url: "./",
      action: data.action || "pedido_nuevo",
      playBeep: data.playBeep !== false,
    },
  };

  event.waitUntil(
    (async () => {
      // 1) Si hay pestaña abierta → pedir pitido en la página (AudioContext)
      try {
        const all = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        for (const client of all) {
          try {
            client.postMessage({
              action: "play_audio_pedido",
              title: data.title,
              body: data.body,
            });
          } catch (_) {}
        }
      } catch (_) {}

      // 2) Notificación del sistema (funciona con pantalla apagada / app en segundo plano)
      try {
        await self.registration.showNotification(
          data.title || "WebPocket · Nuevo pedido",
          options,
        );
      } catch (e) {
        console.error("[sw] showNotification", e);
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "./";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        try {
          client.postMessage({ action: "play_audio_pedido" });
        } catch (_) {}
        try {
          if ("focus" in client) return client.focus();
        } catch (_) {}
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl + (targetUrl.includes("?") ? "&" : "?") + "pedido_nuevo=1");
      }
    })(),
  );
});

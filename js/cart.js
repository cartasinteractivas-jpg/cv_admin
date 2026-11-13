/* WebPocket admin — carrito / pedidos / avisos */
      // --- Aviso pedidos nuevos: pitido + notificación ---
      window._wpAvisarPedidos = window._wpAvisarPedidos || false;
      window._wpLastPedidoIds = window._wpLastPedidoIds || new Set();
      window._wpPedidoWatchTimer = window._wpPedidoWatchTimer || null;


      function playPedidoBeep() {
        try {
          // 1. Verificamos si hay un audio personalizado guardado
          let customAudio = null;
          try {
            let extra = {};
            if (state && state.account && state.account.client && state.account.client.estilo_marco) {
              extra = JSON.parse(state.account.client.estilo_marco);
            }
            customAudio = extra.sonido_alerta || null;
          } catch (_) {}

          // 2. Si existe, lo reproducimos
          if (customAudio) {
            const audio = new Audio(customAudio);
            audio.volume = 1.0;
            audio.play().catch(e => console.warn("Error reproduciendo audio custom", e));
            return;
          }

          // 3. Si no existe, usamos el pitido por defecto (Web Audio API)
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          if (!window._wpAudioCtx) window._wpAudioCtx = new Ctx();
          const ctx = window._wpAudioCtx;
          const run = () => {
            const beep = (freq, delayMs) => {
              setTimeout(() => {
                try {
                  const o = ctx.createOscillator();
                  const g = ctx.createGain();
                  o.type = "sine";
                  o.frequency.value = freq;
                  g.gain.value = 0.0001;
                  o.connect(g);
                  g.connect(ctx.destination);
                  const t0 = ctx.currentTime;
                  g.gain.exponentialRampToValueAtTime(0.28, t0 + 0.02);
                  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
                  o.start(t0);
                  o.stop(t0 + 0.36);
                } catch (_) {}
              }, delayMs);
            };
            beep(880, 0);
            beep(1175, 180);
            beep(988, 360);
          };
          if (ctx.state === "suspended") ctx.resume().then(run).catch(run);
          else run();
        } catch (e) {
          console.warn("beep", e);
        }
      }



      function notifyPedido(count, sampleName) {
        try {
          if (typeof Notification === "undefined") return;
          if (Notification.permission !== "granted") return;
          const n = new Notification("WebPocket · Nuevo pedido", {
            body:
              (count > 1 ? count + " pedidos nuevos" : "Tienes un pedido nuevo") +
              (sampleName ? " · " + sampleName : ""),
            tag: "wp-pedido-nuevo",
            renotify: true,
          });
          setTimeout(() => {
            try {
              n.close();
            } catch (_) {}
          }, 8000);
        } catch (_) {}
      }

      async function checkPedidosNuevos() {
        try {
          if (!window._wpAvisarPedidos) return;
          if (!state || !state.auth || !(state.auth.session || state.auth.token)) return;
          let r;
          try {
            r = await send({ action: "pedidos_list", solo_pendientes: true });
          } catch (e) {
            console.warn("pedidos_list", e);
            try {
              r = await send({ action: "pedidos_list" });
            } catch (e2) {
              console.warn("pedidos_list2", e2);
              return;
            }
          }
          const list = (r && (r.pedidos || r.list || r.data || r.items)) || [];
          const pending = (Array.isArray(list) ? list : []).filter((p) => {
            if (!p) return false;
            if (p.entregado === true || p.entregado === "true" || p.entregado === 1) return false;
            const st = String(p.estado || p.status || "pendiente").toLowerCase();
            if (["entregado", "vendido", "cancelado", "cancelada", "cerrado"].includes(st)) return false;
            return true;
          });
          const ids = pending
            .map((p) => String(p.id || p.pedido_id || p.uuid || ""))
            .filter(Boolean);
          if (!window._wpPedidoWatchReady) {
            window._wpPedidoWatchReady = true;
            window._wpLastPedidoIds = new Set(ids);
            window._wpLastPedidoCount = ids.length;
            console.log("[wp] watcher listo, pendientes:", ids.length);
            return;
          }
          const news = ids.filter((id) => !window._wpLastPedidoIds.has(id));
          ids.forEach((id) => window._wpLastPedidoIds.add(id));
          const prev = window._wpLastPedidoCount || 0;
          window._wpLastPedidoCount = ids.length;
          if (news.length || ids.length > prev) {
            console.log("[wp] pedido nuevo", news.length || "count+");
            try { if (navigator.vibrate) navigator.vibrate([200,100,200,100,300]); } catch(_){}
            try {
              if (window._wpAudioCtx && window._wpAudioCtx.state === "suspended")
                await window._wpAudioCtx.resume();
            } catch (_) {}
            playPedidoBeep();
            try { if (navigator.vibrate) navigator.vibrate([200,100,200,100,300]); } catch(_){}
            const sample =
              pending.find((p) => news.includes(String(p.id || p.pedido_id || ""))) ||
              pending[0];
            notifyPedido(
              Math.max(news.length, 1),
              sample && (sample.nombre_cliente || sample.cliente || sample.producto),
            );
            try {
              if (typeof appAlert === "function")
                void appAlert(
                  "Nuevo pedido" +
                    (news.length > 1 ? "s (" + news.length + ")" : "") +
                    ". Revisa Pedidos.",
                );
            } catch (_) {}
          }
        } catch (e) {
          console.warn("checkPedidosNuevos", e);
        }
      }

      function unlockPedidoAudio() {
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          if (!window._wpAudioCtx) window._wpAudioCtx = new Ctx();
          if (window._wpAudioCtx.state === "suspended") window._wpAudioCtx.resume();
        } catch (_) {}
      }
      if (!window._wpUnlockAudioBound) {
        window._wpUnlockAudioBound = true;
        document.addEventListener("click", unlockPedidoAudio, { passive: true });
        document.addEventListener("touchstart", unlockPedidoAudio, { passive: true });
      }

      
      async function registerPedidoPush(opts) {
        opts = opts || {};
        const interactive = !!opts.interactive;
        try {
          if (!("Notification" in window)) {
            console.warn("[wp] Notification no soportado");
            return null;
          }
          // Preferencia local (sobrevive cierre de sesión del panel)
          try {
            if (window._wpAvisarPedidos)
              localStorage.setItem("wp_avisar_pedidos", "1");
          } catch (_) {}

          let perm = Notification.permission;
          // Solo pedir permiso si el usuario acaba de activar el check
          if (perm === "default" && interactive) {
            perm = await Notification.requestPermission();
          }
          if (perm !== "granted") {
            if (interactive && typeof appAlert === "function") {
              void appAlert(
                perm === "denied"
                  ? "Las notificaciones están bloqueadas en el navegador. Actívalas en Ajustes del sitio y vuelve a entrar."
                  : "Para avisos con el móvil bloqueado, acepta el permiso de notificaciones.",
              );
            }
            console.warn("[wp] permiso notificaciones:", perm);
            // Igual activar watcher de primer plano
            return null;
          }

          if (!("serviceWorker" in navigator)) {
            console.warn("[wp] Sin serviceWorker");
            return null;
          }
          const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
          await navigator.serviceWorker.ready;

          if (!("PushManager" in window)) {
            console.warn("[wp] Sin PushManager");
            return reg;
          }

          let vapidKey = window._wpVapidPublic || "";
          try {
            const r = await send({ action: "push_vapid_public" });
            if (r && r.publicKey) {
              vapidKey = r.publicKey;
              window._wpVapidPublic = vapidKey;
            }
          } catch (e) {
            console.warn("[wp] vapid", e);
          }
          if (!vapidKey) {
            console.warn("[wp] Sin VAPID public key");
            return reg;
          }

          const urlBase64ToUint8Array = (base64String) => {
            const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
            const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
            const rawData = atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
            return outputArray;
          };

          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });
          }
          const json = sub.toJSON();
          // Re-guardar suscripción en Supabase (por si cerró sesión / cambió token)
          try {
            await send({
              action: "push_subscribe",
              endpoint: json.endpoint,
              keys: json.keys,
              user_agent: navigator.userAgent,
            });
            console.log("[wp] push resubscribed OK");
          } catch (e) {
            console.warn("[wp] push_subscribe", e);
          }
          return reg;
        } catch (e) {
          console.warn("[wp] push", e);
          return null;
        }
      }

      function startPedidoWatcher() {
        try {
          if (window._wpPedidoWatchTimer) clearInterval(window._wpPedidoWatchTimer);
        } catch (_) {}
        window._wpPedidoWatchTimer = setInterval(checkPedidosNuevos, 45000);
        setTimeout(checkPedidosNuevos, 1500);
        setTimeout(checkPedidosNuevos, 6000);
      }

      function bootPedidoAlerts() {
        try {
          syncAvisarFromAccount();
        } catch (_) {}
        // Solo si en BD/estilo el cliente activó avisos → al abrir sesión pedir permiso si hace falta
        setTimeout(async () => {
          try {
            if (!window._wpAvisarPedidos) return;
            startPedidoWatcher();
            const perm =
              typeof Notification !== "undefined" ? Notification.permission : "denied";
            // default = aún no decidió → pedir al entrar a la sesión
            // granted = re-suscribir en silencio
            // denied = no molestar (debe activarlo en el navegador)
            if (perm === "default") {
              await registerPedidoPush({ interactive: true });
            } else if (perm === "granted") {
              await registerPedidoPush({ interactive: false });
            }
          } catch (e) {
            console.warn("[wp] boot alerts", e);
          }
        }, 700);
      }
      function syncAvisarFromAccount() {
        try {
          let extra = {};
          const candidates = [
            state.account && state.account.client && state.account.client.estilo_marco,
            state.account && state.account.estilo_marco,
            state.client && state.client.estilo_marco,
            state.auth && state.auth.client && state.auth.client.estilo_marco,
          ];
          for (const raw0 of candidates) {
            const raw = String(raw0 || "");
            if (raw.startsWith("{")) {
              try {
                extra = Object.assign(extra, JSON.parse(raw));
              } catch (_) {}
            }
          }
          let on =
            extra.avisar_pedidos === true ||
            extra.avisar_pedidos === "true" ||
            extra.avisar_pedidos === 1 ||
            extra.avisar_pedidos === "1";
          // respaldo local si el check estaba activo en este navegador
          try {
            if (!on && localStorage.getItem("wp_avisar_pedidos") === "1") on = true;
            if (on) localStorage.setItem("wp_avisar_pedidos", "1");
            else localStorage.removeItem("wp_avisar_pedidos");
          } catch (_) {}
          window._wpAvisarPedidos = !!on;
          if (window._wpAvisarPedidos) {
            startPedidoWatcher();
            // Sin volver a pedir permiso: solo re-suscribe si ya estaba granted
            try {
              void registerPedidoPush({ interactive: false });
            } catch (_) {}
          }
        } catch (_) {}
      }

      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && window._wpAvisarPedidos) {
          void checkPedidosNuevos();
          try {
            void registerPedidoPush({ interactive: false });
          } catch (_) {}
        }
      });


      if (!window._wpAvisarChkBound) {
        window._wpAvisarChkBound = true;
        document.addEventListener(
          "change",
          async (ev) => {
            const el = ev.target;
            if (!el || el.name !== "avisarPedidos") return;
            if (el.checked) {
              try {
                window._wpAvisarPedidos = true;
                try {
                  localStorage.setItem("wp_avisar_pedidos", "1");
                } catch (_) {}
                window._wpPedidoWatchReady = false;
                window._wpLastPedidoIds = new Set();
                startPedidoWatcher();
                // Solo aquí se puede mostrar el diálogo del navegador (una vez)
                await registerPedidoPush({ interactive: true });
                if (Notification.permission === "granted") {
                  if (typeof appAlert === "function")
                    void appAlert(
                      "Avisos activos. Si ya habías permitido notificaciones, no te volverá a preguntar al cerrar sesión.",
                    );
                }
                try {
                  playPedidoBeep();
                } catch (_) {}
              } catch (_) {}
            } else {
              window._wpAvisarPedidos = false;
              try {
                localStorage.removeItem("wp_avisar_pedidos");
              } catch (_) {}
            }
          },
          true,
        );
      }

      if (!window._wpCartConfigSaveBound) {
        window._wpCartConfigSaveBound = true;
        document.addEventListener(
          "click",
          async (ev) => {
            const btn = ev.target && ev.target.closest && ev.target.closest("#btn-save-cart-config");
            if (!btn) return;
            ev.preventDefault();
            ev.stopPropagation();
            const form = document.getElementById("cart-config-form");
            if (!form) return;
            try {
              if (!state.auth || !(state.auth.session || state.auth.token)) {
                void (window.appAlert || appAlert)("Sesión no encontrada. Vuelve a ingresar.");
                return;
              }
              btn.disabled = true;
              btn.textContent = "Guardando…";
              let extra = {};
              try {
                const raw = String(
                  (state.account && state.account.client && state.account.client.estilo_marco) ||
                    (state.client && state.client.estilo_marco) ||
                    (state.account && state.account.estilo_marco) ||
                    "",
                );
                if (raw.startsWith("{")) extra = JSON.parse(raw);
              } catch (_) {
                extra = {};
              }

        // --- PEGA EL BLOQUE AQUÍ ---
            const soundFile = document.getElementById('custom-sound-file')?.files?.[0];
            if (soundFile) {
              const status = document.getElementById('custom-sound-status');
              if (status) status.textContent = "Subiendo sonido...";
              try {
                const reader = new FileReader();
                const dataUrl = await new Promise((resolve) => {
                  reader.onload = (e) => resolve(e.target.result);
                  reader.readAsDataURL(soundFile);
                });
                const res = await (typeof window.send === "function" ? window.send : send)({
                  action: "upload_sound",
                  fileName: soundFile.name,
                  fileData: dataUrl
                });
                if (res.ok && res.url) {
                  extra.sonido_alerta = res.url;
                  if (status) status.textContent = "✓ Sonido subido correctamente.";
                }
              } catch (e) {
                console.warn("Error subiendo sonido", e);
                if (status) status.textContent = "Error al subir sonido.";
              }
            }
            // --- FIN DEL BLOQUE ---

                  
              const cartFormatoEl = form.querySelector('[name="cartFormato"]');
              const mostrarStockEl = form.querySelector('[name="mostrarStock"]');
              const permitirTomarEl = form.querySelector('[name="permitirTomar"]');
              const cartFormato = String((cartFormatoEl && cartFormatoEl.value) || "carrito_lista");
              const mostrarStock = String((mostrarStockEl && mostrarStockEl.value) || "0") === "1";
              const permitirTomar = !!(permitirTomarEl && permitirTomarEl.checked);
              const avisarPedidosEl = form.querySelector('[name="avisarPedidos"]');
              const avisarPedidos = !!(avisarPedidosEl && avisarPedidosEl.checked);
              extra.cart_formato = cartFormato;
              const franjaEl = form.querySelector('[name="franjaModelo"]');
              if (franjaEl) extra.chat_franja_modelo = String(franjaEl.value || "carousel");
              extra.mostrar_stock = mostrarStock;
              extra.permitir_tomar = permitirTomar;
              extra.avisar_pedidos = avisarPedidos;
              try {
                if (avisarPedidos) localStorage.setItem("wp_avisar_pedidos", "1");
                else localStorage.removeItem("wp_avisar_pedidos");
              } catch (_) {}
              try {
                if (avisarPedidos && typeof Notification !== "undefined" && Notification.permission === "default") {
                  await Notification.requestPermission();
                }
                window._wpAvisarPedidos = avisarPedidos;
                if (avisarPedidos) {
                  try {
                    startPedidoWatcher();
                  } catch (_) {}
                }
              } catch (_) {}
              const marco = JSON.stringify(extra);
              try {
                if (state.account && state.account.client)
                  state.account.client.estilo_marco = marco;
                if (state.account) state.account.estilo_marco = marco;
                if (state.auth && state.auth.client)
                  state.auth.client.estilo_marco = marco;
              } catch (_) {}
              const codigo =
                state.auth.codigo_cliente ||
                (state.auth.client && state.auth.client.codigo_cliente) ||
                (state.account && state.account.client && state.account.client.codigo_cliente) ||
                (state.account && state.account.codigo_cliente) ||
                "";
              await (typeof window.send === "function" ? window.send : send)({
                action: "client_save",
                codigo_cliente: codigo,
                codigoCliente: codigo,
                profile: {
                  estilo_marco: marco,
                  estilo_tarjetas: cartFormato,
                },
                estilo_marco: marco,
              });
              if (state.account && state.account.client) state.account.client.estilo_marco = marco;
              if (state.account) state.account.estilo_marco = marco;
              if (state.client) state.client.estilo_marco = marco;
              state.cartSub = "config";
              state.accountTab = "carrito";
              void appAlert("Configuración del carrito guardada.");
            } catch (err) {
              console.error("cart-config", err);
              void appAlert((err && err.message) || String(err));
            } finally {
              btn.disabled = false;
              btn.textContent = "Guardar configuración";
            }
          },
          true,
        );
      }


// --- TRUCO PARA DESBLOQUEAR AUDIO EN MÓVILES ---
if (!window._wpMobileAudioUnlocked) {
  window._wpMobileAudioUnlocked = true;
  
  const unlockAudio = async () => {
    try {
      // 1. Desbloqueamos el AudioContext (para el pitido)
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx && !window._wpAudioCtx) {
        window._wpAudioCtx = new Ctx();
      }
      if (window._wpAudioCtx && window._wpAudioCtx.state === "suspended") {
        await window._wpAudioCtx.resume();
      }

      // 2. Desbloqueamos la etiqueta <audio> (para tu archivo mp3)
      const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
      silentAudio.volume = 0.01;
      await silentAudio.play().catch(() => {});
      
      // Si funcionó, quitamos los eventos para que no se repita
      document.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("click", unlockAudio);
      console.log("Audio desbloqueado en móvil");
    } catch (e) {
      console.warn("No se pudo desbloquear audio", e);
    }
  };

  // Escuchamos el primer toque o clic en la pantalla
  document.addEventListener("touchstart", unlockAudio, { passive: true });
  document.addEventListener("click", unlockAudio, { passive: true });
}

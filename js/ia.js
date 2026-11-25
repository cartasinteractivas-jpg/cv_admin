/* WebPocket admin — IA / avatar */
      if (!window._wpIaSubBound) {
        window._wpIaSubBound = true;
        document.addEventListener("click", (ev) => {
          const t = ev.target && ev.target.closest && ev.target.closest("[data-ia-sub]");
          if (t) {
            ev.preventDefault();
            ev.stopPropagation();
            const sub = t.getAttribute("data-ia-sub") || "info";
            state.iaSub = sub;
            try {
              document.querySelectorAll("#ia-form .ia-sub-btn").forEach((b) => {
                b.classList.toggle("active", b.getAttribute("data-ia-sub") === sub);
              });
              document.querySelectorAll("#ia-form [data-ia-panel]").forEach((p) => {
                p.style.display = p.getAttribute("data-ia-panel") === sub ? "block" : "none";
              });
            } catch (_) {
              try { render(); } catch (_) {}
            }
            return;
          }
          const dirBtn = ev.target && ev.target.closest && ev.target.closest("[data-ia-tabs-dir]");
          if (dirBtn) {
            const wrap = dirBtn.closest(".account-tabs-wrap");
            const sc = wrap && wrap.querySelector("#ia-subtabs");
            if (sc) sc.scrollBy({ left: Number(dirBtn.getAttribute("data-ia-tabs-dir")) * 120, behavior: "smooth" });
          }
          const clr = ev.target && ev.target.closest && ev.target.closest("#btn-clear-avatar");
          if (clr) {
            ev.preventDefault();
            void (async () => {
              if (!(await appConfirm("¿Borrar todas las fotos del avatar en el storage?"))) return;
              const st = document.getElementById("avatar-upload-status");
              try {
                clr.disabled = true;
                if (st) st.textContent = "Limpiando…";
                await send({ action: "avatar_clear" });
                if (st) st.textContent = "Avatar eliminado del storage";
                try {
                  state.account = await send({ action: "client_get" });
                  render();
                } catch (_) {}
                void appAlert("Avatares eliminados.");
              } catch (e) {
                void appAlert(e.message || String(e));
              }
              clr.disabled = false;
            })();
            return;
          }
          const up = ev.target && ev.target.closest && ev.target.closest("#btn-upload-avatar");
          if (up) {
            ev.preventDefault();
            void (async () => {
              const input = document.getElementById("avatar-files");
              const st = document.getElementById("avatar-upload-status");
              if (!input || !input.files || !input.files.length) {
                if (typeof appAlert === "function") void appAlert("Selecciona las fotos del avatar.");
                return;
              }
              const required = ["neutral.jpg","vocal_a.jpg","vocal_e.jpg","vocal_i.jpg","vocal_o.jpg","vocal_u.jpg","vocal2_a.jpg","vocal2_e.jpg","vocal2_i.jpg","vocal2_o.jpg","vocal2_u.jpg","respuesta_si.jpg","respuesta_no.jpg"];
              const byName = {};
              Array.from(input.files).forEach((f) => {
                byName[f.name] = f;
                byName[String(f.name || "").toLowerCase()] = f;
                const stem = String(f.name || "").replace(/\.[^.]+$/, "").toLowerCase();
                if (stem) byName[stem] = f;
              });
              const resolveFile = (n) => {
                if (byName[n]) return byName[n];
                const low = String(n).toLowerCase();
                if (byName[low]) return byName[low];
                const stem = low.replace(/\.[^.]+$/, "");
                return byName[stem] || null;
              };
              const missing = required.filter((n) => !resolveFile(n));
              if (missing.length) {
                if (typeof appAlert === "function")
                  void appAlert("Faltan archivos (" + missing.length + "): " + missing.slice(0,5).join(", ") + (missing.length>5?"…":""));
                if (st) st.textContent = "Faltan " + missing.length + " archivos con nombre exacto.";
                return;
              }
              const readExactFrame = (file) => new Promise((resolve, reject) => {
                const img = new Image(), url = URL.createObjectURL(file);
                img.onload = () => { URL.revokeObjectURL(url); if(img.naturalWidth!==720||img.naturalHeight!==1000) return reject(new Error(file.name+" debe medir 720 × 1000 px.")); const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result||"")); reader.onerror=reject; reader.readAsDataURL(file); };
                img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer "+file.name)); };
                img.src=url;
              });
              if (st) st.textContent = "Preparando los 13 fotogramas…";
              up.disabled = true;
              try {
                const codigo =
                  (state.auth && state.auth.codigo_cliente) ||
                  (state.account && state.account.client && state.account.client.codigo_cliente) ||
                  "";
                if (st) st.textContent = "Subiendo 0/" + required.length + "…";
                let done = 0;
                for (const name of required) {
                  const file = resolveFile(name);
                  if (!file) continue;
                  let dataUrl;
                  dataUrl = await readExactFrame(file);
                  // reintento simple si falla la red
                  let lastErr = null;
                  for (let attempt = 0; attempt < 2; attempt++) {
                    try {
                      await send({
                        action: "avatar_upload_frame",
                        filename: name,
                        dataUrl: dataUrl,
                        codigo_cliente: codigo,
                      });
                      lastErr = null;
                      break;
                    } catch (e) {
                      lastErr = e;
                      await new Promise((r) => setTimeout(r, 400));
                    }
                  }
                  if (lastErr) throw lastErr;
                  done++;
                  if (st) st.textContent = "Subiendo " + done + "/" + required.length + "…";
                }
                // Marcar listo en BD (avatar_ready + avatar_show)
                await send({ action: "avatar_mark_ready" });
                if (st) st.textContent = "✓ Avatar cargado (" + required.length + " fotos)";
                if (typeof appAlert === "function")
                  void appAlert("Avatar listo y activado. Recarga el perfil público para verlo.");
                try {
                  state.account = await send({ action: "client_get" });
                  try {
                    if (state.account && state.account.client)
                      state.iaSub = "config";
                  } catch (_) {}
                  render();
                } catch (_) {}
              } catch (e) {
                if (st) st.textContent = "Error: " + (e.message || e);
                if (typeof appAlert === "function") void appAlert(e.message || String(e));
              }
              up.disabled = false;
            })();
          }
        });
      }              const readExactFrame = (file) => new Promise((resolve, reject) => {
                const img = new Image(), url = URL.createObjectURL(file);
                img.onload = () => { URL.revokeObjectURL(url); if(img.naturalWidth!==720||img.naturalHeight!==1000) return reject(new Error(file.name+" debe medir 720 × 1000 px.")); const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result||"")); reader.onerror=reject; reader.readAsDataURL(file); };
                img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer "+file.name)); };
                img.src=url;
              });


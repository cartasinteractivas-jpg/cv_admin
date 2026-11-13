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
              const required = [
                "01_escucha_neutral.jpg",
                "02_parpadeo.jpg",
                "06_empatia.jpg",
                "07_pensando.jpg",
                "08_sorpresa.jpg",
                "09_hablando.jpg",
                "10_si1.jpg",
                "11_si2.jpg",
                "12_si3.jpg",
                "13_no1.jpg",
                "14_no2.jpg",
                "15_no3.jpg",
                "16_hablar1.jpg",
                "17_hablar2.jpg",
                "18_hablar_cuerpo_01.jpg",
                "19_hablar_cuerpo_02.jpg",
                "20_hablar_cuerpo_03.jpg",
                "21_hablar_cuerpo_04.jpg",
                "22_hablar_cuerpo_05.jpg",
                "23_hablar_cuerpo_06.jpg",
                "SI_entre_si1_si2_1.jpg",
                "SI_entre_si1_si2_2.jpg",
                "SI_baja_10_si1_a_11_si2_25.jpg",
                "SI_baja_10_si1_a_11_si2_50.jpg",
                "SI_baja_10_si1_a_11_si2_75.jpg",
                "SI_entre_si2_si3_1.jpg",
                "SI_entre_si2_si3_2.jpg",
                "SI_baja_11_si2_a_12_si3_25.jpg",
                "SI_baja_11_si2_a_12_si3_50.jpg",
                "SI_baja_11_si2_a_12_si3_75.jpg",
                "NO_entre_no1_no2_1.jpg",
                "NO_entre_no1_no2_2.jpg",
                "NO_baja_13_no1_a_14_no2_25.jpg",
                "NO_baja_13_no1_a_14_no2_50.jpg",
                "NO_baja_13_no1_a_14_no2_75.jpg",
                "NO_entre_no2_no3_1.jpg",
                "NO_entre_no2_no3_2.jpg",
                "NO_baja_14_no2_a_15_no3_25.jpg",
                "NO_baja_14_no2_a_15_no3_50.jpg",
                "NO_baja_14_no2_a_15_no3_75.jpg",
                "HABLAR_entre_hablar1_hablar2_1.jpg",
                "HABLAR_entre_hablar1_hablar2_2.jpg",
                "HABLAR_baja_16_hablar1_a_17_hablar2_25.jpg",
                "HABLAR_baja_16_hablar1_a_17_hablar2_50.jpg",
                "HABLAR_baja_16_hablar1_a_17_hablar2_75.jpg",
                "HABLAR_entre_hablar2_hablando_1.jpg",
                "HABLAR_entre_hablar2_hablando_2.jpg",
                "HABLAR_baja_17_hablar2_a_09_hablando_25.jpg",
                "HABLAR_baja_17_hablar2_a_09_hablando_50.jpg",
                "HABLAR_baja_17_hablar2_a_09_hablando_75.jpg"
              ];
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
              // Comprimir cada frame (evita error HTML por body demasiado grande)
              const compressFile = (file, maxW) =>
                new Promise((resolve, reject) => {
                  const img = new Image();
                  const url = URL.createObjectURL(file);
                  img.onload = () => {
                    try {
                      const scale = Math.min(1, (maxW || 480) / Math.max(img.width, img.height));
                      const w = Math.max(1, Math.round(img.width * scale));
                      const h = Math.max(1, Math.round(img.height * scale));
                      const canvas = document.createElement("canvas");
                      canvas.width = w;
                      canvas.height = h;
                      const ctx = canvas.getContext("2d");
                      ctx.drawImage(img, 0, 0, w, h);
                      URL.revokeObjectURL(url);
                      resolve(canvas.toDataURL("image/jpeg", 0.72));
                    } catch (e) {
                      URL.revokeObjectURL(url);
                      reject(e);
                    }
                  };
                  img.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error("No se pudo leer " + file.name));
                  };
                  img.src = url;
                });
              if (st) st.textContent = "Limpiando avatar anterior…";
              up.disabled = true;
              try {
                const codigo =
                  (state.auth && state.auth.codigo_cliente) ||
                  (state.account && state.account.client && state.account.client.codigo_cliente) ||
                  "";
                try {
                  await send({ action: "avatar_clear" });
                } catch (_) {}
                if (st) st.textContent = "Comprimiendo y subiendo 0/" + required.length + "…";
                let done = 0;
                for (const name of required) {
                  const file = resolveFile(name);
                  if (!file) continue;
                  let dataUrl;
                  try {
                    dataUrl = await compressFile(file, 480);
                  } catch (_) {
                    dataUrl = await new Promise((res, rej) => {
                      const r = new FileReader();
                      r.onload = () => res(r.result);
                      r.onerror = rej;
                      r.readAsDataURL(file);
                    });
                  }
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
      }

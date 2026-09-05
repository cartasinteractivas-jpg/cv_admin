# WebPocket · cv_admin

`cv_admin` es la aplicación administrativa y de registro de **WebPocket, la página web de bolsillo**. Su portada funciona como una demostración móvil inmersiva: un perfil por pantalla, foto o video de fondo, botones superpuestos y paneles que aparecen sin abandonar la pantalla principal.

## Funciones de esta versión

| Área | Implementación |
| --- | --- |
| Perfiles de muestra | Ocho perfiles con formato, color, menú, panel y comportamiento visual diferente. |
| Preguntas | Alejandro Salazar, Marco Huamán y Carlos Quispe muestran preguntas con respuestas configuradas. |
| Chat IA | El Dr. Mateo Valdivia usa un chat de orientación general con aviso médico y la llamada privada al servidor. |
| Negocios | Dulce Antojo, Forno Notte, Torque Andino y Tinta Urbana muestran carritos con cantidades y apertura de WhatsApp con el pedido armado. |
| Torque Andino | Incluye galería de enlaces de YouTube y acceso de ejemplo a página web. |
| Registro | Solo CV personal o Negocio. No solicita foto, video ni CV al inicio. |
| Activación | El registro queda con `clientes.activo = false`; el administrador revisa manualmente el comprobante, puede previsualizarlo, descargarlo o retirar su referencia, y luego habilita el perfil con el interruptor. No existe enlace externo de aprobación automática. |
| Medios | Foto y producto hasta 15 MB. Video hasta 15 MB y 40 segundos. El cliente puede guardar ambos y escoger uno como fondo principal. |
| QR | El QR lleva a `cv_start/?perfil=CODIGO`. El cliente puede descargarlo, copiar el enlace directo o compartirlo desde su sesión. Antes de activarse, la vista pública informa que el pago sigue en revisión. |

## Desarrollo y comprobación

Después de descomprimir, ejecuta `pnpm install` y luego `pnpm dev`. Antes de publicar, usa `pnpm test`, `pnpm check` y `pnpm build`.

## Supabase y OpenRouter

Las operaciones de registro, comprobante, QR, cargas y consulta pública se realizan desde el servidor de `cv_admin`. Las claves se conservan solo en secretos del servidor. No subas archivos `.env`, claves de Supabase, tokens de OpenRouter ni otros secretos al repositorio.

Esta entrega **no añade políticas RLS**, respetando la indicación actual. Antes de operar con datos reales en producción, configura las protecciones de acceso que correspondan a tu negocio.

## GitHub Pages y cv_start

GitHub Pages puede alojar la demostración visual y la aplicación pública estática `cv_start`, pero no ejecuta Express, el registro, Storage, Supabase ni el chat IA. Para que esas funciones operen de forma real, publica este proyecto full-stack en un servicio con servidor o en el hosting integrado de Manus y coloca su URL en `cv_start/config.js`.

Los ocho videos de muestra se llaman `video_cvoficina.mp4`, `video_cvlimpieza.mp4`, `video_cvdoctor.mp4`, `video_cvcontruccion.mp4`, `video_negocio1.mp4`, `video_negocio2.mp4`, `video_negocio3.mp4` y `video_negocio4.mp4`. En los paquetes para GitHub Pages deben permanecer junto a `index.html`.

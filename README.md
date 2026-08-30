# WebPocket · CV Admin

Esta versión funcional presenta la experiencia de `cv_admin`: ocho perfiles de demostración con video de fondo, explorador de veinte formatos, formularios de registro, acceso de cliente y administrador, validación local de medios y una vista de QR para la futura aplicación `cv_start`. La portada abre directamente, sin pantalla de introducción.

## Ejecutar el proyecto

Después de descomprimir los archivos, instala las dependencias con `pnpm install`. Para iniciar el proyecto en desarrollo utiliza `pnpm dev`. Puedes comprobarlo antes de publicar con `pnpm test`, `pnpm check` y `pnpm build`.

## Subir a GitHub

Dentro de la carpeta del proyecto, inicializa Git si es necesario, agrega los archivos y publícalos en el repositorio `cv_admin`. No subas archivos `.env`, claves de Supabase ni la clave de OpenRouter. Para GitHub Pages, coloca los ocho videos MP4 en la misma carpeta donde quede `index.html`: `video_cvoficina.mp4`, `video_cvlimpieza.mp4`, `video_cvdoctor.mp4`, `video_cvcontruccion.mp4`, `video_negocio1.mp4`, `video_negocio2.mp4`, `video_negocio3.mp4` y `video_negocio4.mp4`. La aplicación los referencia con rutas relativas.

## Estado de Supabase

La aplicación puede consultar los formatos guardados en la tabla `formatos` mediante una capa de servidor. Esta entrega no implementa políticas RLS ni autenticación de Supabase; antes de usar información real de clientes en producción, deberás configurar esas protecciones según tus reglas de negocio.

## Reglas de archivos

Las fotos están limitadas a 1 MB. El video original de un cliente tiene un límite de 100 MB para revisión. El video final aprobado debe pesar como máximo 20 MB y tener una duración objetivo de 6 a 8 segundos.

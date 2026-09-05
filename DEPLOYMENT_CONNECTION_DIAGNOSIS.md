# Diagnóstico de conexión de GitHub Pages

Fecha de comprobación: 4 de septiembre de 2026.

## Hallazgos

| Publicación | Resultado observado | Causa identificada |
|---|---|---|
| `https://cartasinteractivas-jpg.github.io/cv_admin/` | Los indicadores muestran BD e IA sin conexión. | La compilación estática intenta usar rutas relativas de API. En GitHub Pages no existe el servidor Express/tRPC que gestiona Supabase y OpenRouter. |
| `https://cartasinteractivas-jpg.github.io/cv_start/` | Los indicadores pueden mostrar conexión, pero el chat no responde de forma fiable. | `config.js` apunta a una URL temporal de vista de desarrollo de `cv_admin`, no a un backend publicado permanente. |

## Requisito de publicación

GitHub Pages sirve únicamente archivos estáticos. Para registro, ingreso, Supabase con operaciones protegidas y OpenRouter, ambas aplicaciones necesitan una URL HTTPS estable del backend de `cv_admin` publicado. Esa URL se debe colocar en el archivo público `cv_start/config.js` y en la configuración de compilación de `cv_admin`; no se deben colocar claves de Supabase ni de OpenRouter en GitHub.

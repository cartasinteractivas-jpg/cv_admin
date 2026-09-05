# WebPocket integrado: archivos y publicación

La web usa una sola página `index.html`, complementada por `webpocket-extra.js`. Sube ambos archivos, los cuatro JPG y los ocho MP4 que ya descargaste a la raíz de **un solo repositorio de GitHub Pages**.

| Archivo de GitHub | Uso |
|---|---|
| `index.html` | Página principal: perfiles, formatos, registro e ingreso. |
| `webpocket-extra.js` | Registro mínimo, sesión de cliente, panel de administración y servicios adicionales. |
| `webpocket-picarones.jpg`, `webpocket-pizza.jpg`, `webpocket-mecanica.jpg`, `webpocket-polos.jpg` | Imágenes de los carritos de ejemplo. |
| `.nojekyll` | Evita procesamiento adicional de GitHub Pages. |

Los videos deben conservar exactamente estos nombres en la misma raíz de `index.html`:

```text
video_cvoficina.mp4
video_cvlimpieza.mp4
video_cvdoctor.mp4
video_cvcontruccion.mp4
video_negocio1.mp4
video_negocio2.mp4
video_negocio3.mp4
video_negocio4.mp4
```

No debes pegar ninguna clave de Supabase en `index.html`. La página habla solo con la función Edge y esa función usa las credenciales privadas de Supabase en el servidor. No pongas una clave `service_role`, `OPENROUTER_API_KEY`, `WEBPOCKET_SESSION_SECRET` ni otra credencial en GitHub.

## Función Edge para IA, registro y administración

En el panel de Supabase abre **Edge Functions**, crea una función con el nombre exacto **`webpocket-api`**, desactiva la opción de exigir JWT para esta función pública y pega dentro el archivo `supabase/functions/webpocket-api/index.ts`. La función implementa su propia sesión firmada para cliente y administrador. El nombre debe ser exactamente igual porque el HTML llama a:

```text
https://rrubzwdrsuyjntoejmew.supabase.co/functions/v1/webpocket-api
```

En los secretos de esta función crea los dos valores siguientes. No los pongas en el HTML.

| Secreto | Valor |
|---|---|
| `OPENROUTER_API_KEY` | Tu clave privada de OpenRouter. Permite el chat IA del Dr. Mateo y de clientes con IA aprobada. |
| `WEBPOCKET_SESSION_SECRET` | Un texto aleatorio largo, por ejemplo una frase de más de 40 caracteres. Firma las sesiones de cliente y administración. |

Supabase ofrece `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` al entorno de la función. La función los usa solo en el servidor para registrar pagos, comprobantes, archivos, perfiles y cambios administrativos.

> El registro inicial solo solicita usuario, clave, tipo CV/Negocio, periodo, formato, colores y comprobante. El cliente completa los datos personales o del negocio al ingresar. La función no permite registro sin comprobante, no activa el perfil automáticamente y guarda el estado pendiente para revisión del administrador.

> En esta versión no se añaden policies/RLS porque lo pediste así. Todas las lecturas públicas, registro, sesiones, carga de comprobantes, administración y OpenRouter se concentran en la función Edge. Por eso el HTML puede estar en GitHub Pages sin exponer ninguna clave.

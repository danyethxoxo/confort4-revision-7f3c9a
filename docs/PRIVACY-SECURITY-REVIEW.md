# Revisión de privacidad y seguridad de Confort4

Fecha: 19 de noviembre de 2026. Alcance: sitio público y editor Confort4, sus formularios y los recursos `confort4` del proyecto compartido de Supabase. Revisión técnica y contraste con la LFPDPPP vigente; no constituye una certificación legal ni una auditoría integral de KWEB/KW Premier.

## Evidencia observada

- Navegación limpia por inicio, contacto, reseñas, recursos, equipo, privacidad y admin: cero cookies y cero errores JavaScript. Las solicitudes se limitaron a GitHub Pages y Supabase; no se cargaron Analytics, Meta Pixel ni widgets de redes sociales. Los iconos son enlaces y SVG locales.
- El navegador conserva favoritos y checklists en localStorage; también puede conservar cachés de información pública. El editor usa sessionStorage para su sesión y localStorage para la vista previa. No guarda contraseñas. El almacenamiento no tiene vencimiento automático.
- Las doce tablas del esquema `confort4` tienen RLS y niegan lectura/escritura directa a `anon` y `authenticated`; tampoco tienen acceso al esquema. Sus RPC públicas solo permiten ejecución con `service_role`. La ausencia de políticas permisivas en esas tablas es intencional, no una exposición.
- Las acciones privadas probadas con credenciales públicas devolvieron 401. Las llamadas directas anónimas a RPC privadas fueron denegadas. El feed público no devuelve el borrador ni correos/teléfonos de reseñantes. No se enviaron formularios ni correos reales durante estas pruebas.
- La función de moderación y el feed exigen autorización de publicación separada. No se observaron reseñas aprobadas sin esa autorización. Las fotos están en buckets públicos con escritura restringida al servidor: ocultarlas en un módulo no las vuelve privadas.
- El servidor verifica identidad y membresía antes de las acciones privadas. Hay límites de solicitudes e intentos de acceso, validación de entradas, tamaño máximo y escape de contenido. Estas medidas reducen riesgos, no garantizan invulnerabilidad.

## Correcciones realizadas

1. El código anterior calculaba una versión del aviso, pero no la enviaba a la función SQL: los dos registros existentes no conservan esa evidencia. Los nuevos envíos incluyen `payload.privacy` con versión, autorización y página de origen; `created_at` aporta la fecha. El servidor rechaza versiones desactualizadas. La autorización de publicación se mantiene separada. No se inventó evidencia para registros antiguos.
2. Aviso simplificado en formularios, responsable/domicilio/finalidad/contacto y enlace al aviso integral. Casillas sin marcar por defecto; publicar una reseña es opcional.
3. Aviso integral corregido: ya no afirma que exista comparación de propiedades, describe checklists/cachés/sesión, incluye imágenes y testimonios, proveedores y enlace relacionado a KW Premier.
4. Botón para borrar solo preferencias de visitantes de Confort4; conserva sesión, borrador y claves de otros sitios. No borra solicitudes del servidor.
5. Los checklists ya no escriben datos al abrir la página: solo al marcar una opción.
6. Política CSP para páginas públicas y editor: scripts propios, conexiones limitadas al backend, objetos y envío HTML nativo bloqueados. Política de referencia para limitar lo enviado a enlaces externos. CSP por meta no sustituye cabeceras como `frame-ancestors`.

## Pendientes que requieren operación o decisión del responsable

- Confirmar y conservar autorización documentada para fotos/testimonios y la reproducción de reseñas incorporadas manualmente. Un registro importado o una foto subida no demuestra por sí mismo ese permiso. El editor verifica comentarios declarados como reales, pero eso no prueba autorización de imagen.
- Definir un plazo y procedimiento de conservación/bloqueo/borrado, incluidos buzón, Resend, imágenes y respaldos. No existe una tarea automática de eliminación de contactos. No se borraron registros reales ni se inventó un plazo obligatorio.
- Atender solicitudes ARCO y revocaciones desde el correo publicado; verificar que se supervise. Las reseñas se pueden retirar desde moderación; la eliminación y los datos históricos requieren un procedimiento operativo completo.
- Revisar los cuatro accesos autorizados y retirar cuentas que ya no sean necesarias. No se modificaron membresías ni contraseñas, ni se reintrodujo MFA/QR.
- Supabase reporta desactivada la protección contra contraseñas filtradas. Revisar su activación y disponibilidad en el plan; es configuración de Auth compartida con KW Premier. [Guía oficial](https://supabase.com/docs/guides/auth/password-security).
- Mantener acuerdos con proveedores, controles de acceso y un procedimiento de incidentes. La documentación técnica no verifica contratos ni autorizaciones fuera del sistema.
- Un dominio propio aislado facilitaría cabeceras de seguridad y separación del origen compartido `danyethxoxo.github.io`. Las claves de almacenamiento están prefijadas, pero el aislamiento real depende del origen, no de la carpeta del repositorio.
- El asesor de seguridad detectó avisos adicionales en objetos de KW/KWEB fuera de `confort4`. No se modificaron sin revisar sus dependencias. La vista señalada niega acceso anónimo y tiene un control de rol interno; sigue pendiente su auditoría específica.

## Fuentes y límites

- [LFPDPPP vigente, Cámara de Diputados](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf): responsable, finalidades, aviso, derechos y seguridad. Los plazos ARCO del aviso se contrastaron con el texto vigente.
- [Aviso proporcionado de KW Premier](https://kwpremiermx.kw.com/es-es/aviso-de-privacidad): devolvió HTTP 403/protección automática al intentar leerlo. Se añadió como enlace relacionado, sin copiar contenido ni afirmar equivalencia de responsables.
- [Privacidad de GitHub](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement), [Supabase](https://supabase.com/privacy) y [Resend](https://resend.com/legal/privacy-policy).
- [Aviso de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security) y [RLS sin políticas permisivas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

Las pruebas no cubren explotación exhaustiva, obligaciones inmobiliarias posteriores al primer contacto ni tratamientos realizados fuera de este sitio. Si se añaden analítica, publicidad, mapas o vídeos incrustados, debe repetirse la inspección de cookies y adaptar información/controles antes de activarlos.

# Clientes, catálogo e historial

La actualización del 16 de noviembre conserva la dirección Nivara aprobada: fotografía editorial, blanco, negro y rojo KW, tipografía existente y controles cuadrados. Las referencias concretas son los carruseles de propiedades y reseñas del propio sitio. No cambia el sistema visual.

## Fotografías y textos

Fuente: `I:/Imágenes/confort 4`, seis archivos WhatsApp del 15 de noviembre, compartidos por el propietario. Cuatro fotografías con clientes se muestran en **Nuestros Clientes**, inmediatamente después de las reseñas del inicio. Las dos del equipo se usan como portada y nuevo momento en Quiénes somos. Copias WebP, orientación corregida, hasta 1100 × 1400, sin ampliar los originales. Los originales permanecen intactos.

Los pies de foto son textos editoriales de Confort4, no citas atribuidas a clientes. Un comentario real puede usar `quote`, `quoteVerified: true` y opcionalmente `name`. No publicar comentarios inventados como testimonios. Los textos se escapan y las URLs se validan.

## Historial

`content.transactions.items` conserva operaciones independientes del inventario activo. Campos: `title`, `photo`, `status` (`vendida` o `rentada`), `published` y, opcionalmente, `location`, `description`, `date` (AAAA-MM-DD real). Solo se muestran operaciones completas y publicadas. No enlazan a una oferta activa ni muestran disponibilidad actual. No hay operaciones inventadas: el módulo permanece oculto mientras no se reciban fotos y datos reales. Al cargarse, aparece al final de Inicio y Mis propiedades, antes del footer.

## Catálogo

Se reconocen los registros de asesor de Alberto y Renata verificados en el origen, con el ID KW de Alberto como respaldo para anuncios sincronizados sin `asesor_id`. No se infiere pertenencia por el nombre visible. Todas sus propiedades `publicada` se devuelven sin límite de 40. No hay propiedades atribuidas al registro de Renata actualmente, y su registro no tiene ID KW: cualquier futura sincronización debe conservar su `asesor_id` o incorporar su ID KW confirmado.

Se permiten diez selecciones externas. El límite se comprueba en base de datos, con bloqueo breve de la configuración para serializar selecciones concurrentes. La consulta pública también aplica el límite. Las propias no consumen cupos; las selecciones externas inactivas no se publican y conservan su cupo hasta retirarlas. La búsqueda administrativa conserva lotes de 40; su interfaz se revisará en la siguiente fase del panel.

Mis propiedades incluye los dos enlaces completos de KW suministrados por el propietario, con el viewport original, para venta y renta. Abren una pestaña nueva.

## Movimiento y validación

Carruseles de desplazamiento horizontal nativo, scroll snap, flechas y teclado. El scroll vertical permanece libre; no hay autoplay ni temporizadores nuevos. Las fotos se cargan bajo demanda, se decodifican antes de la aparición de abajo hacia arriba y conservan su estado entre actualizaciones del feed. Con movimiento reducido no se animan. Las galerías sin cambios conservan su nodo y su posición; la inicialización no duplica eventos.

Pruebas automatizadas de contenido, estados de operaciones, catálogo de 65 propiedades, controles y movimiento reducido. SQL aislado con rollback comprueba más de 40 propias, Renata, diez externas, rechazo de la undécima, repetición e inactivas. Navegador: escritorio y móvil, fotos reales, controles, scroll vertical, movimiento reducido y ausencia de desbordamiento horizontal. Las operaciones de prueba solo viven en fixtures y nunca se publican.

El mismo carrusel de clientes aparece bajo las reseñas de Dejame una reseña. Su actualización no reemplaza el formulario ni borra lo que la persona haya escrito. Las copias del bucle son inertes y se ocultan a lectores de pantalla.

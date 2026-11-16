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

Carruseles de desplazamiento horizontal nativo, scroll snap, flechas y teclado. El scroll vertical permanece libre; Nuestros Clientes se desplaza de forma continua a 35 px/s en bucle, con pausa manual y pausa al interactuar, salir de pantalla o cambiar de pestaña; el historial mantiene controles manuales. Las fotos se cargan bajo demanda, se decodifican antes de la aparición de abajo hacia arriba y conservan su estado entre actualizaciones del feed. Con movimiento reducido no se animan. Las galerías sin cambios conservan su nodo y su posición; la inicialización no duplica eventos.

Pruebas automatizadas de contenido, estados de operaciones, catálogo de 65 propiedades, controles y movimiento reducido. SQL aislado con rollback comprueba más de 40 propias, Renata, diez externas, rechazo de la undécima, repetición e inactivas. Navegador: escritorio y móvil, fotos reales, controles, scroll vertical, movimiento reducido y ausencia de desbordamiento horizontal. Las operaciones de prueba solo viven en fixtures y nunca se publican.

El mismo carrusel de clientes aparece bajo las reseñas de Dejame una reseña. Su actualización no reemplaza el formulario ni borra lo que la persona haya escrito. Las copias del bucle son inertes y se ocultan a lectores de pantalla.

## Regla de cierre confirmada por el propietario

Una propiedad propia que estaba publicada y pasa a inactiva o se elimina se archiva como vendida o rentada según su operación. Es la regla comercial indicada por el propietario, no una confirmación independiente de cierre de KW. El registro conserva título, zona y foto; no inventa fecha de cierre. El PH Dúplex de Polanco fue confirmado expresamente para iniciar el historial como VENDIDA.

Las cancelaciones se excluyen mediante Propiedades > Historial de operaciones > Marcar cancelada y ocultar. La acción requiere administrador, es reversible y queda auditada. Una reactivación oculta la propiedad del historial; una nueva baja activa inicia una nueva clasificación. Las selecciones externas de KW no se atribuyen al historial del equipo.

El historial automático vive en una tabla privada con RLS y se combina con contenido manual al leer el feed. No sobrescribe borradores. El HTML de respaldo espera la respuesta actual del feed antes de mostrar operaciones, para no exhibir una operación cancelada guardada en una exportación anterior. La captura automática guarda la URL de la foto; para el PH se conserva también una copia WebP local. El panel no altera los anuncios originales de KW.

## Presentación del historial y precio publicado

En Mis propiedades el orden es catálogo activo, vendidas/rentadas y formulario. El historial utiliza el mismo movimiento continuo de clientes, también con una sola propiedad: las copias inertes rellenan la franja según el ancho de pantalla. Las imágenes usan saturación 0.7; las de clientes y las propiedades activas conservan sus colores.

Cada cierre archiva el precio y la moneda del último registro activo, antes del cambio de estado. Los cambios posteriores en el anuncio inactivo no modifican ese importe. La ficha lo identifica como Precio de publicación; no se afirma que sea el precio de cierre. El PH de Polanco recupera 1,450,000 USD de la exportación activa anterior. Sin precio o moneda válidos se omite el importe.

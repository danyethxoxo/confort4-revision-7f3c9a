# Galerías completas de propiedades extra

El inventario resumido de KW puede tener una sola Photo_URL mientras el detalle
contiene Property_Photos. La selección extra de Casa en Benito Juárez (fuente
538580) tenía una imagen resumida; el detalle verificado contiene 38 fotos.
Se han recuperado y están disponibles en el feed público de Confort4.

Al seleccionar una propiedad se recupera la galería completa antes de incluirla.
La búsqueda por enlace también la recupera para la vista previa. En los resultados
de búsqueda y el catálogo del panel, «Fotos de la propiedad» permite desplegar
la galería y cargar/actualizar todas las fotos bajo demanda. Las búsquedas de
40 resultados no generan 40 consultas de detalle automáticamente.

La caché vive en confort4.property_media, privada con RLS y sin permisos de
lectura/ejecución directos para anon/authenticated. Se valida la membresía en RPC
y la identidad de Auth en Edge. Solo el servidor consulta la ruta fija de KW
con el identificador numérico del registro; no recibe destinos arbitrarios.
Solo almacena URLs públicas de fotografías, no datos de agentes/comisiones.
El catálogo y selector combinan esa caché con las propiedades sin alterar los
registros del inventario compartido de KW Premier ni los contactos de Confort4.

Se reutiliza la galería hasta seis horas si el registro no ha cambiado; el botón
de actualización fuerza una consulta. Un detalle de inventario más reciente con
galería completa tiene prioridad. Ante caída de KW se puede conservar una
galería completa previa; una primera carga fallida no agrega una selección con
una sola portada como si fuera completa. Las URLs se ordenan y deduplican.

## Movimiento y gestos

Las capas de fotos están aisladas y el degradado tiene un nivel explícito por
encima de las fotos, incluso cuando sus transformaciones crean contextos nuevos.
Solo existe una transición activa; se bloquean cambios concurrentes y se limpian
clones/animaciones al cancelar, pausar o destruir el carrusel. La actualización
del feed conserva una galería igual y su temporizador. Al abrir desde una tarjeta
se conserva una instantánea pública local para no mostrar brevemente «fuera del
catálogo» en propiedades extra sin archivo estático propio.

La ficha admite gesto horizontal, las reseñas tienen reconocimiento de eje y
los carruseles continuos de clientes/historial conservan desplazamiento nativo.
El autoplay cede el control al dedo y a su inercia, retomando tras 1.8 segundos
de inactividad (salvo pausa o foco de teclado). Las miniaturas también admiten
desplazamiento nativo. Un gesto vertical no cambia de foto ni abre el visor.

Validado con 38 fotografías, gestos CDP táctiles en Chrome móvil, cambios rápidos,
una sola capa saliente y comparación de píxeles con una imagen uniforme: brillo
106/106/106 antes, durante y después de la transición. Se ejecutan pruebas de
orden/deduplicación de fotos, caché, validación de URLs, permisos y gestos de eje.

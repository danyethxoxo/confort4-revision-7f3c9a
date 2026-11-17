# Editor por módulos

Las fotos se cargan desde el dispositivo, con recorte y ajuste. No se muestran
campos de URL ni texto alternativo técnico. El texto visible que acompaña a una
foto sigue siendo editable. El texto alternativo existente se conserva y las
fotos nuevas tienen una descripción accesible de respaldo. Clientes admite 20
fotos tanto en el panel como en la validación del servidor. Las dos galerías del
equipo conservan sus límites de 8 y 2.

Vender, Rentar y Comprar siguen el orden público: portada, públicos de renta,
comparativa, estrategia y tres fases, desplegables, FAQ y Mi proyecto. Cada
servicio tiene contenido propio y visibilidad por módulo. Los públicos de renta
admiten título, texto, puntos, botón y destino independientes. Las preguntas
pueden ocultarse sin borrarlas. No hay checklists en los servicios ni artículos.

Los valores nuevos se inicializan desde el contenido actual mediante
`editorialContent`, sin sobrescribir portadas publicadas ni borradores. Los
cambios editoriales necesitan Guardar borrador/Publicar como antes.

## Propiedades

Mis propiedades distingue catálogo propio automático (sin límite) y hasta 10
selecciones extra. Agregar más propiedades permite buscar por texto o pegar un
enlace `kw.com` o subdominio de KW. El servidor valida el host y el identificador,
sin hacer peticiones al enlace recibido; busca su Property_Command_ID en el
inventario conectado. No importa automáticamente propiedades desconocidas ni
inactivas. Primero presenta la coincidencia; el usuario decide incluirla.
Las extras usan las fichas y contacto de Confort4 sin alterar su propiedad en KW.
La restricción de diez sigue protegida en base de datos ante concurrencia.

El RPC del selector solo es ejecutable por service_role; Edge vincula la acción
al usuario validado por Auth y comprueba membresía. La selección final requiere
admin. Las selecciones inactivas se muestran en el panel para poder retirarlas
y liberar espacio. Mi historial conserva sus controles de estado y visibilidad.

Las selecciones, el historial y la moderación de reseñas recibidas se aplican
inmediatamente. No dependen del borrador editorial.

## Reseñas y blog

El editor de reseñas permite cambiar encabezados y etiquetas del formulario;
los campos, requisitos y consentimientos no se pueden desactivar. Las reseñas
manuales de Google tienen visibilidad editorial; las recibidas tienen moderación
inmediata y no se pueden publicar sin consentimiento.

Los artículos nuevos se insertan al principio y se abren para editar. Se ordenan
con flechas y se ocultan individualmente. El prefijo de la URL es la dirección
actual del sitio más `articulo.html?slug=`: funciona también para artículos que
no estaban presentes al construir los archivos estáticos. No se da por conectado
un dominio personalizado. La pantalla del blog tiene título y presentación
editables. Se han retirado el resumen «En pocas palabras» y los checklists.

El diseño público de Quiénes somos queda pendiente de la revisión solicitada;
esta entrega solo simplifica sus controles de fotografía.

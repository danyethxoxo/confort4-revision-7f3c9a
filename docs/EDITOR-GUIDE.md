# Editor de Confort4

Acceso: https://danyethxoxo.github.io/confort4-revision-7f3c9a/admin.html

Usa el nombre de usuario y contraseña de una cuenta autorizada del editor de Confort4. No hay autorregistro ni contraseña compartida incrustada en la página. Dani y Alberto conservan su membresía. Renata necesita una cuenta y confirmación del correo antes de habilitar acceso. No se enviaron invitaciones ni se cambiaron contraseñas.

## Acceso y seguridad

El editor acepta nombre de usuario y contraseña, sin QR ni código adicional, por indicación del propietario. La API valida cada sesión con Supabase Auth y comprueba la membresía privada para cada operación. No confía en roles enviados por el navegador ni en metadatos editables del usuario.

Los límites persistentes son 180 solicitudes/minuto por IP de proxy, 20 intentos de acceso/15 minutos por IP, 10/15 minutos por cuenta, 60 operaciones/minuto por usuario y 10 subidas/minuto por usuario. Los límites de IP complementan los controles nativos de Supabase Auth; los de cuenta y usuario no dependen de que el navegador respete un contador. La tabla almacena hashes con sal del servidor y elimina ventanas vencidas. Una respuesta 429 indica que debe esperar. No se cambió la política global de Auth compartida con KW.

La sesión queda en sessionStorage de la pestaña, se renueva mediante Auth y se cierra tras 20 minutos sin interacción. Cerrar sesión elimina la vista previa local. El panel tiene CSP, noindex, política de referente, bloqueo de objetos y bloqueo de acceso embebido. No procesa HTML o scripts como contenido: escapa textos, valida destinos HTTPS/internos, rechaza claves de prototipo y usa llamadas RPC tipadas. Las imágenes admiten JPG, PNG y WebP con firma comprobada, máximo 3 MB y nombre aleatorio; no SVG ni documentos. Estas medidas reducen riesgos, no son una garantía de invulnerabilidad ni sustituyen una auditoría externa.

## Flujo de edición

1. Seleccionar la página en la barra lateral.
2. Abrir el módulo y cambiar textos, imágenes o botones. Cada selector de imagen permite pegar una URL o subir un archivo.
3. Guardar borrador. No modifica la página pública.
4. Abrir Vista previa: usa el borrador local, sin envíos de formularios.
5. Publicar: valida de nuevo, conserva la publicación anterior y comprueba la revisión para no sobrescribir cambios concurrentes.

Versiones permite recuperar una publicación primero como borrador. Solo un administrador publica, modera, gestiona selecciones o cambia cancelaciones. El límite de fotos se comprueba tanto en el panel como en el servidor.

## Primera etapa disponible

- **Pantalla principal:** portada, frase, descripción, imagen y botón con destino; presentación del equipo; widgets independientes de propiedades y reseñas; clientes con fotos, descripciones y visibilidad; proceso con etapas e imágenes; cifras manuales o automáticas; composición de siete fotografías; preguntas y respuestas; historial con título, descripción y visibilidad. Cada módulo posterior a la portada se puede ordenar u ocultar sin borrar sus datos. El historial además tiene un interruptor global que afecta Propiedades.
- **Quiénes somos:** presentación e historia, portada, perfiles, fotografías, biografías y botones de contacto, enfoque, fotografías secundarias, Galería de fotos 1 (máximo ocho fotos), Galería de fotos 2 (máximo dos fotos) y visibilidad de esas secciones.
- **Me interesa → Vender/Rentar/Comprar:** editores separados con los textos y secciones existentes, fotografías y destinos de los botones principales y finales.
- **Propiedades, Reseñas y Blog:** mantienen selección, moderación, historial y edición existentes; la siguiente fase pulirá Propiedades y Blog.

Las cifras pueden usar un valor manual o actualizarse desde propiedades, equipo, servicios y zonas. Los widgets reflejan el catálogo y las reseñas aprobadas, no duplican sus registros en el contenido de Inicio. Los comentarios de clientes se editan como textos editoriales; las citas atribuidas siguen requiriendo verificación.

La exportación estática conserva la base anterior; el modelo incorpora valores por defecto sin alterar el documento publicado. Al guardar desde el nuevo panel se conserva la estructura explícita de módulos. No se reemplazó el borrador actual ni se publicó contenido de prueba.

## Verificación

Pruebas de API: identidad, membresía, acceso con contraseña, límites 429, conflicto de revisión, asignación de actor y subidas inválidas. SQL aislado con rollback: límites atómicos y separación de cuentas/acciones. Pruebas de contenido: módulos independientes, orden, ocultar/mostrar, botones, imágenes, cifras, FAQ, perfiles y límites 8/2. Navegador de escritorio y móvil con Auth simulado: edición, ocho imágenes, guardado, conservación de campos y vista previa. El acceso con y sin factores configurados se valida sin exigir códigos adicionales.

## Acceso por nombre de usuario

El formulario acepta nombres de usuario, no correos. Una tabla privada resuelve la identidad interna y Supabase Auth comprueba la contraseña; no se guarda una contraseña propia en texto plano ni en el repositorio. Las cuentas dedicadas no ingresan al padrón de asesores de KW ni modifican las contraseñas de las cuentas KW existentes. Se conservan permisos, límites y cierre por inactividad. La política de Auth exige al menos 12 caracteres; no se redujo para aceptar contraseñas más cortas. El alta se realiza por la API administrativa en el servidor; no existe autorregistro.

## Ajustar imágenes

Cada selector ofrece Ajustar encuadre para la imagen actual. Al subir un archivo nuevo también se abre el ajustador, antes de subirlo. Incluye arrastre con ratón o dedo, zoom, controles horizontal/vertical, formatos recomendados por módulo, proporciones alternativas y restablecer. Cancelar no reemplaza la imagen ni sube un archivo. Confirmar crea una copia optimizada y la asigna al borrador; todavía requiere Guardar y Publicar. No se modifica el archivo original.

Se pueden seleccionar JPG, PNG o WebP de hasta 25 MB y 60 megapíxeles. La salida conserva transparencia cuando existe, se limita a 1800 píxeles de lado mayor, no amplía fuentes pequeñas y se reduce si hace falta para cumplir el límite de subida de 3 MB. El recorte se hace en el navegador; no hay proxy de imágenes remotas. Si el servidor de una URL externa impide el recorte por CORS, debe subirse el archivo original. Cada ajuste parte de la imagen que se está editando; para recuperar partes ya recortadas en una versión anterior, vuelve a elegir el original.

Los nombres neutros Galería de fotos 1 y Galería de fotos 2 corresponden a las galerías de ocho y dos fotografías del panel. Sus títulos y contenidos públicos no se sustituyen automáticamente.

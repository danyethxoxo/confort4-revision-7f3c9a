# Quiénes somos: dirección y comprobación

Se conserva el sistema visual de Confort4: tipografía Inter Tight, blanco y negro,
rojo para navegación/acciones, líneas finas y fotografías originales. Referencias
del propio sitio: portada de inicio y fotografía de las fichas de propiedades;
las galerías de reconocimientos son un límite explícito y conservan su markup.
Se aplican las referencias de tipografía y movimiento de Refero sin añadir una
estética distinta ni imágenes generadas.

| Decisión | Referencia | Objetivo |
| --- | --- | --- |
| Portada de al menos 100svh, foto y degradado oscuro | Solicitud + portada actual | Texto blanco legible sobre la foto |
| Historia en dos columnas con fotografía lateral | Lenguaje de las páginas de servicios | Evitar otra foto gigante a todo el ancho |
| Retratos contenidos junto a biografía/contacto | Brief de reducir protagonismo excesivo | Leer perfil y contactar sin recorrer una foto enorme |
| Reconocimientos sin rediseño | Restricción del propietario | Conservar los módulos aprobados |
| Aparición ascendente, encuadre de rostros sin parallax | Movimiento existente y guía de movimiento | Continuidad sin recortar caras ni repetir animaciones |

En móvil el hero mantiene el alto de pantalla y reserva una zona oscura para el
texto, con el encuadre adaptado para mostrar ambos rostros. Las fotos no se editan
ni se reemplazan en la base de datos. El retrato completo usa object-fit:contain.

Panel → Quiénes somos sigue el orden público: portada, historia, perfiles,
acompañamiento y las dos galerías. Portada permite subir/recortar la foto y editar
texto pequeño, título y presentación. Historia y título de perfiles son editables.

La portada espera el contenido publicado o libera el respaldo a los dos segundos.
Las imágenes se decodifican antes de revelar; una actualización tardía conserva
los nodos animados y precarga la foto nueva antes de sustituirla. Los textos ya
animados conservan sus líneas durante reinicializaciones. Se respeta movimiento
reducido. Ningún borrador o texto publicado se sobrescribe durante el despliegue.

Comprobado: 1440×900, 768×1024 y 390×844 sin desbordamiento; datos rápidos (350 ms)
y demorados (2700 ms), animación única y movimiento reducido; controles del editor,
guardado y vista previa con contenido simulado; suite completa de regresión.

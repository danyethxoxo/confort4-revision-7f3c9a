# Historial importado el 16 de noviembre de 2026

Fuente: 16 capturas de KW proporcionadas por el propietario en la carpeta
`confort 4/historial de propiedades`. Se cotejaron individualmente sus estados.

- 6 vendidas/rentadas visibles: San Antonio #402, Av. San Antonio, Giorgione #405,
  Carlos B. Zetina #206, Calz. San Isidro #C 903 y Giorgione (renta).
- 6 ocultas: Aristóteles/Polanco (retirada), Carlos B. Zetina #B-802,
  Cuauhtémoc y División del Norte (canceladas), Correggio #001 (expirada)
  y terreno de Álvaro Obregón (cancelada).
- 3 activas se mantienen en el catálogo; Cofre de Perote es borrador y no se
  presenta como operación cerrada.

Polanco ya existía bajo una clasificación provisional de vendida. Se reutiliza
su UUID y se corrige a fuera del mercado/oculta según la captura nueva.
Giorgione venta y renta son operaciones diferentes con identificadores KWLS
distintos, aunque compartan fotografía.

Los títulos inexistentes en KW se sustituyen por una descripción neutra basada
en la dirección, sin testimonios ni datos inventados. Se conserva el precio
vigente en la captura, moneda, identificador, estado original y características
en `source_details`; no se inventan fechas de cierre. Las miniaturas proceden
del recorte exacto de las capturas y tienen resolución limitada (280×158).
Se podrán sustituir por originales de mayor calidad.

`scripts/import-history-screenshots.mjs` prepara imágenes y SQL, pero no ejecuta
la importación. El SQL es idempotente por referencia KWLS/UUID: no sobreescribe
las decisiones posteriores del editor al repetirlo; la corrección documentada de Polanco solo aplica
antes de que tenga referencia KWLS. No subir capturas completas con datos de comisiones.

## Controles

Panel → Propiedades → Historial de operaciones: elegir estado, marcar o
desmarcar **Mostrar en el carrusel** y **Guardar estado y visibilidad**.
Guardar aquí aplica inmediatamente al historial público; no cambia el registro
de KW ni requiere volver a publicar los textos del sitio.

Estado y visibilidad son independientes. Incluso una cancelada puede mostrarse
manualmente, con la etiqueta CANCELADA (nunca se presenta como vendida).
El feed excluye las ocultas y las actualmente activas, incluyendo copias
antiguas guardadas en el contenido editorial.

Las bajas de propiedades propias activas siguen registrándose automáticamente
como vendida/rentada según su operación. Cancelación, expiración o retirada
explícita inicia oculta. Sin motivo explícito se aplica la regla autorizada por
el propietario: vendida/rentada. Una actualización repetida de un estado ya
inactivo conserva las decisiones manuales; un nuevo ciclo activa→inactiva
crea una nueva instantánea. Las externas del catálogo KW no se incorporan.

Seguridad: RLS privada, RPC solo service_role, usuario validado por Auth en Edge,
rol admin comprobado en base de datos y cambios auditados. Las pruebas SQL usan
tablas temporales y terminan con ROLLBACK.

# SEO de Confort4 by KW

Las páginas públicas tienen títulos y descripciones específicos, URL canónica,
Open Graph/Twitter, idioma es-MX y datos estructurados de negocio, sitio,
navegación, artículos y propiedades activas. Confort4 se identifica como asociado
a KW Premier; los perfiles sociales propios se mantienen separados de la afiliación.
No se incluyen estrellas de reseñas propias ni promesas de posicionamiento.

Cada despliegue obtiene exclusivamente la versión **publicada** del CMS y exporta
HTML indexable con el catálogo actual. También hay actualización programada cada
seis horas. Los borradores no se exportan. Las propiedades o artículos retirados
conservan una página informativa con noindex y salen del sitemap.

Las fotos siguen la política SDR y tamaños adaptativos; los metadatos utilizan
URLs HTTPS absolutas válidas. El logo es SVG de trazados, sin imagen incrustada.

El sitio actualmente se publica en:
https://danyethxoxo.github.io/confort4-revision-7f3c9a/

No hay dominio propio configurado en GitHub Pages. No se debe declarar confort4.com
como URL canónica sin conectarlo y verificarlo primero. Al conectar un dominio,
actualizar el origen, canonicals, sitemap y referencias del negocio.

Se genera robots.txt junto al sitio. En GitHub Pages con ruta de proyecto,
el robots.txt reconocido por Google corresponde a la **raíz del host**, que este
repositorio no controla. El archivo del proyecto queda preparado para servirlo
desde la raíz de un dominio propio; no se presenta como una regla ya aplicada al host.
La indexación de páginas privadas/retiradas se controla con meta robots noindex.

## Seguimiento que requiere la cuenta del propietario

1. Verificar esta URL (o el dominio propio, cuando exista) en Google Search Console.
2. Enviar el sitemap publicado: /confort4-revision-7f3c9a/sitemap.xml.
3. Revisar indexación, búsquedas, clics y Core Web Vitals con datos reales.
4. Mantener nombre, teléfono, dirección y enlaces coherentes en el Perfil de Empresa
   de Google y perfiles oficiales de Confort4/KW Premier.

El código no da acceso a Search Console ni verifica la propiedad por sí solo.
Las posiciones dependen de Google, competencia, contenido, enlaces y señales locales.

Validación: npm test y node tests/seo.test.mjs. Para comprobar una exportación
actualizada: node scripts/fetch-public-snapshot.mjs y después
node scripts/build-pages.mjs --live. Los snapshots viven en .cache y no se versionan.

import {renderHeaderNavigation} from '../dist/header-render.mjs';
import {headerConfig} from '../dist/header-model.mjs';
import {pageSEO} from './seo.mjs';
﻿import fs from 'node:fs';
import path from 'node:path';
import {validateContent} from '../dist/content-validation.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,v)=>fs.writeFileSync(path.join(root,p),v);
fs.mkdirSync(path.join(root,'dist/vendor'),{recursive:true});
for(const [source,target] of [['dist/lenis.mjs','lenis.mjs'],['dist/lenis.css','lenis.css'],['LICENSE','lenis-license.txt']]) {
 fs.copyFileSync(path.join(root,'node_modules/lenis',source),path.join(root,'dist/vendor',target));
}
const snapshot=process.argv.includes('--live')?JSON.parse(read('.cache/public-site.json')):null;
const content=snapshot?.content||JSON.parse(read('content/site.json'));validateContent(content);
const properties=snapshot?.properties||JSON.parse(read('content/inventory.json'));
const articleRoutes=Object.fromEntries(content.posts.filter(p=>p.published).map(p=>[p.slug,'lectura-'+p.slug+'.html']));
const propertyRoutes=Object.fromEntries(properties.map(p=>[p.id,'inmueble-'+p.id+'.html']));
write('dist/routes.mjs','export const articleRoutes='+JSON.stringify(articleRoutes)+';\nexport const propertyRoutes='+JSON.stringify(propertyRoutes)+';\n');
write('supabase/functions/confort4-site/content-validation.mjs',read('dist/content-validation.mjs'));
write('supabase/functions/confort4-site/header-model.mjs',read('dist/header-model.mjs'));
write('supabase/functions/confort4-forms/privacy-policy.mjs',read('dist/privacy-policy.mjs').replace(/(\.mjs)\?v=[a-z0-9]+/g,'$1'));
for(const target of ['confort4-forms','confort4-site'])for(const file of ['privacy-model.mjs','privacy-defaults.mjs'])write('supabase/functions/'+target+'/'+file,read('dist/'+file).replace(/(\.mjs)\?v=[a-z0-9]+/g,'$1'));
write('supabase/functions/confort4-photo/photo-policy.mjs',read('dist/photo-policy.mjs'));
const {renderPage,e,contactDetails,googleReviewModule,clientsModule,imageOf,safeImage,safeImageSet}=await import('../dist/ui.mjs');
const bundle={content,properties,reviews:snapshot?.reviews||[],revision:snapshot?.revision||1};
const {deploymentOrigin}=await import('./deployment-config.mjs');
const origin=deploymentOrigin(JSON.parse(read('content/deployment.json')));
const origins=[...new Set(['https://danyethxoxo.github.io',new URL(origin).origin])];
const originModule='// Exact trusted origins only. Updated from content/deployment.json at build time.\nexport const SITE_ORIGINS=Object.freeze('+JSON.stringify(origins)+');\nexport function corsOrigin(value){return SITE_ORIGINS.includes(value)?value:null;}\n';
write('dist/site-origins.mjs',originModule);
for(const target of ['confort4-site','confort4-forms'])write('supabase/functions/'+target+'/site-origins.mjs',originModule);
const header=read('templates/header.html').replace('{{MENU_LABEL}}',e(headerConfig(content).menuLabel));
const footer=read('templates/footer.html').replace('{{CONFORT4_LOGO}}',read('dist/assets/confort4-footer-provided.svg')).replace('{{CONTACT_DETAILS}}',contactDetails(content,true));
const routes=[['index','home','Compra, vende y renta en CDMX'],['quienes-somos','team','Quiénes somos'],['vender','vender','Vender una propiedad'],['comprar','comprar','Comprar una propiedad'],['rentar','rentar','Rentar una propiedad'],['propiedades','catalog','Propiedades'],['propiedad','property','Detalle de propiedad'],['blog','blog','Guías inmobiliarias'],['articulo','article','Lecturas Confort4'],['recursos','resources','Herramientas y checklists'],['preguntas','faq','Preguntas frecuentes'],['contacto','contact','Contacto'],['resena','review','Dejar una reseña'],['privacidad','privacy','Privacidad'],['admin','admin','Acceso del equipo']];
for(const post of content.posts.filter(p=>p.published))routes.push([articleRoutes[post.slug].slice(0,-5),'article',post.title,{slug:post.slug}]);
for(const property of properties)routes.push([propertyRoutes[property.id].slice(0,-5),'property',property.titulo,{id:property.id}]);
// Preserve previously shared URLs while removing inactive listing details from fallback HTML.
for(const file of fs.readdirSync(path.join(root,'dist'))){
 const oldPost=file.match(/^lectura-(.+)\.html$/);
 if(oldPost&&!articleRoutes[oldPost[1]])routes.push([file.slice(0,-5),'article','Artículo no disponible',{slug:oldPost[1]}]);
 const match=file.match(/^inmueble-([a-f0-9-]{36})\.html$/);
 if(match&&!properties.some(property=>property.id===match[1]))routes.push([file.slice(0,-5),'property','Propiedad no disponible',{id:match[1]}]);
}
const admin='<section class="admin-login wrap"><h1>Editor de Confort4</h1><p>Edita tu sitio por módulos. Los cambios se revisan en borrador antes de publicarse.</p><form method="post" id="login-form" class="site-form"><label>Nombre de usuario<input type="text" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="32" required></label><label>Contraseña<input type="password" name="password" autocomplete="current-password" required></label><button class="button" type="submit">Entrar al panel</button><p role="status" id="login-status"></p></form><p>Usa tu nombre de usuario y contraseña del editor. El acceso está protegido y limitado a cuentas autorizadas.</p></section><section id="admin-panel" hidden></section>';
for(const [file,page,title,params={}] of routes){
 const post=page==='article'&&content.posts.find(p=>p.slug===params.slug&&p.published!==false);
 const property=page==='property'&&properties.find(p=>p.id===params.id);
 const coverPhoto=property?imageOf(property):page==='home'?content.home.photo:null;
 let main=page==='admin'?admin:renderPage(bundle,page,params);
 main=main.replace('id="operaciones-cerradas"','id="operaciones-cerradas" hidden data-history-pending');
 const indexable=page!=='admin'&&!(['article','property'].includes(page)&&!post&&!property);
 const pageHeader=header.replace('{{HEADER_NAVIGATION}}',renderHeaderNavigation(content,file+'.html'));
 const seo=pageSEO({page,file,title,content,property,post,origin,indexable}),jsonld=seo.jsonld;
 write('dist/'+file+'.html',`<!doctype html><html lang="es-MX"><head>
 <meta charset="utf-8"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self'; connect-src 'self' https://iloetojomzqtadkithtv.supabase.co; frame-src 'self' https://maps.google.com https://www.google.com; object-src 'none'; base-uri 'none'; form-action 'none'">${page==='admin'?'<link rel="stylesheet" href="editor.css?v=20261121fast">':''}<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff">
 <style>html.header-preparing .header{visibility:hidden;opacity:0}</style><script src="header-boot.js?v=20261121fast"></script>
 ${coverPhoto?`<link rel="preload" as="image" href="${safeImage(coverPhoto)}" imagesrcset="${safeImageSet(coverPhoto)}" imagesizes="100vw" fetchpriority="high">`:''}<title>${e(seo.title)}</title><meta name="description" content="${e(seo.description)}">${!indexable?'':`<link rel="canonical" href="${seo.url}">`}
 <meta name="robots" content="${indexable?'index,follow,max-image-preview:large':'noindex,nofollow'}"><meta property="og:locale" content="es_MX"><meta property="og:site_name" content="Confort4 by KW"><meta property="og:url" content="${seo.url}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(seo.title)}"><meta name="twitter:description" content="${e(seo.description)}"><meta name="twitter:image" content="${e(seo.image)}"><meta property="og:title" content="${e(seo.title)}"><meta property="og:description" content="${e(seo.description)}"><meta property="og:type" content="${seo.type}"><meta property="og:image" content="${e(seo.image)}">
 ${page!=='admin'?'<script src="image-motion-boot.js?v=20261121fast"></script>':''}${page==='home'?'<script src="motion-boot.js?v=20261121fast"></script>':''}${page==='team'?'<script src="team-boot.js?v=20261121fast"></script>':''}<link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="preload" href="assets/inter-tight-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="styles.css?v=20261113kwccc"><link rel="stylesheet" href="modules.css?v=20261113kwccc"><link rel="stylesheet" href="identity.css?v=20261121fast"><link rel="stylesheet" href="motion.css?v=20261121fast">${page==='privacy'?'<link rel="stylesheet" href="privacy.css?v=20261121fast">':''}${page==='team'?'<link rel="stylesheet" href="team-layout.css?v=20261121fast">':''}
 <script src="form-config.js"></script><script type="module" src="${page==='admin'?'admin.mjs':'site.mjs'}?v=20261121fast"></script>${jsonld?'<script type="application/ld+json">'+JSON.stringify(jsonld).replaceAll('<','\\u003c')+'</script>':''}</head>
 <body data-page="${page}" data-route-id="${e(params.id||'')}" data-route-slug="${e(params.slug||'')}"><a class="skip" href="#contenido">Saltar al contenido</a>${(['home','team'].includes(page)?pageHeader.replace('class="header"','class="header over-hero"'):pageHeader)}<main id="contenido">${main}</main>${footer}<script type="application/json" id="site-data">${JSON.stringify(bundle).replaceAll('<','\\u003c')}</script></body></html>`);
}
const indexedRoutes=routes.filter(([file,page,,params={}])=>!['admin','articulo','propiedad'].includes(file)&&!(page==='property'&&!properties.some(p=>p.id===params.id))&&!(page==='article'&&!articleRoutes[params.slug]));
write('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+indexedRoutes.map(([file,page,,params={}])=>{const updated=page==='property'?properties.find(p=>p.id===params.id)?.updated_at:page==='article'?content.posts.find(p=>p.slug===params.slug)?.updated:null;const lastmod=updated&&/^\d{4}-\d{2}-\d{2}/.test(updated)?'<lastmod>'+e(updated.slice(0,10))+'</lastmod>':'';return '<url><loc>'+origin+(file==='index'?'':file+'.html')+'</loc>'+lastmod+'</url>';}).join('')+'</urlset>');
write('dist/robots.txt','User-agent: *\nAllow: /\nSitemap: '+origin+'sitemap.xml\n');
console.log('Built '+routes.length+' public and administrative pages, static article/property routes and sitemap.');



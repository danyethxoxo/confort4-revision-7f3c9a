import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const base=new URL('../dist/',import.meta.url),pages=fs.readdirSync(base).filter(p=>p.endsWith('.html'));
const svg=file=>new JSDOM(fs.readFileSync(new URL('assets/'+file,base),'utf8'),{contentType:'image/svg+xml'}).window.document;
const original=svg('confort4-header-thick-source.svg'),white=svg('confort4-header-white-bold.svg');
assert.deepEqual([...white.querySelectorAll('path')].map(p=>p.getAttribute('d')),[...original.querySelectorAll('path')].filter(p=>p.getAttribute('fill')!=='#252726').map(p=>p.getAttribute('d')),'Preserve the supplied logo geometry');
for(const node of white.querySelectorAll('[fill],[stroke]'))for(const attr of ['fill','stroke']){const paint=node.getAttribute(attr);if(paint&&paint!=='none')assert(['#fff','#ffffff'].includes(paint.toLowerCase()),'Header artwork must be entirely white');}
assert.equal(svg('confort4-vector.svg').querySelector('svg>circle').getAttribute('fill'),'#252726','Use the gray from the supplied PDF');
const titles=new Set();let indexed=0;
for(const file of pages){
 const doc=new JSDOM(fs.readFileSync(new URL(file,base),'utf8')).window.document;
 assert(doc.title.includes('Confort4'),'Brand must be in every page title');
 const robots=doc.querySelector('meta[name=robots]')?.content;
 if(!robots?.includes('noindex')){
  indexed++;assert(!titles.has(doc.title),'Indexable page titles must be unique: '+file);titles.add(doc.title);
  const canonical=doc.querySelector('link[rel=canonical]')?.href;assert(canonical?.startsWith('https://danyethxoxo.github.io/confort4-revision-7f3c9a/'));
  assert(doc.querySelector('meta[name=description]')?.content.length>40);
  const image=doc.querySelector('meta[property="og:image"]').content;assert.equal(new URL(image).protocol,'https:');assert(!image.includes('confort4-revision-7f3c9a/https:'));
  assert.equal(doc.querySelector('meta[property="og:url"]').content,canonical);
  const graph=JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
  const agency=graph.find(n=>n['@type']==='RealEstateAgent');assert.equal(agency.memberOf.name,'KW Premier');assert(!agency.sameAs.includes('https://www.kwpremieroficial.com/'),'Affiliation is not identity');assert(!agency.aggregateRating,'Do not claim self-serving review stars');
  if(file.startsWith('inmueble-'))assert(graph.some(n=>n['@type']==='RealEstateListing'));
 }
 assert.equal(doc.querySelectorAll('.brand-logo svg image').length,0,'The vector logo must not embed a bitmap');
 assert(doc.querySelector('.brand-logo img[src="assets/confort4-header-white-bold.svg"]'));assert(!fs.readFileSync(new URL('assets/confort4-header-white-bold.svg',base),'utf8').includes('<image'));assert(doc.querySelector('.footer-logo-round svg path'));
 assert(doc.querySelector('.nav-project'));assert(doc.querySelector('.header-contact-button .whatsapp-icon'));
 assert.equal(doc.querySelector('.footer-by').textContent,'by KW');
}
const sitemap=fs.readFileSync(new URL('sitemap.xml',base),'utf8');assert(!sitemap.includes('admin.html'));assert.equal((sitemap.match(/<url>/g)||[]).length,indexed);assert(!sitemap.includes('inmueble-b487a75d-10e5-4b14-86b5-9539984df359'));
assert.equal(new JSDOM(fs.readFileSync(new URL('quienes-somos.html',base),'utf8')).window.document.querySelector('.header').classList.contains('over-hero'),true);
console.log(`PASS: ${indexed} indexable routes, unique SEO titles, canonical/social URLs, affiliation schema, listing metadata, real vector branding and shared header controls.`);

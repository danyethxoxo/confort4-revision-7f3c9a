import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {sources} from '../dist/property-image-manifest.mjs';
const properties=JSON.parse(fs.readFileSync(new URL('../content/inventory.json',import.meta.url)));
for(const property of properties){
 for(const photo of property.imagenes||[]){const url=typeof photo==='string'?photo:photo.url;assert.ok(sources[url],`Static SDR derivatives for ${url}`);}
 const file=new URL('../dist/inmueble-'+property.id+'.html',import.meta.url);
 if(!fs.existsSync(file))continue;
 const doc=new JSDOM(fs.readFileSync(file,'utf8')).window.document;
 const hero=doc.querySelector('#gallery-main'),preload=doc.querySelector('link[rel="preload"][as="image"]');
 assert.ok(preload);assert.equal(preload.getAttribute('imagesrcset'),hero.getAttribute('srcset'));
 assert.equal(preload.getAttribute('imagesizes'),hero.getAttribute('sizes'));
 assert.equal(hero.getAttribute('fetchpriority'),'high');
 assert(!hero.getAttribute('src').includes('/functions/v1/'));
 for(const thumbnail of doc.querySelectorAll('[data-gallery] img'))assert.equal(thumbnail.getAttribute('loading'),'lazy');
}
console.log('PASS: prepared inventory photos, matching responsive hero preload, high cover priority and lazy thumbnails.');

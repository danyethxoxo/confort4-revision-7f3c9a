import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {defaultHeader,headerConfig,validateHeader,headerDestination} from '../dist/header-model.mjs';
import {renderHeaderNavigation} from '../dist/header-render.mjs';
import {editorialContent} from '../dist/editorial-model.mjs';
import {validateContent} from '../dist/content-validation.mjs';
import {editorialEditor} from '../dist/admin-editors.mjs';
const h=defaultHeader();validateHeader(h);assert.equal(h.socials.at(-1).href,'https://www.tiktok.com/@confort4bienesraicesbykw?is_from_webapp=1&sender_device=pc');
h.links.project.bold=false;h.links.properties.label='Nuestro catalogo';h.links.properties.href='propiedades.html#catalogo';h.links.team.visible=false;h.contact.icon='none';
const doc=new JSDOM(renderHeaderNavigation(h)).window.document;assert.equal(doc.querySelector('.nav-project').classList.contains('is-bold'),false);assert.equal(doc.querySelector('[data-header-link=properties]').textContent,'Nuestro catalogo');assert.equal(doc.querySelector('[data-header-link=properties]').getAttribute('href'),'propiedades.html#catalogo');assert(!doc.querySelector('[data-header-link=team]'));assert(!doc.querySelector('.header-contact-button svg'));assert(doc.querySelector('[data-social-icon=tiktok] svg.icon-filled'));
for(const bad of ['javascript:alert(1)','https://user:pass@example.com','//example.com','data:text/html,hi','<script>'])assert.equal(headerDestination(bad),null);
for(const change of [d=>d.socials.push(...Array(8).fill(d.socials[0])),d=>d.socials[0].icon='script',d=>d.links.project.href='javascript:alert(1)',d=>d.contact.bold='true',d=>d.socials={},d=>d.interest.items=[]]){const bad=defaultHeader();change(bad);assert.throws(()=>validateHeader(bad));}
h.links.project.label='<img src=x onerror=alert(1)>';assert(!renderHeaderNavigation(h).includes('<img'));
const d=editorialContent(JSON.parse(fs.readFileSync(new URL('../content/site.json',import.meta.url))));assert.equal(validateContent(d),d);assert.equal(headerConfig({home:{}}).socials.length,4);
const editor=editorialEditor('header',d,{input:(path)=>`<input data-bind="${path}">`,block:(title,body)=>`<section><h2>${title}</h2>${body}</section>`});const form=new JSDOM(editor).window.document;for(const path of ['header.links.project.bold','header.interest.items.0.href','header.contact.icon','header.socials.3.href'])assert(form.querySelector(`[data-bind="${path}"]`));assert(form.querySelector('[data-add-header-social]'));assert(form.querySelector('[data-remove-header-social="3"]'));
console.log('PASS: editable header defaults, TikTok, independent visibility/bold/links/icons, editor bindings and unsafe input rejection.');

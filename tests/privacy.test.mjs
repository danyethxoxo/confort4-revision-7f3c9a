import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {clearVisitorPreferences} from '../dist/visitor-storage.mjs';
import {PRIVACY_VERSION,privacySummary} from '../dist/privacy-policy.mjs';
const root=new URL('../dist/',import.meta.url);
const dom=new JSDOM('',{url:'https://example.invalid'}),storage=dom.window.localStorage;
for(const key of ['confort4-favorites','confort4-checklist-venta','confort4-team-public','confort4-property-preview','other-site','confort4-preview','confort4-session'])storage.setItem(key,'value');
assert.equal(clearVisitorPreferences(storage),4);
for(const key of ['other-site','confort4-preview','confort4-session'])assert.equal(storage.getItem(key),'value');
assert(PRIVACY_VERSION.includes('2026-11-19'));
assert(privacySummary('review').includes('permiso separado'));
for(const file of ['contacto.html','resena.html','vender.html','rentar.html','comprar.html','propiedades.html']){
 const doc=new JSDOM(fs.readFileSync(new URL(file,root),'utf8')).window.document;
 for(const form of doc.querySelectorAll('form.site-form')){
  assert(form.querySelector('.privacy-summary a[href="privacidad.html"]'));
  assert(!form.querySelector('input[name=consent]').checked);
  assert(form.querySelector('input[name=consent]').required);
  const publication=form.querySelector('input[name=publishConsent]');if(publication){assert(!publication.required);assert(!publication.checked);}
 }
 const csp=doc.querySelector('meta[http-equiv="Content-Security-Policy"]').content;
 assert(csp.includes("script-src 'self'"));assert(csp.includes("object-src 'none'"));assert(csp.includes("form-action 'none'"));
 assert(!csp.includes("script-src 'self' 'unsafe-inline'"));
}
const notice=new JSDOM(fs.readFileSync(new URL('privacidad.html',root),'utf8')).window.document;
assert(notice.querySelector('[data-clear-preferences]'));
assert(notice.querySelector('a[href="https://kwpremiermx.kw.com/es-es/aviso-de-privacidad"]'));
assert(!notice.body.textContent.includes('propiedades guardadas y comparadas'));
console.log('PASS: purpose/identity notices, independent unticked consents, CSP restrictions and scoped visitor preference clearing.');

for(const link of notice.querySelectorAll(".privacy-index a")){assert(notice.querySelector(link.getAttribute("href")));}assert.equal(notice.querySelectorAll(".privacy-index a").length,8);

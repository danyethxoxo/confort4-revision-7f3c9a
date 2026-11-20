import {DEFAULT_PRIVACY} from './privacy-defaults.mjs';
export const PRIVACY_VERSION='confort4-2026-11-19.2';
export function privacyConfig(content){
 const value=content?.privacy??content??{};
 const source=value?.sections?value:{};
 return {...structuredClone(DEFAULT_PRIVACY),...source,sections:DEFAULT_PRIVACY.sections.map(base=>({...base,...source.sections?.find(s=>s.id===base.id),links:structuredClone(source.sections?.find(s=>s.id===base.id)?.links??base.links)}))};
}
export function privacyDestination(value){
 if(typeof value!=='string'||value.length>2048||/[\s<>"'\\]/.test(value))return null;
 if(/^mailto:[^@?]+@[^@?]+\.[^@?]+$/.test(value))return value;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function validatePrivacy(value){
 if(value===undefined)return;
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Revisa el aviso de privacidad.');
 for(const key of ['title','eyebrow','updated','responsibleName','brand','address','email','contactPurpose','reviewPurpose','summaryEnding','contactHeading','contactButton'])if(typeof value[key]!=='string'||!value[key].trim()||value[key].length>1500)throw Error('Completa los datos del aviso de privacidad.');
 if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value.email))throw Error('Revisa el correo de privacidad.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value.updated)||!Number.isFinite(Date.parse(value.updated))||new Date(value.updated).toISOString().slice(0,10)!==value.updated)throw Error('Revisa la fecha del aviso.');
 if(!Array.isArray(value.sections)||value.sections.length!==DEFAULT_PRIVACY.sections.length||new Set(value.sections.map(s=>s?.id)).size!==DEFAULT_PRIVACY.sections.length)throw Error('Conserva los apartados del aviso de privacidad.');
 for(const section of value.sections){
  if(!DEFAULT_PRIVACY.sections.some(s=>s.id===section?.id)||typeof section.title!=='string'||!section.title.trim()||section.title.length>150||typeof section.body!=='string'||!section.body.trim()||section.body.length>18000)throw Error('Completa los textos del aviso.');
  if(!Array.isArray(section.links)||section.links.length>10)throw Error('Cada apartado admite hasta 10 enlaces.');
  for(const link of section.links)if(!link||typeof link.label!=='string'||!link.label.trim()||link.label.length>150||!privacyDestination(link.href))throw Error('Usa enlaces HTTPS o de correo válidos en el aviso.');
 }
}
function canonical(content){const value=privacyConfig(content);return JSON.stringify(Object.fromEntries(Object.keys(DEFAULT_PRIVACY).map(key=>[key,key==='sections'?value.sections.map(s=>({id:s.id,title:s.title,body:s.body,links:s.links.map(l=>({label:l.label,href:l.href}))})):value[key]])));}
export async function privacyVersion(content){
 const text=canonical(content);if(text===canonical(DEFAULT_PRIVACY))return PRIVACY_VERSION;
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return 'confort4-privacy-'+[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
}

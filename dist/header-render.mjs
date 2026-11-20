import {headerConfig,headerDestination,SOCIAL_ICONS} from './header-model.mjs?v=20261118header';
const e=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
// Shared 24px outline grid; one stroke weight for every brand.
const glyphs={
 "facebook": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M13 22v-8h3l.5-3H13V8.5c0-.9.5-1.5 1.5-1.5H17V4h-2.5C11.5 4 10 5.8 10 8.5V11H8v3h2v8\"/>",
 "instagram": "<rect x=\"2\" y=\"2\" width=\"20\" height=\"20\" rx=\"6\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\"/><circle cx=\"18\" cy=\"6\" r=\".6\" fill=\"currentColor\" stroke=\"none\"/>",
 "youtube": "<rect x=\"1.5\" y=\"2\" width=\"21\" height=\"20\" rx=\"5\"/><path d=\"m10 8 6 4-6 4Z\"/>",
 "tiktok": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M13 6v9a3 3 0 1 1-3-3M13 6c0 2.5 1.5 4 4 4\"/>",
 "whatsapp": "<path d=\"M21.5 11.8a9.5 9.5 0 0 1-14.1 8.3L2 21.5l1.5-5.2A9.5 9.5 0 1 1 21.5 11.8Z\"/><path d=\"m8 7 1.5 3-1 1c1 2 2 3 4 4l1-1 3 1.5c0 1.5-1 2-2.5 1.5-4.5-1.5-7.5-4.5-8-7C5.5 8.5 6.5 7 8 7Z\"/>",
 "linkedin": "<rect x=\"2\" y=\"2\" width=\"20\" height=\"20\" rx=\"4\"/><path d=\"M7 10v7M7 7h.01M11 17v-7h3v1c2-2 4-1 4 2v4M14 17v-4\"/>",
 "x": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m7 7 10 10M17 7 7 17\"/>"
};
export function headerIcon(name){if(!Object.hasOwn(glyphs,name))return '';return `<svg class="header-network-icon ${name==='whatsapp'?'whatsapp-icon':''}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[name]}</svg>`;}
export function renderHeaderNavigation(content,current=''){
 const h=headerConfig(content),attrs=value=>{const href=headerDestination(value)||'#';return `href="${e(href)}"${href.startsWith('https://')?' target="_blank" rel="noopener noreferrer"':''}${href.split(/[?#]/)[0]===current?' aria-current="page"':''}`;};
 const link=(item,id,cls='')=>item.visible===false?'':`<a class="header-link ${item.bold?'is-bold':''} ${cls}" data-header-link="${id}" ${attrs(item.href)}>${e(item.label)}</a>`;
 const interest=h.interest.visible===false?'':`<div class="nav-interest"><button class="nav-interest-toggle header-link ${h.interest.bold?'is-bold':''}" type="button" aria-expanded="false" aria-controls="interest-links">${e(h.interest.label)} <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="nav-interest-links" id="interest-links" hidden>${h.interest.items.map((item,i)=>link(item,'interest-'+i)).join('')}</div></div>`;
 const socials=h.socials.filter(s=>s.visible!==false&&Object.hasOwn(SOCIAL_ICONS,s.icon)).map(s=>`<a ${attrs(s.href)} aria-label="${e(s.label)}" data-social-icon="${s.icon}">${headerIcon(s.icon)}</a>`).join('');
 const contact=h.contact.visible===false?'':`<a class="header-contact-button header-link ${h.contact.bold?'is-bold':''}" data-header-link="contact" ${attrs(h.contact.href)}>${headerIcon(h.contact.icon)}<span class="contact-label">${e(h.contact.label)}</span><span class="contact-sparks" aria-hidden="true">${Array.from({length:12},()=>'<i></i>').join('')}</span></a>`;
 return link(h.links.team,'team')+interest+link(h.links.project,'project','nav-project')+link(h.links.properties,'properties')+link(h.links.reviews,'reviews')+link(h.links.blog,'blog')+(socials?`<div class="header-social" aria-label="Redes sociales">${socials}</div>`:'')+contact;
}

export const SOCIAL_ICONS={facebook:'Facebook',instagram:'Instagram',youtube:'YouTube',tiktok:'TikTok',linkedin:'LinkedIn',x:'X',whatsapp:'WhatsApp'};
export const HEADER_LINKS={team:'Quiénes somos',project:'Mi proyecto',properties:'Propiedades',reviews:'Déjame una reseña',blog:'Blog'};
const link=(label,href,bold=false)=>({label,href,bold,visible:true});
export function defaultHeader(){return {
 menuLabel:'Menú',closeLabel:'Cerrar',
 links:{team:link('Quiénes somos','quienes-somos.html'),project:link('Mi proyecto','contacto.html',true),properties:link('Propiedades','propiedades.html'),reviews:link('Déjame una reseña','resena.html'),blog:link('Blog','blog.html')},
 interest:{label:'Me interesa',bold:false,visible:true,items:[link('Vender','vender.html'),link('Rentar','rentar.html'),link('Comprar','comprar.html')]},
 contact:{...link('Contáctanos','https://wa.me/525527477538'),icon:'whatsapp'},
 socials:[{icon:'facebook',label:'Facebook',href:'https://www.facebook.com/confortcuatro/',visible:true},{icon:'instagram',label:'Instagram',href:'https://www.instagram.com/confort4bienesraicesbykw/',visible:true},{icon:'youtube',label:'YouTube',href:'https://www.youtube.com/@confort4bienesraices',visible:true},{icon:'tiktok',label:'TikTok',href:'https://www.tiktok.com/@confort4bienesraicesbykw?is_from_webapp=1&sender_device=pc',visible:true}]
};}
export function headerConfig(value){const source=(value?.home?value.header:value?.header??value)??{},base=defaultHeader();return {...base,...source,links:Object.fromEntries(Object.entries(base.links).map(([id,item])=>[id,{...item,...source.links?.[id]}])),interest:{...base.interest,...source.interest,items:base.interest.items.map((item,i)=>({...item,...source.interest?.items?.[i]}))},contact:{...base.contact,...source.contact},socials:Array.isArray(source.socials)?source.socials.map(item=>({visible:true,...item})):base.socials};}
export function headerDestination(value){
 if(typeof value!=='string'||value.length>2048||/[\s<>"'\\\u0000-\u001f]/.test(value))return null;
 if(/^(?:[a-z0-9-]+\.html(?:[?#][^\s<>"'\\]*)?|#[a-z][\w-]*)$/i.test(value))return value;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function validateHeader(value){
 if(value===undefined)return;
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Revisa la configuración del header.');
 const text=(v,label)=>{if(typeof v!=='string'||!v.trim()||v.length>70)throw Error('Completa '+label+' del header (máximo 70 caracteres).');};
 const toggle=(v)=>{if(typeof v!=='boolean')throw Error('Revisa las casillas del header.');};
 const item=(v,label)=>{if(!v||typeof v!=='object')throw Error('Revisa '+label+' del header.');text(v.label,label);if(!headerDestination(v.href))throw Error('Usa un enlace HTTPS o una página interna en '+label+'.');toggle(v.bold);toggle(v.visible);};
 if(value.socials!==undefined&&!Array.isArray(value.socials))throw Error('Revisa las redes sociales del header.');
 for(const key of ['links','interest','contact'])if(value[key]!==undefined&&(!value[key]||typeof value[key]!=='object'||Array.isArray(value[key])))throw Error('Revisa '+key+' del header.');
 const d=headerConfig(value);text(d.menuLabel,'el botón de menú');text(d.closeLabel,'el botón para cerrar');
 for(const [id,label]of Object.entries(HEADER_LINKS))item(d.links[id],label);
 text(d.interest.label,'Me interesa');toggle(d.interest.bold);toggle(d.interest.visible);if(value.interest?.items&&(!Array.isArray(value.interest.items)||value.interest.items.length!==3))throw Error('Conserva los tres enlaces de Me interesa.');d.interest.items.forEach(v=>item(v,'el submenú'));
 item(d.contact,'el contacto');if(d.contact.icon!=='none'&&!Object.hasOwn(SOCIAL_ICONS,d.contact.icon))throw Error('Elige un icono de contacto válido.');
 if(!Array.isArray(d.socials)||d.socials.length>8)throw Error('Puedes mostrar hasta ocho redes sociales.');
 for(const social of d.socials){if(!social||!Object.hasOwn(SOCIAL_ICONS,social.icon))throw Error('Elige un icono de red social válido.');text(social.label,'el nombre de la red');toggle(social.visible);if(!headerDestination(social.href)?.startsWith('https://'))throw Error('Usa un enlace HTTPS para la red social.');}
}

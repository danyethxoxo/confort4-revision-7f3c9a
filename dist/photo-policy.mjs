// Shared by rendering, offline optimization and the public image gateway.
export const PHOTO_VERSION='sdr2';
export const PHOTO_ORIGIN='https://danyethxoxo.github.io/confort4-revision-7f3c9a/';
export const PHOTO_GATEWAY='https://iloetojomzqtadkithtv.supabase.co/functions/v1/confort4-photo';
export const PHOTO_PROFILES=Object.freeze({
 thumb:{width:240,quality:65,maxBytes:24000},
 card:{width:800,quality:74,maxBytes:160000},
 large:{width:1440,quality:76,maxBytes:320000}
});
export function originalPhotoURL(value){
 if(typeof value!=='string'||value.length>2048)return null;
 try{
  const url=new URL(value,PHOTO_ORIGIN);
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash)return null;
  const allowed=(url.hostname==='storage.googleapis.com'&&url.pathname.startsWith('/attachment-listing-prod-5af4/'))||
   (url.hostname==='repstaticneu.azureedge.net'&&url.pathname.startsWith('/images/'))||
   (url.hostname==='iloetojomzqtadkithtv.supabase.co'&&url.pathname.startsWith('/storage/v1/object/public/confort4-media/'))||
   (url.hostname==='danyethxoxo.github.io'&&url.pathname.startsWith('/confort4-revision-7f3c9a/assets/'));
  return allowed&&/\.(jpe?g|png|webp|avif|heic)(?:$)/i.test(url.pathname)?url.href:null;
 }catch{return null;}
}
export function photoGatewayURL(value,profile='card'){
 const original=originalPhotoURL(value);if(!original)return 'assets/property-placeholder.svg';
 const url=new URL(PHOTO_GATEWAY);url.search=new URLSearchParams({url:original,size:Object.hasOwn(PHOTO_PROFILES,profile)?profile:'card',v:PHOTO_VERSION});return url.href;
}
export function savePhotoData(connection=globalThis.navigator?.connection){return connection?.saveData===true||['slow-2g','2g'].includes(connection?.effectiveType);}

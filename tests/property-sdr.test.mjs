import assert from 'node:assert/strict';
import fs from 'node:fs';
import {propertyImageSource} from '../dist/property-image-sources.mjs';
import {safeImage,propertyCard,renderPage} from '../dist/ui.mjs';
import {PHOTO_PROFILES,photoGatewayURL,originalPhotoURL,savePhotoData} from '../dist/photo-policy.mjs';
import {validateSDR,convertPhoto,readLimited} from '../supabase/functions/confort4-photo/media.mjs';
const sources=JSON.parse(fs.readFileSync(new URL('../content/property-image-sources.json',import.meta.url)));
assert.equal(Object.keys(sources).length,38);
for(const [original,variants] of Object.entries(sources))for(const [size,asset] of Object.entries(variants)){
 assert.equal(propertyImageSource(original,size),asset);
 assert.equal(propertyImageSource(asset,size),asset,'Already optimized images must not be proxied again');
 assert.equal(safeImage(original,size),asset);
 const data=fs.readFileSync(new URL('../dist/'+asset,import.meta.url));
 assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');
 for(let offset=12;offset+8<=data.length;){const chunk=data.toString('ascii',offset,offset+4);assert.ok(!['EXIF','XMP ','ICCP'].includes(chunk),'No inherited HDR or color metadata');const size=data.readUInt32LE(offset+4);offset+=8+size+(size%2);}
 validateSDR(data,PHOTO_PROFILES[size]);
}
const original=Object.keys(sources)[0];assert.ok(propertyCard({id:'test',imagenes:[original],titulo:'Test'}).includes('src="'+sources[original].card+'"'));
for(const invalid of ['https://example.com/other.jpg','http://127.0.0.1/a.jpg','https://storage.googleapis.com/other/a.jpg','https://user:secret@storage.googleapis.com/attachment-listing-prod-5af4/a.jpg','javascript:alert(1)','//evil.test/a.jpg','assets/../private.jpg',null,'__proto__']){assert.equal(originalPhotoURL(invalid),null);assert.equal(propertyImageSource(invalid),'assets/property-placeholder.svg');}
const future='https://storage.googleapis.com/attachment-listing-prod-5af4/new/photo.jpeg';
for(const size of Object.keys(PHOTO_PROFILES)){const url=new URL(propertyImageSource(future,size));assert.equal(url.pathname,'/functions/v1/confort4-photo');assert.equal(url.searchParams.get('url'),future);assert.equal(url.searchParams.get('size'),size);assert(!url.searchParams.has('default'),'No redirect-to-original fallback');}
const small=fs.readFileSync(new URL('../dist/'+sources[original].thumb,import.meta.url));
assert.throws(()=>validateSDR(Buffer.alloc(PHOTO_PROFILES.thumb.maxBytes+1),PHOTO_PROFILES.thumb));
assert.throws(()=>validateSDR(Buffer.from('JPEG HDR gain map'),PHOTO_PROFILES.large));
const metadata=Buffer.concat([small,Buffer.from('XMP '+String.fromCharCode(4,0,0,0)+'HDR!')]);metadata.writeUInt32LE(metadata.length-8,4);assert.throws(()=>validateSDR(metadata,PHOTO_PROFILES.large),'HDR metadata must be rejected');
assert.throws(()=>validateSDR(small,{width:100,maxBytes:24000}),'Oversized dimensions must be rejected');
let calls=0;assert.deepEqual(await convertPhoto(future,'thumb',async(url,options)=>{calls++;assert.equal(url.hostname,'wsrv.nl');assert.equal(url.searchParams.get('output'),'webp');assert.equal(options.redirect,'error');return new Response(small,{headers:{'Content-Type':'image/webp'}});}),new Uint8Array(small));assert.equal(calls,1);
calls=0;await assert.rejects(convertPhoto(future,'thumb',async()=>{calls++;return new Response(metadata,{headers:{'Content-Type':'image/webp'}});}));assert.equal(calls,3,'Fail closed after bounded conversion attempts');
await assert.rejects(readLimited(new Response(Buffer.alloc(25)),24));
assert.equal(savePhotoData({saveData:true}),true);assert.equal(savePhotoData({effectiveType:'2g'}),true);assert.equal(savePhotoData({effectiveType:'4g'}),false);
const data=JSON.parse(fs.readFileSync(new URL('../content/site.json',import.meta.url))),property={id:'test',titulo:'Future photo',imagenes:[future],precio:100,operacion:'Venta'};
const html=renderPage({content:data,properties:[property],reviews:[]},'property',{id:'test'});
assert(html.includes('size=thumb'),'Gallery thumbnails must use the small profile');assert(html.includes('size=large'),'Gallery cover must use the large profile');assert(!html.includes('src="'+future+'"'),'Future originals must never be embedded directly');
console.log('SDR photos: 152 responsive budgeted variants, strict format/dimension/metadata validation, automatic future sources, safe failure and low-data policy passed.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
const sources=JSON.parse(fs.readFileSync(new URL('../content/property-image-sources.json',import.meta.url)));
const sample=fs.readFileSync(new URL('../dist/'+Object.values(sources)[0].thumb,import.meta.url));
let handler,mode='cached',calls=[];
globalThis.Deno={env:{get:name=>({SUPABASE_URL:'https://project.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-private-key'}[name]||'')},serve:fn=>handler=fn};
globalThis.fetch=async(value,options={})=>{
 const url=String(value);calls.push({url,options});
 if(url.includes('/object/public/'))return new Response(null,{status:mode==='cached'?200:404});
 if(url.endsWith('/confort4_rate_gate'))return Response.json(mode!=='rate');
 if(url.startsWith('https://wsrv.nl/'))return new Response(mode==='bad-image'?Buffer.from('HDR JPEG'):sample,{headers:{'Content-Type':mode==='bad-image'?'image/jpeg':'image/webp'}});
 if(url.includes('/storage/v1/object/confort4-property-sdr/')){assert.equal(options.headers['Content-Type'],'image/webp');assert.equal(options.headers['x-upsert'],'false');assert.deepEqual(options.body,new Uint8Array(sample));return Response.json({ok:true});}
 throw Error('Unexpected request '+url);
};
await import('../supabase/functions/confort4-photo/index.ts');
const original='https://storage.googleapis.com/attachment-listing-prod-5af4/new/photo.jpeg';
const request=(url=original,size='thumb',method='GET')=>new Request('https://project.invalid/functions/v1/confort4-photo?'+new URLSearchParams({url,size}),{method});
let response=await handler(request());assert.equal(response.status,302);assert(response.headers.get('location').startsWith('https://project.invalid/storage/v1/object/public/confort4-property-sdr/sdr2/thumb/'));assert.equal(calls.length,1,'Cached images must skip conversion and rate writes');
mode='cold';calls=[];response=await handler(request());assert.equal(response.status,302);assert(calls.some(c=>c.url.startsWith('https://wsrv.nl/')));assert(calls.some(c=>c.url.includes('/object/confort4-property-sdr/')));assert(!calls.some(c=>c.url===original),'Never fetch the HDR original into the browser or function');
mode='bad-image';calls=[];response=await handler(request());assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'image/svg+xml');assert.equal(response.headers.get('location'),null);assert(!calls.some(c=>c.url.includes('/object/confort4-property-sdr/')),'Unverified files must not enter the cache');
mode='rate';response=await handler(request());assert.equal(response.status,429);assert.equal(response.headers.get('location'),null);
for(const url of ['http://127.0.0.1/photo.jpg','https://evil.invalid/a.jpg']){calls=[];assert.equal((await handler(request(url))).status,400);assert.equal(calls.length,0);}
assert.equal((await handler(request(original,'__proto__'))).status,400);assert.equal((await handler(request(original,'thumb','POST'))).status,405);
console.log('PASS: public photo gateway cache, bounded conversion, immutable service uploads, safe placeholders, rate limits and SSRF rejection.');

// Regenerate checked-in SDR derivatives without changing the source inventory.
// Add original HTTPS URLs and their assets/property-sdr/*.webp paths to the manifest.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {PHOTO_PROFILES,PHOTO_VERSION} from '../dist/photo-policy.mjs';
const root=path.resolve(import.meta.dirname,'..');
const sources=JSON.parse(await fs.readFile(path.join(root,'content/property-image-sources.json'),'utf8'));
const oldAssets=new Set(Object.values(sources).flatMap(entry=>typeof entry==='string'?[entry]:Object.values(entry)));
const originalCache=path.join(os.tmpdir(),'confort4-original-photos');await fs.mkdir(originalCache,{recursive:true});
const entries=Object.entries(sources);let next=0;
async function worker(){
 while(next<entries.length){
  const [url,entry]=entries[next++];
  const hash=createHash('sha256').update(url).digest('hex').slice(0,20);
  const asset='assets/property-sdr/'+hash+'-'+PHOTO_VERSION+'.webp';
  if(!url.startsWith('https://')||!/^assets\/property-sdr\/[a-z0-9-]+\.webp$/.test(asset))throw Error('Invalid photo manifest entry');
  // Always encode from the original, never from a previously compressed derivative.
  let bytes;
  const cached=path.join(originalCache,hash+'.original');
  if(!process.argv.includes('--refresh'))bytes=await fs.readFile(cached).catch(()=>null);
  if(!bytes){const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`Photo download failed: ${response.status}`);bytes=Buffer.from(await response.arrayBuffer());await fs.writeFile(cached,bytes);}
  // Sharp discards metadata by default: no HDR gain maps, XMP or MPF survive.
  // Auto-orient before stripping EXIF so portrait photos remain upright.
  await fs.mkdir(path.dirname(path.join(root,'dist',asset)),{recursive:true});
  const variants={};
  for(const [size,profile] of Object.entries(PHOTO_PROFILES)){
   const target=size==='large'?asset:asset.replace('.webp','-'+size+'.webp');let output;
   for(const quality of [profile.quality,profile.quality-6,profile.quality-12]){output=await sharp(bytes).rotate().resize({width:profile.width,height:profile.width,fit:'inside',withoutEnlargement:true}).toColourspace('srgb').webp({quality,effort:5}).toBuffer();if(output.length<=profile.maxBytes)break;}
   if(output.length>profile.maxBytes)throw Error('Photo exceeds byte budget: '+url);
   await fs.writeFile(path.join(root,'dist',target),output);variants[size]=target;
  }
  sources[url]=variants;
 }
}
await Promise.all([worker(),worker(),worker()]);
await fs.writeFile(path.join(root,'content/property-image-sources.json'),JSON.stringify(sources,null,2)+'\n');
await fs.writeFile(path.join(root,'dist/property-image-manifest.mjs'),'// Checked-in, verified SDR photos. New sources always use the validating gateway.\nexport const sources='+JSON.stringify(sources,null,2)+';\n');
const retained=new Set(Object.values(sources).flatMap(Object.values));
for(const asset of oldAssets){if(retained.has(asset))continue;const target=path.resolve(root,'dist',asset),folder=path.resolve(root,'dist/assets/property-sdr')+path.sep;if(!target.startsWith(folder)||!/^assets\/property-sdr\/[a-z0-9-]+\.webp$/.test(asset))throw Error('Unsafe stale asset path');await fs.unlink(target).catch(error=>{if(error.code!=='ENOENT')throw error;});}
console.log(`Prepared ${entries.length} SDR property photos.`);

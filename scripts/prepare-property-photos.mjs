// Regenerate checked-in SDR derivatives without changing the source inventory.
// Add original HTTPS URLs and their assets/property-sdr/*.webp paths to the manifest.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root=path.resolve(import.meta.dirname,'..');
const sources=JSON.parse(await fs.readFile(path.join(root,'content/property-image-sources.json'),'utf8'));
const entries=Object.entries(sources);let next=0;
async function worker(){
 while(next<entries.length){
  const [url,asset]=entries[next++];
  if(!url.startsWith('https://')||!/^assets\/property-sdr\/[a-z0-9-]+\.webp$/.test(asset))throw Error('Invalid photo manifest entry');
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`Photo download failed: ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  // Sharp discards metadata by default: no HDR gain maps, XMP or MPF survive.
  // Auto-orient before stripping EXIF so portrait photos remain upright.
  const output=await sharp(bytes).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).toColourspace('srgb').webp({quality:86,effort:5}).toBuffer();
  await fs.mkdir(path.dirname(path.join(root,'dist',asset)),{recursive:true});
  await fs.writeFile(path.join(root,'dist',asset),output);
 }
}
await Promise.all([worker(),worker(),worker()]);
await fs.writeFile(path.join(root,'dist/property-image-sources.mjs'),'// SDR derivatives: original listing photos, orientation preserved, HDR gain maps removed.\nconst sources='+JSON.stringify(sources,null,2)+';\nexport function propertyImageSource(value){return sources[value]||value;}\n');
console.log(`Prepared ${entries.length} SDR property photos.`);

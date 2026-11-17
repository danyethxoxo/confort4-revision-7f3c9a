import assert from 'node:assert/strict';
import fs from 'node:fs';
import {propertyImageSource} from '../dist/property-image-sources.mjs';
import {safeURL,propertyCard} from '../dist/ui.mjs';
const sources=JSON.parse(fs.readFileSync(new URL('../content/property-image-sources.json',import.meta.url)));
assert.equal(Object.keys(sources).length,38);
for(const [original,asset] of Object.entries(sources)){
 assert.equal(propertyImageSource(original),asset);
 assert.equal(safeURL(original),asset);
 const data=fs.readFileSync(new URL('../dist/'+asset,import.meta.url));
 assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');
 for(let offset=12;offset+8<=data.length;){const chunk=data.toString('ascii',offset,offset+4);assert.ok(!['EXIF','XMP ','ICCP'].includes(chunk),'No inherited HDR or color metadata');const size=data.readUInt32LE(offset+4);offset+=8+size+(size%2);}
 assert.ok(data.length<1200000,'Web-sized derivative');
}
const original=Object.keys(sources)[0];assert.ok(propertyCard({id:'test',imagenes:[original],titulo:'Test'}).includes('src="'+sources[original]+'"'));
assert.equal(propertyImageSource('https://example.com/other.jpg'),'https://example.com/other.jpg');
console.log('SDR property photos: 38 files, metadata and render mapping passed.');

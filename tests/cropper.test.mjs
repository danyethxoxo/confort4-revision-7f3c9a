import assert from 'node:assert/strict';
import {cropRectangle,cropOutputSize,imagePreset} from '../dist/image-cropper.mjs';
for(const [width,height] of [[4000,3000],[800,2000],[500,500]])for(const ratio of [16/9,3/2,1,4/5,3/4])for(const zoom of [1,2,5])for(const [cx,cy]of [[0,0],[.5,.5],[1,1],[-1,2]]){
 const r=cropRectangle(width,height,ratio,zoom,cx,cy);
 assert(r.x>=0&&r.y>=0);assert(r.x+r.width<=width+.00001);assert(r.y+r.height<=height+.00001);
 assert(Math.abs(r.width/r.height-ratio)<.00001,'Aspect ratio is exact');
 const out=cropOutputSize(r);assert(out.width<=1800&&out.height<=1800);assert(out.width<=r.width+1&&out.height<=r.height+1,'No enlargement of a small source');
}
assert.throws(()=>cropRectangle(0,10,1));assert.throws(()=>cropRectangle(10,10,NaN));
assert.equal(imagePreset('home.photo').ratio,16/9);
assert.equal(imagePreset('clients.items.0.photo').ratio,4/5);
assert.equal(imagePreset('team.gallery.0.photo').ratio,3/4);
assert.equal(imagePreset('team.nationalAward.photos.0.photo').ratio,3/4);
assert.equal(imagePreset('team.cover').ratio,3/2);
assert.equal(imagePreset('living.photos.0.photo').ratio,2/3);
console.log('PASS: crop bounds, zoom, panning, exact aspect ratios, output limits and module presets.');

import {PHOTO_PROFILES,PHOTO_VERSION,originalPhotoURL} from './photo-policy.mjs';
export {PHOTO_PROFILES,PHOTO_VERSION,originalPhotoURL};
export function validateSDR(bytes,profile){
 const text=(start,end)=>String.fromCharCode(...bytes.subarray(start,end));
 if(bytes.length<20||bytes.length>profile.maxBytes||text(0,4)!=='RIFF'||text(8,12)!=='WEBP')throw Error('unsafe_photo');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(view.getUint32(4,true)+8!==bytes.length)throw Error('unsafe_photo');
 let width=0,height=0,imageChunks=0,canvasWidth=0,canvasHeight=0;
 for(let offset=12;offset<bytes.length;){
  if(offset+8>bytes.length)throw Error('unsafe_photo');
  const chunk=text(offset,offset+4),length=view.getUint32(offset+4,true),start=offset+8,end=start+length;
  // Only static 8-bit WebP pixels and alpha: no profiles, EXIF, XMP, animation or unknown extensions.
  if(!['VP8 ','VP8L','VP8X','ALPH'].includes(chunk)||end>bytes.length)throw Error('unsafe_photo');
  if(chunk==='VP8 '){
   if(length<10||text(start+3,start+6)!=='\x9d\x01\x2a')throw Error('unsafe_photo');
   width=view.getUint16(start+6,true)&16383;height=view.getUint16(start+8,true)&16383;imageChunks++;
  }else if(chunk==='VP8L'){
   if(length<5||bytes[start]!==47)throw Error('unsafe_photo');
   const bits=view.getUint32(start+1,true);width=(bits&16383)+1;height=((bits>>>14)&16383)+1;imageChunks++;
  }else if(chunk==='VP8X'){
   if(length!==10||(bytes[start]&~16)!==0)throw Error('unsafe_photo');
   canvasWidth=1+bytes[start+4]+(bytes[start+5]<<8)+(bytes[start+6]<<16);
   canvasHeight=1+bytes[start+7]+(bytes[start+8]<<8)+(bytes[start+9]<<16);
   if(canvasWidth>profile.width||canvasHeight>profile.width)throw Error('unsafe_photo');
  }
  offset=end+(length%2);if(offset>bytes.length)throw Error('unsafe_photo');
 }
 if(imageChunks!==1||!width||!height||width>profile.width||height>profile.width)throw Error('unsafe_photo');
 if(canvasWidth&&(canvasWidth!==width||canvasHeight!==height))throw Error('unsafe_photo');
 return {width,height,bytes:bytes.length};
}
export async function readLimited(response,limit){
 if(Number(response.headers.get('content-length'))>limit){await response.body?.cancel();throw Error('photo_too_large');}
 const reader=response.body?.getReader();if(!reader)throw Error('unsafe_photo');
 const parts=[];let length=0;while(true){const item=await reader.read();if(item.done)break;length+=item.value.length;if(length>limit){await reader.cancel();throw Error('photo_too_large');}parts.push(item.value);}
 const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return bytes;
}
export async function convertPhoto(original,size,fetcher=fetch){
 const profile=PHOTO_PROFILES[size];if(!originalPhotoURL(original)||!profile)throw Error('invalid_photo');
 for(const quality of [profile.quality,50,35]){
  const url=new URL('https://wsrv.nl/');url.search=new URLSearchParams({url:original,w:String(profile.width),h:String(profile.width),fit:'inside',we:'',output:'webp',q:String(quality),maxage:'1y'});
  try{
   const response=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(20000)});
   if(!response.ok||!response.headers.get('content-type')?.startsWith('image/webp'))throw Error('conversion_failed');
   const bytes=await readLimited(response,profile.maxBytes);validateSDR(bytes,profile);return bytes;
  }catch(error){if(quality===35)throw error;}
 }
 throw Error('conversion_failed');
}

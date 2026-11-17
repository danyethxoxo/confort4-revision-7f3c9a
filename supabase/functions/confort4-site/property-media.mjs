export function propertyPhotos(payload){
 const data=payload?.data||{},items=Array.isArray(data.Property_Photos)?data.Property_Photos.filter(p=>p&&typeof p==='object'):[];
 const order=p=>Number.isFinite(Number(p.Photo_Order))?Number(p.Photo_Order):9999;
 const photos=items.sort((a,b)=>order(a)-order(b)).map(p=>p.Photo_URL);
 const principal=data.Property_Data?.[0]?.Photo_URL;if(principal&&!photos.includes(principal))photos.unshift(principal);
 return [...new Set(photos.map(value=>{try{const url=new URL(value);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return null;url.protocol='https:';return url.href;}catch{return null;}}).filter(Boolean))];
}
export async function ensurePropertyMedia(rpc,user,id,force=false){
 if(typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id))throw Error('invalid_property_reference');
 const source=await rpc('confort4_property_media',{p_user:user,p_id:id});
 if(source.fresh&&!force)return source.images;
 if(source.source!=='kwmexico')return source.images;
 if(!/^\d{1,12}$/.test(source.source_id))throw Error('gallery_unavailable');
 try{
  const response=await fetch('https://www.kwmexico.mx/api/properties/'+source.source_id,{headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('gallery_unavailable');
  const images=propertyPhotos(await response.json());if(!images.length)throw Error('gallery_unavailable');
  await rpc('confort4_property_media',{p_user:user,p_id:id,p_source_id:source.source_id,p_images:images});
  return images;
 }catch(error){if(source.images?.length>1)return source.images;throw Error('gallery_unavailable');}
}

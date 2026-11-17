import {PHOTO_PROFILES,PHOTO_VERSION,originalPhotoURL,convertPhoto} from './media.mjs';
const base=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',bucket='confort4-property-sdr';
const headers={'Access-Control-Allow-Origin':'*','Cross-Origin-Resource-Policy':'cross-origin','X-Content-Type-Options':'nosniff'};
const placeholder='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#f1f1f1"/><path d="m320 310 80-70 80 70v90H320Z" fill="none" stroke="#aaa" stroke-width="4"/></svg>';
const unavailable=(status=200)=>new Response(placeholder,{status,headers:{...headers,'Content-Type':'image/svg+xml','Cache-Control':'public,max-age=60'}});
async function digest(value:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
const authorized={apikey:key,Authorization:'Bearer '+key};
export async function handle(req:Request){
 if(!['GET','HEAD'].includes(req.method))return unavailable(405);
 try{
  const url=new URL(req.url),original=originalPhotoURL(url.searchParams.get('url')),size=url.searchParams.get('size')||'card';
  if(!original||!Object.hasOwn(PHOTO_PROFILES,size))return unavailable(400);
  const path=PHOTO_VERSION+'/'+size+'/'+await digest(original)+'.webp',location=base+'/storage/v1/object/public/'+bucket+'/'+path;
  const cached=await fetch(location,{method:'HEAD',signal:AbortSignal.timeout(5000)});
  if(!cached.ok){
   const address=(req.headers.get('x-forwarded-for')||req.headers.get('x-real-ip')||'unknown').split(',').at(-1)?.trim()||'unknown';
   const rate=await fetch(base+'/rest/v1/rpc/confort4_rate_gate',{method:'POST',headers:{...authorized,'Content-Type':'application/json'},body:JSON.stringify({p_scope:'photo-miss',p_subject:await digest(key+':'+address),p_limit:120,p_seconds:60}),signal:AbortSignal.timeout(5000)});
   if(!rate.ok||await rate.json()!==true)return unavailable(429);
   const bytes=await convertPhoto(original,size);
   const saved=await fetch(base+'/storage/v1/object/'+bucket+'/'+path,{method:'POST',headers:{...authorized,'Content-Type':'image/webp','Cache-Control':'max-age=31536000','x-upsert':'false'},body:bytes,signal:AbortSignal.timeout(10000)});
   if(!saved.ok){
    // A concurrent conversion may have populated the exact same immutable key.
    const exists=await fetch(location,{method:'HEAD',signal:AbortSignal.timeout(5000)});if(!exists.ok)return unavailable();
   }
  }
  return new Response(null,{status:302,headers:{...headers,Location:location,'Cache-Control':'public,max-age=31536000'}});
 }catch{return unavailable();} // Never redirect to, embed or expose original pixels as a fallback.
}
Deno.serve(handle);

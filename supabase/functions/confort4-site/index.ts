import {validateContent} from './content-validation.mjs';
const env=(name:string)=>Deno.env.get(name)||'';
const base=env('SUPABASE_URL'),key=env('SUPABASE_SERVICE_ROLE_KEY')||env('SERVICE_ROLE_KEY');
const headers={'Access-Control-Allow-Origin':'https://danyethxoxo.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
const response=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const slowDown=()=>new Response(JSON.stringify({error:'Demasiadas solicitudes. Espera un momento e intenta de nuevo.'}),{status:429,headers:{...headers,'Retry-After':'60'}});
async function digest(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key+':'+value));return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function rate(scope:string,subject:string,limit:number,seconds=60){return rpc('confort4_rate_gate',{p_scope:scope,p_subject:await digest(subject),p_limit:limit,p_seconds:seconds});}
async function rpc(name:string,args:unknown={}){const r=await fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(15000)});const data=await r.json().catch(()=>null);if(!r.ok)throw Error(data?.message||'database_unavailable');return data;}
export async function handle(req:Request){
 if(req.headers.get('origin')!=='https://danyethxoxo.github.io')return response({error:'Origen no permitido.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return response({error:'Método no permitido.'},405);
 try{
  const address=(req.headers.get('x-forwarded-for')||req.headers.get('x-real-ip')||'unknown').split(',').at(-1)?.trim()||'unknown';
  if(!await rate('requests',address,180))return slowDown();
  const reader=req.body?.getReader();if(!reader)return response({error:'Falta la solicitud.'},400);
  const parts:Uint8Array[]=[];let size=0;while(true){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>4500000){await reader.cancel();return response({error:'Archivo o contenido demasiado grande.'},413);}parts.push(item.value);}
  const buffer=new Uint8Array(size);let offset=0;for(const part of parts){buffer.set(part,offset);offset+=part.length;}
  let body;try{body=JSON.parse(new TextDecoder().decode(buffer));}catch{return response({error:'Solicitud inválida.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.action!=='string')return response({error:'Solicitud inválida.'},400);
  if(!['public','login','bootstrap','save','publish','restore','submissions','followup','moderate','inventory','select_property','settings','upload','history'].includes(body.action))return response({error:'Acción no permitida.'},400);
  if(body.action==='login'){
   const username=String(body.args?.username||'').trim().toLowerCase(),password=body.args?.password;
   if(!await rate('login-ip',address,20,900)||!await rate('login-account',username,10,900))return slowDown();
   if(!/^[a-z][a-z0-9_]{2,31}$/.test(username)||typeof password!=='string'||password.length>256)return response({error:'No pudimos validar tu acceso. Revisa los datos e intenta de nuevo.'},401);
   const email=await rpc('confort4_username_email',{p_username:username});
   if(!email)return response({error:'No pudimos validar tu acceso. Revisa los datos e intenta de nuevo.'},401);
   const result=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(15000)});
   const data=await result.json().catch(()=>null);
   if(!result.ok||!data?.user?.id||!await rpc('confort4_actor_role',{p_user:data.user.id}))return response({error:'No pudimos validar tu acceso. Revisa los datos e intenta de nuevo.'},401);
   return response({...data,editor_username:username});
  }
  if(body.action==='public')return response(await rpc('confort4_public_site'));
  const auth=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:req.headers.get('authorization')||''},signal:AbortSignal.timeout(10000)});
  if(!auth.ok)return response({error:'Inicia sesión para continuar.'},401);
  const user=await auth.json();if(!user.id)return response({error:'Inicia sesión para continuar.'},401);
  if(!await rpc('confort4_actor_role',{p_user:user.id}))return response({error:'Tu cuenta no tiene acceso a Confort4.'},403);
  if(!await rate(body.action==='upload'?'uploads':'editor',user.id,body.action==='upload'?10:60))return slowDown();
  if(body.action==='history'){
   if(body.args?.id&&(!/^[a-f0-9-]{36}$/i.test(body.args.id)||typeof body.args.cancelled!=='boolean'))return response({error:'Indica una propiedad y si la operación fue cancelada.'},400);
   return response(await rpc('confort4_history_admin',{p_user:user.id,p_id:body.args?.id||null,p_cancelled:body.args?.cancelled??null}));
  }
  if(body.action==='save'){try{validateContent(body.args?.content);}catch(e){return response({error:(e as Error).message},400);}}
  if(body.action==='upload'){
   await rpc('confort4_admin',{p_user:user.id,p_action:'bootstrap',p_args:{}});
   const mime=body.args?.mime,data=body.args?.data;
   if(!['image/jpeg','image/png','image/webp'].includes(mime)||typeof data!=='string')return response({error:'Usa JPG, PNG o WebP.'},400);
   let bytes;try{bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));}catch{return response({error:'Archivo inválido.'},400);}
   const valid=(mime==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)||(mime==='image/png'&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)||(mime==='image/webp'&&new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP');
   if(!valid||bytes.length>3000000)return response({error:'Imagen inválida o mayor a 3 MB.'},400);
   const file=crypto.randomUUID()+'.'+({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[mime]);
   const result=await fetch(base+'/storage/v1/object/confort4-media/'+file,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':mime},body:bytes});
   if(!result.ok)throw Error('upload_failed');
   return response({url:base+'/storage/v1/object/public/confort4-media/'+file});
  }
  const data=await rpc('confort4_admin',{p_user:user.id,p_action:body.action,p_args:body.args||{}});
  return response(data);
 }catch(error){
  const code=(error as Error).message;
  if(code.includes('not_a_member')||code.includes('admin_required'))return response({error:'Tu cuenta no tiene acceso a esta acción de Confort4.'},403);
  if(code.includes('version_conflict'))return response({error:'Hay cambios más recientes. Recarga el panel antes de guardar.'},409);
  if(code.includes('publication_consent_required'))return response({error:'Esta reseña no autoriza publicación.'},400);
  if(code.includes('external_selection_limit'))return response({error:'Puedes seleccionar hasta 10 propiedades externas de KW. Retira una selección para añadir otra. Las propiedades del equipo no cuentan para este límite.'},400);
  console.error('confort4-site: operation failed');return response({error:'No se pudo completar la operación. Intenta de nuevo.'},503);
 }
}
Deno.serve(handle);

import {validatePrivacy} from './privacy-model.mjs';
import {validateHeader} from './header-model.mjs';
export const moduleTypes=['statement','properties','reviews','clients','process','metrics','living','faq','transactions','journal'];
export function validateContent(data){
 if(!data||typeof data!=='object'||!data.team||!Array.isArray(data.services)||!data.home||!Array.isArray(data.posts)||!Array.isArray(data.faq))throw Error('Faltan secciones de contenido.');
 if(JSON.stringify(data).length>440000)throw Error('El contenido es demasiado grande.');
 function walk(value,depth=0,key=''){
  if(['visible','published'].includes(key)&&typeof value!=='boolean')throw Error('Revisa la visibilidad del contenido.');
  if(depth>12)throw Error('Estructura demasiado profunda.');
  if(key.endsWith('Href')&&typeof value!=='string')throw Error('El destino de un botón debe ser texto.');
  if(typeof value==='string'){
   if(value.length>18000)throw Error('Un texto supera el límite.');
   if(['photo','image','cover','contact','url'].includes(key)&&value&&!/^(https:\/\/|assets\/)[^\s<>"']+$/i.test(value))throw Error('Usa una URL HTTPS válida o un recurso de assets/.');
   if(key.endsWith('Href')&&value&&!/^(?:https:\/\/[^\s<>"'\\]+|[a-z0-9-]+\.html(?:[?#][^\s<>"'\\]*)?|#[a-z][\w-]*)$/i.test(value))throw Error('El destino del botón debe ser HTTPS o una página interna.');
  }else if(Array.isArray(value)){if(value.length>100)throw Error('Demasiados elementos.');value.forEach(v=>walk(v,depth+1,key));}
  else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Campo no permitido.');walk(v,depth+1,k);}
 }
 walk(data);
 validateHeader(data.header);
 validatePrivacy(data.privacy);
 const string=(value,label)=>{if(typeof value!=='string'||!value.trim())throw Error('Completa '+label+'.');};
 const list=(value,label)=>{if(!Array.isArray(value))throw Error('Revisa '+label+'.');};
 string(data.home.title,'el título de inicio');string(data.home.intro,'la presentación');string(data.home.photo,'la imagen principal');
 string(data.team.title,'el título del equipo');string(data.team.intro,'la presentación del equipo');list(data.team.paragraphs,'la historia del equipo');list(data.team.members,'los integrantes');
 for(const person of data.team.members){string(person.id,'el identificador del integrante');string(person.name,'el nombre');string(person.photo,'la fotografía');string(person.contact,'el contacto');}
 list(data.process,'el proceso');if(data.process.length!==3)throw Error('El proceso debe conservar tres etapas.');
 for(const step of data.process){string(step.title,'el título de etapa');string(step.text,'el texto de etapa');list(step.items,'los puntos de etapa');}
 if(!data.checklists||!['venta','visita','renta'].every(k=>Array.isArray(data.checklists[k])&&data.checklists[k].length>0))throw Error('Conserva los tres checklists.');
 for(const question of data.faq){string(question.question,'la pregunta');string(question.answer,'la respuesta');string(question.category,'la categoría');}
 for(const service of data.services){if(!['vender','comprar','rentar'].includes(service.id))throw Error('Servicio desconocido.');for(const k of ['title','shortTitle','intro','image','cta','closing'])string(service[k],'el campo '+k+' de '+service.id);list(service.sections,'las secciones del servicio');for(const section of service.sections){string(section.title,'el título de sección');string(section.text,'el contenido de sección');}if(service.id==='rentar'){list(service.audiences,'los públicos de renta');for(const audience of service.audiences){string(audience.id,'el identificador del público');string(audience.title,'el título del público');list(audience.items,'los puntos de renta');}}}
 if(data.services.length!==3||!['vender','comprar','rentar'].every(id=>data.services.some(s=>s.id===id)))throw Error('Conserva los tres servicios.');
 if(!Array.isArray(data.home.modules)||!data.home.modules.every(m=>(m==='tool'||moduleTypes.includes(m)))||new Set(data.home.modules).size!==data.home.modules.length)throw Error('Revisa los módulos de inicio.');
 if(data.home.hiddenModules&&(!Array.isArray(data.home.hiddenModules)||!data.home.hiddenModules.every(id=>moduleTypes.includes(id))))throw Error('Revisa la visibilidad de los módulos.');
 if((data.team.gallery||[]).length>8)throw Error('Galería de fotos 1 admite un máximo de 8 fotografías.');
 if((data.team.nationalAward?.photos||[]).length>2)throw Error('Galería de fotos 2 admite un máximo de 2 fotografías.');
 if(data.team.hiddenSections&&(!Array.isArray(data.team.hiddenSections)||!data.team.hiddenSections.every(id=>['cover','approach','photos','cappers','national'].includes(id))))throw Error('Revisa los módulos del equipo.');
 for(const photo of [...(data.team.gallery||[]),...(data.team.nationalAward?.photos||[])]){string(photo.photo,'la fotografía del equipo');}
 if(data.metrics){list(data.metrics.items,'las cifras');if(data.metrics.items.length>8)throw Error('Conserva hasta 8 cifras.');for(const item of data.metrics.items){string(item.label,'el nombre de la cifra');if(!['manual','properties','team','services','locations'].includes(item.source)||!Number.isFinite(item.value)||item.value<0||item.value>1000000)throw Error('Revisa el número y origen de las cifras.');}}
 if(data.living){list(data.living.photos,'las imágenes de Un espacio para vivir');if(data.living.photos.length!==7)throw Error('Conserva las siete imágenes de la composición.');for(const photo of data.living.photos)string(photo.photo,'la fotografía de la composición');}
 const slugs=new Set();for(const post of data.posts){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)||slugs.has(post.slug))throw Error('Slug de artículo inválido o repetido.');slugs.add(post.slug);if(!post.title||!Array.isArray(post.sections)||!Array.isArray(post.summary))throw Error('Revisa el artículo.');if(post.checklist&&!['venta','visita','renta'].includes(post.checklist))throw Error('Checklist de artículo inválido.');if(post.published){for(const key of ['title','excerpt','cover','author','updated'])string(post[key],'el campo '+key+' del artículo');if(!post.sections.length)throw Error('Completa el artículo antes de hacerlo visible.');for(const section of post.sections){string(section.title,'el título de la sección');string(section.text,'el contenido del artículo');}}}
 for(const service of data.services){
  if(service.visibility)for(const value of Object.values(service.visibility))if(typeof value!=='boolean')throw Error('Revisa la visibilidad de los módulos del servicio.');
  if(service.process){if(service.process.length!==3)throw Error('Conserva las tres fases del servicio.');for(const step of service.process){string(step.title,'el título de la fase');string(step.text,'el texto de la fase');string(step.image,'la foto de la fase');list(step.items,'los puntos de la fase');}}
  if(service.comparison){list(service.comparison.rows,'las filas de la tabla');if(service.comparison.rows.length>20)throw Error('La tabla admite hasta 20 filas.');for(const row of service.comparison.rows){if(!Array.isArray(row)||row.length!==3||row.some(cell=>typeof cell!=='string'))throw Error('Cada fila de la tabla debe tener tres textos.');}}
  if(service.faq){list(service.faq,'las preguntas del servicio');for(const question of service.faq){string(question.question,'la pregunta');string(question.answer,'la respuesta');}}
 }
 if(data.reviewPage)for(const key of ['title','intro','formTitle','nameLabel','emailLabel','interestLabel','ratingLabel','messageLabel','buttonLabel'])string(data.reviewPage[key],'el texto '+key+' de reseñas');
 if(data.blogPage){string(data.blogPage.title,'el título del blog');string(data.blogPage.intro,'la presentación del blog');}
 if(data.clients){
  list(data.clients.items,'las fotografías de clientes');if(data.clients.items.length>20)throw Error('Nuestros clientes admite hasta 20 fotos.');
  for(const item of data.clients.items){
   string(item.photo,'la fotografía de clientes');
   if(item.blurFaces!==undefined&&typeof item.blurFaces!=='boolean')throw Error('El desenfoque debe estar activado o desactivado.');
   if(item.quote&&item.quoteVerified!==true)throw Error('Solo publica comentarios reales verificados de clientes.');
  }
 }
 if(data.transactions){
  list(data.transactions.items,'el historial de operaciones');
  for(const item of data.transactions.items){
   if(!['vendida','rentada'].includes(item.status))throw Error('La operación debe estar vendida o rentada.');
   string(item.title,'el título de la operación');string(item.photo,'la fotografía de la operación');
   if(item.date&&!/^\d{4}-\d{2}-\d{2}$/.test(item.date))throw Error('Usa una fecha de operación válida.');
   if(item.date&&(!Number.isFinite(Date.parse(item.date))||new Date(item.date).toISOString().slice(0,10)!==item.date))throw Error('Usa una fecha de operación válida.');
  }
 }
 return data;
}

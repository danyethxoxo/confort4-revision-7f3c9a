import {motionTiming} from './motion-rules.mjs';
import {bindSwipe} from './swipe.mjs?v=20261117gallery';
import {savePhotoData,galleryImageURL} from './photo-policy.mjs?v=20261117sharp';

export function initializePropertySlideshow(root,choose,options={}){
 const stage=root.querySelector('.property-photo-stage'),image=root.querySelector('#gallery-main'),thumbs=[...root.querySelectorAll('[data-gallery]')];
 if(!stage||!image||thumbs.length<2)return null;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),duration=options.duration||10000;
 const zoomFrame=document.createElement('div');zoomFrame.className='property-photo-zoom';image.replaceWith(zoomFrame);zoomFrame.append(image);
 const controls=document.createElement('div');controls.className='property-slideshow-controls';
 controls.innerHTML='<span data-photo-count></span><button type="button" data-photo-prev aria-label="Foto anterior">&#8592;</button><button type="button" data-photo-next aria-label="Foto siguiente">&#8594;</button><button type="button" data-photo-pause aria-label="Pausar fotos">Pausar</button>';
 const progress=document.createElement('div');progress.className='featured-progress property-photo-progress';progress.setAttribute('aria-hidden','true');progress.innerHTML='<span></span>';stage.append(controls,progress);
 let timer,animation,zoom,inView=!window.IntersectionObserver,paused=savePhotoData(),viewerOpen=false,destroyed=false,revision=0,changing=false,internalChoice=false,outgoingNode=null,transitions=[];
 const failed=new Set();let nextImage=null,preloadTimer;
 function preloadNext(){
  clearTimeout(preloadTimer);
  if(!image.complete||!image.naturalWidth||savePhotoData())return;
  // Let the visible cover finish before spending bandwidth on the next slide.
  preloadTimer=setTimeout(()=>{
   if(destroyed||paused||!inView||document.hidden)return;
   const thumb=thumbs[(current()+1)%thumbs.length],url=galleryImageURL(thumb);
   if(nextImage?.src===url)return;
   nextImage=new Image();nextImage.decoding='async';nextImage.fetchPriority='low';
   if(thumb.dataset.gallerySet){nextImage.srcset=thumb.dataset.gallerySet;nextImage.sizes='100vw';}
   nextImage.src=url;
  },500);
 }
 image.addEventListener('load',preloadNext);
 const current=()=>Math.max(0,thumbs.findIndex(t=>t.getAttribute('aria-pressed')==='true'));
 function lock(value){controls.querySelectorAll('[data-photo-prev],[data-photo-next]').forEach(b=>b.disabled=value);}
 function stop(){clearTimeout(timer);animation?.cancel();if(zoom){image.style.transform=getComputedStyle(image).transform;zoom.cancel();}animation=null;zoom=null;}
 function cancelTransition(){transitions.forEach(a=>a.cancel());transitions=[];outgoingNode?.remove();outgoingNode=null;changing=false;lock(false);}
 function reset(){
  if(!internalChoice){++revision;cancelTransition();}
  stop();controls.querySelector('[data-photo-count]').textContent=(current()+1)+' / '+thumbs.length;
  const toggle=controls.querySelector('[data-photo-pause]');toggle.textContent=paused?'Reanudar':'Pausar';toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Reanudar fotos':'Pausar fotos');
  if(destroyed||paused||viewerOpen||!inView||reduced.matches||document.hidden)return;
  animation=progress.firstElementChild.animate?.([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration,easing:'linear',fill:'both'});
  zoom=image.animate?.([{transform:'scale(1)'},{transform:'scale(1.04)'}],{duration,easing:'linear',fill:'both'});
  preloadNext();
  timer=setTimeout(()=>advance(1),duration);
 }
 async function advance(step){
  if(changing||destroyed)return;changing=true;lock(true);stop();const request=++revision;let index=current();
  try{for(let attempt=0;attempt<thumbs.length;attempt++){
   index=(index+step+thumbs.length)%thumbs.length;if(failed.has(index))continue;
   const url=galleryImageURL(thumbs[index]);
   try{await new Promise((resolve,reject)=>{const img=new Image(),timeout=setTimeout(()=>done(false),12000);function done(ok){clearTimeout(timeout);img.onload=img.onerror=null;ok?resolve():reject(Error('Foto no disponible'));}img.decoding='async';img.onload=()=>img.decode?img.decode().catch(()=>{}).then(()=>done(true)):done(true);img.onerror=()=>done(false);img.src=url;});}
   catch{failed.add(index);continue;}
   if(destroyed||request!==revision)return;
   const old=zoomFrame.cloneNode(true);old.querySelector('img').removeAttribute('id');old.querySelector('img').alt='';old.className='property-photo-outgoing';old.setAttribute('aria-hidden','true');
   internalChoice=true;try{choose(index);}finally{internalChoice=false;}
   if(!reduced.matches&&image.animate){
    outgoingNode=old;zoomFrame.after(old);
    transitions=[old.animate([{transform:'translateX(0)'},{transform:'translateX('+(-step*100)+'%)'}],{duration:motionTiming.slide,easing:'cubic-bezier(.45,0,.15,1)',fill:'both'}),zoomFrame.animate([{transform:'translateX('+(step*100)+'%)'},{transform:'translateX(0)'}],{duration:motionTiming.slide,easing:'cubic-bezier(.45,0,.15,1)',fill:'both'})];
    await Promise.allSettled(transitions.map(a=>a.finished));
    if(request===revision)cancelTransition();else old.remove();
   }
   return;
  }}finally{if(request===revision){changing=false;lock(false);}}
 }
 controls.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-photo-pause')){paused=!paused;button.textContent=paused?'Reanudar':'Pausar';button.setAttribute('aria-label',paused?'Reanudar fotos':'Pausar fotos');button.setAttribute('aria-pressed',String(paused));reset();}
  else advance(button.hasAttribute('data-photo-prev')?-1:1);
 });
 const cleanupSwipe=bindSwipe(stage,direction=>advance(direction));
 const visibility=()=>reset(),preference=()=>reset();document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',preference);
 const observer=window.IntersectionObserver?new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;reset();}):null;observer?.observe(stage);reset();
 return {reset,setViewer(open){viewerOpen=open;reset();},destroy(){destroyed=true;++revision;stop();clearTimeout(preloadTimer);image.removeEventListener('load',preloadNext);cancelTransition();cleanupSwipe();observer?.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener?.('change',preference);nextImage=null;controls.remove();progress.remove();image.style.transform='';zoomFrame.replaceWith(image);}};
}

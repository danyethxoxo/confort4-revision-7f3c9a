import {motionTiming} from './motion-rules.mjs';

export function initializePropertySlideshow(root, choose, options={}) {
 const stage=root.querySelector('.property-photo-stage'),image=root.querySelector('#gallery-main'),thumbs=[...root.querySelectorAll('[data-gallery]')];
 if(!stage||!image||thumbs.length<2)return null;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),duration=options.duration||motionTiming.slideInterval;
 const controls=document.createElement('div');controls.className='property-slideshow-controls';
 controls.innerHTML='<span data-photo-count></span><button type="button" data-photo-prev aria-label="Foto anterior">&#8592;</button><button type="button" data-photo-next aria-label="Foto siguiente">&#8594;</button><button type="button" data-photo-pause aria-label="Pausar fotos">Pausar</button>';
 const progress=document.createElement('div');progress.className='featured-progress property-photo-progress';progress.setAttribute('aria-hidden','true');progress.innerHTML='<span></span>';stage.append(controls,progress);
 let timer,animation,inView=!window.IntersectionObserver,paused=false,viewerOpen=false,destroyed=false,revision=0;
 const failed=new Set();let nextImage=null;
 const current=()=>Math.max(0,thumbs.findIndex(t=>t.getAttribute('aria-pressed')==='true'));
 function stop(){clearTimeout(timer);animation?.cancel();animation=null;}
 function reset(){
  stop();controls.querySelector('[data-photo-count]').textContent=(current()+1)+' / '+thumbs.length;
  if(destroyed||paused||viewerOpen||!inView||reduced.matches||document.hidden)return;
  animation=progress.firstElementChild.animate?.([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration,easing:'linear',fill:'both'});
  nextImage=new Image();nextImage.decoding='async';nextImage.src=thumbs[(current()+1)%thumbs.length].dataset.gallery;
  timer=setTimeout(()=>advance(1),duration);
 }
 async function advance(step){
  stop();const request=++revision;let index=current();
  for(let attempt=0;attempt<thumbs.length;attempt++){
   index=(index+step+thumbs.length)%thumbs.length;
   if(failed.has(index))continue;
   const url=thumbs[index].dataset.gallery;
   try{
    await new Promise((resolve,reject)=>{const img=new Image(),timeout=setTimeout(()=>done(false),12000);function done(ok){clearTimeout(timeout);img.onload=img.onerror=null;ok?resolve():reject(new Error('Foto no disponible'));}img.decoding='async';img.onload=()=>img.decode?img.decode().catch(()=>{}).then(()=>done(true)):done(true);img.onerror=()=>done(false);img.src=url;});
    if(destroyed||request!==revision)return;
    const old=image.cloneNode();old.removeAttribute('id');old.alt='';old.className='property-photo-outgoing';old.setAttribute('aria-hidden','true');
    choose(index);
    if(!reduced.matches&&image.animate){
     image.after(old);
     const outgoing=old.animate([{transform:'translateX(0)'},{transform:'translateX('+(-step*100)+'%)'}],{duration:motionTiming.slide,easing:'cubic-bezier(.45,0,.15,1)'});
     image.animate([{transform:'translateX('+(step*100)+'%)'},{transform:'translateX(0)'}],{duration:motionTiming.slide,easing:'cubic-bezier(.45,0,.15,1)'});
     outgoing.finished.catch(()=>{}).finally(()=>old.remove());
    }
    return;
   }catch{failed.add(index);}
  }
 }
 controls.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-photo-pause')){paused=!paused;button.textContent=paused?'Reanudar':'Pausar';button.setAttribute('aria-label',paused?'Reanudar fotos':'Pausar fotos');button.setAttribute('aria-pressed',String(paused));reset();}
  else advance(button.hasAttribute('data-photo-prev')?-1:1);
 });
 const visibility=()=>reset(),preference=()=>reset();document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',preference);
 const observer=window.IntersectionObserver?new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;reset();}):null;observer?.observe(stage);reset();
 return {reset,setViewer(open){viewerOpen=open;reset();},destroy(){destroyed=true;++revision;stop();observer?.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener?.('change',preference);nextImage=null;controls.remove();progress.remove();}};
}

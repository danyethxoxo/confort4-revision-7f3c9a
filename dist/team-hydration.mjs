// Preserve photos/text that are already appearing when live editorial content
// arrives. Updated copy and replaced photographs still use the fresh content.
export function preserveTeamMotion(current,incoming){
 const oldHero=current.querySelector('.team-hero'),newHero=incoming.querySelector('.team-hero');
 const text=el=>(el.dataset.motionText||el.textContent).trim().replace(/\s+/g,' ');
 const copy=hero=>JSON.stringify([...hero.querySelectorAll('[data-team-key]:not([data-motion-image])')].map(text));
 const started=oldHero?.querySelector('[data-motion-image]')?.dataset.motionSeen||oldHero?.querySelector('h1')?.dataset.motionSeen;
 if(started&&oldHero&&newHero&&Boolean(oldHero.querySelector('img'))===Boolean(newHero.querySelector('img'))&&copy(oldHero)===copy(newHero)){
  const oldImage=oldHero.querySelector('img'),newImage=newHero.querySelector('img');
  if(oldImage&&newImage){
   oldImage.alt=newImage.alt;
   if(oldImage.getAttribute('src')!==newImage.getAttribute('src')){
    const preload=new oldImage.ownerDocument.defaultView.Image();
    preload.onload=()=>Promise.resolve(preload.decode?.()).catch(()=>{}).then(()=>{if(oldImage.isConnected)oldImage.src=preload.src;});
    preload.src=newImage.src;
   }
  }
  newHero.replaceWith(oldHero);
 }
 const previous=new Map([...current.querySelectorAll('[data-team-key]')].map(el=>[el.dataset.teamKey,el]));
 incoming.querySelectorAll('[data-team-key]').forEach(next=>{
  const old=previous.get(next.dataset.teamKey);if(!old||old===next)return;
  const oldImage=old.querySelector('img'),newImage=next.querySelector('img');
  if(oldImage&&newImage){if(oldImage.getAttribute('src')===newImage.getAttribute('src')){oldImage.alt=newImage.alt;next.replaceWith(old);}return;}
  if(!oldImage&&!newImage&&text(old)===text(next))next.replaceWith(old);
 });
}

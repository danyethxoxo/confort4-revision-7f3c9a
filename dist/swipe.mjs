// Native vertical scrolling stays with the browser; only deliberate horizontal
// touch/pen gestures request a carousel change. A swipe never becomes a click.
export function bindSwipe(element,move){
 if(!element||element.dataset.swipeReady)return ()=>{};
 element.dataset.swipeReady='true';let start=null,suppressClick=false;
 const events=new element.ownerDocument.defaultView.AbortController(),options={signal:events.signal};
 element.addEventListener('pointerdown',event=>{
  if(!['touch','pen'].includes(event.pointerType)||event.isPrimary===false)return;
  const button=event.target.closest('button,a,input,textarea,select');
  if(button&&!button.matches('.property-gallery-cover'))return;
  start={x:event.clientX,y:event.clientY,id:event.pointerId};suppressClick=false;
 },options);
 element.addEventListener('pointermove',event=>{if(!start||event.pointerId!==start.id)return;
  const x=event.clientX-start.x,y=event.clientY-start.y;if(Math.abs(x)>12&&Math.abs(x)>Math.abs(y)*1.25)suppressClick=true;
 },options);
 element.addEventListener('pointerup',event=>{if(!start||event.pointerId!==start.id)return;
  const x=event.clientX-start.x,y=event.clientY-start.y;start=null;
  if(Math.abs(x)>=45&&Math.abs(x)>Math.abs(y)*1.25){suppressClick=true;move(x<0?1:-1);}
  setTimeout(()=>{suppressClick=false;},400);
 },options);
 element.addEventListener('pointercancel',()=>{start=null;suppressClick=false;},options);
 element.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}},{...options,capture:true});
 return ()=>{events.abort();delete element.dataset.swipeReady;};
}

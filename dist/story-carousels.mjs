const initialized = new WeakSet();

export function initializeStoryCarousels(root) {
  root.querySelectorAll('[data-story-carousel]').forEach(section => {
    if (initialized.has(section)) return;
    initialized.add(section);
    const track = section.querySelector('[data-story-track]');
    const cards = [...track.children];
    const previous = section.querySelector('[data-story-direction="-1"]');
    const next = section.querySelector('[data-story-direction="1"]');
    const toggle = section.querySelector('[data-story-toggle]');
    const count = section.querySelector('[data-story-count]');
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const loop = section.hasAttribute('data-story-autoplay') && cards.length > 1;
    const events = new window.AbortController();
    let frame = null, motionFrame = null, lastTime = null, position = null, paused = false, dragging = false;
    let cardStep = 0;
    let inView = !window.IntersectionObserver, visibilityObserver, sizeObserver;
    if (loop) cards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.dataset.storyClone = 'true';clone.setAttribute('aria-hidden','true');clone.inert = true;
      clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      clone.querySelectorAll('[data-motion-image]').forEach(element => element.removeAttribute('data-motion-image'));
      clone.querySelectorAll('img').forEach(image => { image.alt = ''; });
      track.append(clone);
    });
    function step() { return cardStep; }
    function measure() { cardStep=cards[1]?cards[1].offsetLeft-cards[0].offsetLeft:track.clientWidth;position=null;update(); }
    function stop() { if(motionFrame!==null)window.cancelAnimationFrame(motionFrame);motionFrame=null;lastTime=null;position=null; }
    function destroy() { stop();events.abort();visibilityObserver?.disconnect();sizeObserver?.disconnect();if(frame!==null)window.cancelAnimationFrame(frame); }
    function arm() {
      stop();
      if (!section.isConnected) { destroy();return; }
      const focused = section.contains(document.activeElement) && document.activeElement !== toggle;
      const running = loop && !paused && !dragging && !focused && !document.hidden && inView && !preference.matches;
      count.setAttribute('aria-live',running ? 'off' : 'polite');
      if(running)motionFrame=window.requestAnimationFrame(advance);
    }
    function advance(now){
      motionFrame=null;
      if(!section.isConnected){destroy();return;}
      if(position===null)position=track.scrollLeft;
      if(lastTime!==null){
        const cycle=cardStep*cards.length;
        if(cycle>0){position=(position+Math.min(48,Math.max(0,now-lastTime))*0.035)%cycle;track.scrollLeft=position;update();}
      }
      lastTime=now;
      motionFrame=window.requestAnimationFrame(advance);
    }
    function update() {
      frame = null;
      const distance = step();
      if (loop && distance > 0 && track.scrollLeft >= distance * cards.length - 1) track.scrollTo({left:Math.max(0,track.scrollLeft - distance * cards.length),behavior:'instant'});
      const index = loop&&distance>0?Math.round(track.scrollLeft/distance)%cards.length:cards.reduce((nearest,card,i)=>Math.abs(card.offsetLeft-track.scrollLeft)<Math.abs(cards[nearest].offsetLeft-track.scrollLeft)?i:nearest,0);
      const lastVisible = loop?index:cards.reduce((last,card,i) => card.offsetLeft + card.offsetWidth <= track.scrollLeft + track.clientWidth + 2 ? i : last,index);
      previous.disabled = loop ? false : track.scrollLeft < 2;
      next.disabled = loop ? false : track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      const label=`${index+1}${!loop&&lastVisible>index?'–'+(lastVisible+1):''} / ${cards.length}`;if(count.textContent!==label)count.textContent=label;
    }
    function move(direction) {
      const distance = step();
      if (loop && direction < 0 && track.scrollLeft < 1) track.scrollTo({left:distance * cards.length,behavior:'instant'});
      track.scrollBy({left:direction * distance,behavior:preference.matches ? 'instant' : 'smooth'});
    }
    previous.addEventListener('click',() => { move(-1);arm(); });
    next.addEventListener('click',() => { move(1);arm(); });
    toggle?.addEventListener('click',() => { paused=!paused;toggle.textContent=paused?'Reanudar':'Pausar';toggle.setAttribute('aria-pressed',String(paused));arm(); });
    if(toggle)toggle.hidden=!loop||preference.matches;
    track.addEventListener('keydown',event => {
      if(event.target===track&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();move(event.key==='ArrowLeft'?-1:1);arm();}
    });
    track.addEventListener('scroll',()=>{if(motionFrame===null&&frame===null)frame=window.requestAnimationFrame(update);},{passive:true});
    section.addEventListener('pointerleave',() => { dragging=false;arm(); });
    section.addEventListener('pointerdown',() => { dragging=true;arm(); });
    section.addEventListener('pointerup',() => { dragging=false;arm(); });
    section.addEventListener('pointercancel',() => { dragging=false;arm(); });
    section.addEventListener('focusin',arm);
    section.addEventListener('focusout',() => window.queueMicrotask(arm));
    document.addEventListener('visibilitychange',arm,{signal:events.signal});
    preference.addEventListener?.('change',() => { if(toggle)toggle.hidden=!loop||preference.matches;arm(); },{signal:events.signal});
    if(window.IntersectionObserver){visibilityObserver=new window.IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting||false;arm();});visibilityObserver.observe(section);}
    if(window.ResizeObserver){sizeObserver=new window.ResizeObserver(()=>{if(section.isConnected)measure();else destroy();});sizeObserver.observe(track);}
    measure();arm();
  });
}

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
    let frame = null, timer = null, paused = false, hovered = false, dragging = false;
    let inView = !window.IntersectionObserver, visibilityObserver, sizeObserver;
    if (loop) cards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.dataset.storyClone = 'true';clone.setAttribute('aria-hidden','true');clone.inert = true;
      clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      clone.querySelectorAll('[data-motion-image]').forEach(element => element.removeAttribute('data-motion-image'));
      clone.querySelectorAll('img').forEach(image => { image.alt = ''; });
      track.append(clone);
    });
    function step() { return cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth; }
    function stop() { window.clearTimeout(timer);timer = null; }
    function destroy() { stop();events.abort();visibilityObserver?.disconnect();sizeObserver?.disconnect();if(frame!==null)window.cancelAnimationFrame(frame); }
    function arm() {
      stop();
      if (!section.isConnected) { destroy();return; }
      const focused = section.contains(document.activeElement) && document.activeElement !== toggle;
      const running = loop && !paused && !hovered && !dragging && !focused && !document.hidden && inView && !preference.matches;
      count.setAttribute('aria-live',running ? 'off' : 'polite');
      if (running) timer = window.setTimeout(() => { move(1);arm(); },6000);
    }
    function update() {
      frame = null;
      const distance = step();
      if (loop && distance > 0 && track.scrollLeft >= distance * cards.length - 1) track.scrollTo({left:Math.max(0,track.scrollLeft - distance * cards.length),behavior:'instant'});
      const index = cards.reduce((nearest,card,i) => Math.abs(card.offsetLeft - track.scrollLeft) < Math.abs(cards[nearest].offsetLeft - track.scrollLeft) ? i : nearest,0);
      const lastVisible = cards.reduce((last,card,i) => card.offsetLeft + card.offsetWidth <= track.scrollLeft + track.clientWidth + 2 ? i : last,index);
      previous.disabled = loop ? false : track.scrollLeft < 2;
      next.disabled = loop ? false : track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      count.textContent = `${index + 1}${!loop && lastVisible > index ? '–' + (lastVisible + 1) : ''} / ${cards.length}`;
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
    track.addEventListener('scroll',() => { if(frame===null)frame=window.requestAnimationFrame(update); },{passive:true});
    section.addEventListener('pointerenter',event => { if(event.pointerType==='mouse'){hovered=true;arm();} });
    section.addEventListener('pointerleave',() => { hovered=false;dragging=false;arm(); });
    section.addEventListener('pointerdown',() => { dragging=true;arm(); });
    section.addEventListener('pointerup',() => { dragging=false;arm(); });
    section.addEventListener('pointercancel',() => { dragging=false;arm(); });
    section.addEventListener('focusin',arm);
    section.addEventListener('focusout',() => window.queueMicrotask(arm));
    document.addEventListener('visibilitychange',arm,{signal:events.signal});
    preference.addEventListener?.('change',() => { if(toggle)toggle.hidden=!loop||preference.matches;arm(); },{signal:events.signal});
    if(window.IntersectionObserver){visibilityObserver=new window.IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting||false;arm();});visibilityObserver.observe(section);}
    if(window.ResizeObserver){sizeObserver=new window.ResizeObserver(()=>{if(section.isConnected)update();else destroy();});sizeObserver.observe(track);}
    update();arm();
  });
}

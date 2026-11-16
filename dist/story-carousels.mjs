const initialized = new WeakSet();

// Native horizontal scrolling keeps touch gestures and vertical page scrolling free.
export function initializeStoryCarousels(root) {
  root.querySelectorAll('[data-story-carousel]').forEach(section => {
    if (initialized.has(section)) return;
    initialized.add(section);
    const track = section.querySelector('[data-story-track]');
    const cards = [...track.children];
    const previous = section.querySelector('[data-story-direction="-1"]');
    const next = section.querySelector('[data-story-direction="1"]');
    const count = section.querySelector('[data-story-count]');
    let frame = null;
    function update() {
      frame = null;
      const index = cards.reduce((nearest, card, i) => Math.abs(card.offsetLeft - track.scrollLeft) < Math.abs(cards[nearest].offsetLeft - track.scrollLeft) ? i : nearest, 0);
      const lastVisible = cards.reduce((last, card, i) => card.offsetLeft + card.offsetWidth <= track.scrollLeft + track.clientWidth + 2 ? i : last, index);
      previous.disabled = track.scrollLeft < 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      count.textContent = `${index + 1}${lastVisible > index ? '–' + (lastVisible + 1) : ''} / ${cards.length}`;
    }
    function move(direction) {
      const step = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
      track.scrollBy({left: direction * step, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    }
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('keydown', event => {
      if (event.target === track && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    track.addEventListener('scroll', () => { if (frame === null) frame = window.requestAnimationFrame(update); }, {passive: true});
    if (window.ResizeObserver) {
      const observer = new window.ResizeObserver(() => { if (section.isConnected) update(); else observer.disconnect(); });
      observer.observe(track);
    }
    update();
  });
}

// Keep a visible first frame while the motion module loads.
if (performance.getEntriesByType('navigation')[0]?.type === 'reload') {
  history.scrollRestoration = 'manual';
  if (location.hash && location.hash !== '#contacto') history.replaceState(history.state, '', location.pathname + location.search);
  const resetHomePosition = () => window.scrollTo({top:0,left:0,behavior:'instant'});
  resetHomePosition();
  document.addEventListener('DOMContentLoaded', resetHomePosition, {once:true});
  window.addEventListener('pageshow', resetHomePosition, {once:true});
}
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('confort4-motion-loading');
  window.setTimeout(() => {
    window.CONFORT4_HERO_INTRO_EXPIRED = true;
    document.documentElement.classList.remove('confort4-motion-loading');
  }, 900);
}

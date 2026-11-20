// Hide the whole header until its font and initial cover are ready, not just text.
(()=>{
 const root=document.documentElement;
 root.classList.add('header-preparing');
 const release=()=>root.classList.remove('header-preparing');
 document.addEventListener('DOMContentLoaded',()=>{
  const fallback=setTimeout(release,2200);
  const image=document.querySelector('.hero-visual img,.team-hero img');
  const cover=image?.decode?.().catch(()=>{});
  Promise.all([document.fonts?.ready,cover]).then(()=>{clearTimeout(fallback);requestAnimationFrame(release);});
 },{once:true});
})();

// Run before layout/scroll restoration so a reload starts the cover from the top.
(()=>{
 if(performance.getEntriesByType('navigation')[0]?.type!=='reload')return;
 window.CONFORT4_TEAM_RELOAD=true;
 const previous=history.scrollRestoration;
 history.scrollRestoration='manual';
 const top=()=>window.scrollTo({top:0,left:0,behavior:'instant'});
 top();
 window.addEventListener('pageshow',top,{once:true});
 window.addEventListener('load',()=>requestAnimationFrame(top),{once:true});
 window.addEventListener('pagehide',()=>{history.scrollRestoration=previous;},{once:true});
})();

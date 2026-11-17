// Arm masks before the first paint. Without JavaScript/reduced motion, photos
// remain visible; failed module loads release the masks after a short fallback.
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
 document.documentElement.classList.add('motion-images-armed');
 setTimeout(()=>document.documentElement.classList.remove('motion-images-armed'),4000);
}

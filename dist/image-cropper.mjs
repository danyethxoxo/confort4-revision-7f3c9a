const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function imagePreset(path){
 if(/^clients\./.test(path))return {ratio:4/5,label:'Clientes · vertical 4:5'};
 if(/^team\.(gallery|nationalAward|members)/.test(path))return {ratio:3/4,label:'Galería o perfil · vertical 3:4'};
 if(/^team\.(cover|photos)/.test(path))return {ratio:3/2,label:'Equipo · horizontal 3:2'};
 if(/^living\.photos\./.test(path)){const i=Number(path.split('.')[2]);return {ratio:[2/3,3/2,2/3,3/2,2/3,30/17,2/3][i]||3/2,label:'Composición · formato de esta imagen'};}
 if(/^services\.|^process\./.test(path))return {ratio:3/2,label:'Contenido · horizontal 3:2'};
 return {ratio:16/9,label:'Portada · horizontal 16:9'};
}
export function cropRectangle(width,height,ratio,zoom=1,cx=.5,cy=.5){
 if(![width,height,ratio,zoom,cx,cy].every(Number.isFinite)||width<=0||height<=0||ratio<=0)throw Error('Dimensiones de imagen inválidas.');
 const w=Math.min(width,height*ratio)/clamp(zoom,1,5),h=w/ratio;
 return {x:clamp(cx*width-w/2,0,width-w),y:clamp(cy*height-h/2,0,height-h),width:w,height:h};
}
export function cropOutputSize(rect,maxEdge=1800){const scale=Math.min(1,maxEdge/Math.max(rect.width,rect.height));return {width:Math.max(1,Math.round(rect.width*scale)),height:Math.max(1,Math.round(rect.height*scale))};}

async function loadPhoto(source){
 let objectURL=null;
 if(source instanceof Blob){
  if(source.size>25000000||!['image/jpeg','image/png','image/webp'].includes(source.type))throw Error('Selecciona JPG, PNG o WebP de hasta 25 MB para recortar.');
  objectURL=URL.createObjectURL(source);
 }else{
  const url=new URL(String(source),location.href);
  if(url.protocol!=='https:'&&!(url.protocol==='http:'&&url.origin===location.origin))throw Error('Usa una imagen del sitio o un enlace HTTPS.');
 }
 const image=new Image();image.crossOrigin='anonymous';image.referrerPolicy='no-referrer';
 try{
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('La imagen tarda demasiado en cargar.')),12000);image.onload=()=>{clearTimeout(timeout);resolve();};image.onerror=()=>{clearTimeout(timeout);reject(Error('No se pudo abrir la imagen. Si el enlace externo no permite recortarla, sube el archivo original.'));};image.src=objectURL||String(source);});
  if(image.naturalWidth*image.naturalHeight>60000000)throw Error('La imagen es demasiado grande. Elige una copia de menor resolución.');
  await image.decode();
  return {image,release:()=>{image.src='';if(objectURL)URL.revokeObjectURL(objectURL);}};
 }catch(error){if(objectURL)URL.revokeObjectURL(objectURL);throw error;}
}

export async function openImageCropper(source,{path='media'}={}){
 const {image,release}=await loadPhoto(source),preset=imagePreset(path);
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='image-crop-dialog';dialog.setAttribute('aria-labelledby','image-crop-title');dialog.setAttribute('data-lenis-prevent','');
  dialog.innerHTML=`<header><div><h2 id="image-crop-title">Ajustar imagen</h2><p>Arrastra la foto o usa los controles para encuadrarla.</p></div><button type="button" data-crop-cancel aria-label="Cerrar ajustador">×</button></header><label class="crop-format">Formato<select data-crop-ratio><option value="recommended">Formato recomendado del módulo</option><option value="1.7777777778">Horizontal · 16:9</option><option value="1.5">Horizontal · 3:2</option><option value="1">Cuadrado · 1:1</option><option value="0.8">Vertical · 4:5</option><option value="0.75">Vertical · 3:4</option><option value="original">Proporción original</option></select></label><p class="crop-preset" data-crop-preset></p><div class="crop-stage"><canvas aria-label="Vista previa del recorte"></canvas><div class="crop-guides" aria-hidden="true"></div></div><div class="crop-controls"><label>Zoom <output data-crop-zoom-value>1×</output><input data-crop-zoom type="range" min="1" max="5" step="0.01" value="1"></label><label>Posición horizontal<input data-crop-x type="range" min="0" max="100" step="0.1" value="50"></label><label>Posición vertical<input data-crop-y type="range" min="0" max="100" step="0.1" value="50"></label></div><p data-crop-status role="status"></p><footer><button type="button" class="button button-outline" data-crop-reset>Restablecer</button><button type="button" class="button button-outline" data-crop-cancel>Cancelar</button><button type="button" class="button" data-crop-apply>Usar este encuadre</button></footer>`;
  const $=s=>dialog.querySelector(s),canvas=$('canvas'),stage=$('.crop-stage'),ctx=canvas.getContext('2d'),events=new AbortController();
  let state={ratio:preset.ratio,zoom:1,cx:.5,cy:.5},rect,drag=null,frame=null,finished=false;
  const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  function finish(file=null){if(finished)return;finished=true;if(frame!==null)cancelAnimationFrame(frame);events.abort();if(dialog.open)dialog.close();dialog.remove();document.body.style.overflow=previousOverflow;release();resolve(file);}
  function draw(){
   if(finished)return;if(frame!==null)cancelAnimationFrame(frame);frame=null;rect=cropRectangle(image.naturalWidth,image.naturalHeight,state.ratio,state.zoom,state.cx,state.cy);
   state.cx=(rect.x+rect.width/2)/image.naturalWidth;state.cy=(rect.y+rect.height/2)/image.naturalHeight;
   const width=Math.min(680,window.innerWidth-72,Math.max(140,window.innerHeight*.42)*state.ratio),height=width/state.ratio;
   stage.style.width=width+'px';stage.style.height=height+'px';const previewWidth=Math.round(width*Math.min(2,devicePixelRatio||1)),previewHeight=Math.round(height*Math.min(2,devicePixelRatio||1));if(canvas.width!==previewWidth)canvas.width=previewWidth;if(canvas.height!==previewHeight)canvas.height=previewHeight;
   ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,rect.x,rect.y,rect.width,rect.height,0,0,canvas.width,canvas.height);
   $('[data-crop-x]').value=state.cx*100;$('[data-crop-y]').value=state.cy*100;$('[data-crop-zoom]').value=state.zoom;$('[data-crop-zoom-value]').textContent=state.zoom.toFixed(2)+'×';
   $('[data-crop-preset]').textContent=$('[data-crop-ratio]').value==='recommended'?preset.label:'Vista previa del formato seleccionado';
  }
  function schedule(){if(frame===null)frame=requestAnimationFrame(draw);}
  $('[data-crop-ratio]').addEventListener('change',event=>{state.ratio=event.target.value==='recommended'?preset.ratio:event.target.value==='original'?image.naturalWidth/image.naturalHeight:Number(event.target.value);state.zoom=1;state.cx=.5;state.cy=.5;draw();});
  for(const [selector,key,divisor] of [['[data-crop-zoom]','zoom',1],['[data-crop-x]','cx',100],['[data-crop-y]','cy',100]])$(selector).addEventListener('input',event=>{state[key]=Number(event.target.value)/divisor;schedule();});
  stage.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,cx:state.cx,cy:state.cy,width:rect.width,height:rect.height};stage.setPointerCapture(event.pointerId);});
  stage.addEventListener('pointermove',event=>{if(!drag)return;state.cx=drag.cx-(event.clientX-drag.x)*drag.width/stage.clientWidth/image.naturalWidth;state.cy=drag.cy-(event.clientY-drag.y)*drag.height/stage.clientHeight/image.naturalHeight;schedule();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,()=>{drag=null;});
  window.addEventListener('resize',schedule,{signal:events.signal});
  $('[data-crop-reset]').addEventListener('click',()=>{state={ratio:preset.ratio,zoom:1,cx:.5,cy:.5};$('[data-crop-ratio]').value='recommended';draw();});
  dialog.querySelectorAll('[data-crop-cancel]').forEach(button=>button.addEventListener('click',()=>finish()));
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});dialog.addEventListener('close',()=>finish());
  $('[data-crop-apply]').addEventListener('click',async()=>{
   const button=$('[data-crop-apply]');button.disabled=true;draw();
   try{
    let blob;
    for(const maxEdge of [1800,1400,1000,800]){
     const size=cropOutputSize(rect,maxEdge),output=document.createElement('canvas');output.width=size.width;output.height=size.height;const outputContext=output.getContext('2d');outputContext.imageSmoothingQuality='high';outputContext.drawImage(image,rect.x,rect.y,rect.width,rect.height,0,0,size.width,size.height);
     blob=await new Promise(done=>output.toBlob(done,'image/webp',.9));if(blob&&blob.size<=3000000)break;
    }
    if(!blob||blob.size>3000000)throw Error('No se pudo preparar el recorte. Prueba una imagen de menor tamaño.');
    finish(new File([blob],'encuadre.'+(blob.type==='image/webp'?'webp':'png'),{type:blob.type}));
   }catch(error){$('[data-crop-status]').textContent=error.name==='SecurityError'?'Este enlace no permite recortar la imagen. Sube el archivo original.':error.message;button.disabled=false;}
  });
  document.body.append(dialog);dialog.showModal();draw();
 });
}

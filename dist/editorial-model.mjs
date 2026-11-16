export const homeModuleLabels={statement:'Presentación del equipo',properties:'Propiedades · widget',reviews:'Nuestras reseñas · widget',clients:'Nuestros clientes',process:'Tu proyecto · información de valor',metrics:'Un equipo que conecta · cifras',living:'Un espacio para vivir',faq:'Preguntas frecuentes',transactions:'Vendidas y rentadas · widget',journal:'Blog · widget'};
export const homeModuleTypes=Object.keys(homeModuleLabels);
export function editorialContent(content){
 const d=structuredClone(content);
 if(d.home.layoutVersion!==2){
  d.home.modules=['statement',...d.home.modules.filter(m=>m!=='tool').flatMap(m=>m==='properties'?['properties','reviews','clients']:m==='process'?['process','metrics','living']:[m]),'transactions'];
  d.home.modules=[...new Set(d.home.modules)];d.home.layoutVersion=2;
 }
 d.home.hiddenModules??=[];d.home.buttonLabel??='Hablemos de tu proyecto';d.home.buttonHref??='contacto.html';d.home.photoAlt??='Fachada arquitectónica de ambientación';
 d.statement??={text:d.team.intro,buttonLabel:'Conoce a Alberto y Renata',buttonHref:'quienes-somos.html'};
 d.widgets??={};d.widgets.properties??={title:'Propiedades',buttonLabel:'Explorar el catálogo',buttonHref:'propiedades.html'};d.widgets.reviews??={title:'Nuestras reseñas.',intro:''};d.widgets.journal??={title:'Un poco de claridad para lo que sigue.',intro:'Lecturas prácticas del equipo Confort4.'};
 d.processTitle??='Tu proyecto marca la estrategia. Escuchamos, conectamos y te acompañamos en cada decisión.';
 d.process=d.process.map((step,i)=>({...step,image:step.image||'assets/'+['editorial-visit.jpg','editorial-agreement.jpg','editorial-rental.jpg'][i],imageAlt:step.imageAlt||'Espacio residencial de ambientación'}));
 d.metrics??={title:'Confort4',intro:'Un equipo que conecta tu proyecto con las oportunidades de nuestro catálogo.',image:'assets/editorial-visit.jpg',imageAlt:'Arquitectura residencial de ambientación',items:[{label:'Propiedades en catálogo',source:'properties',value:0},{label:'Asesores del equipo',source:'team',value:0},{label:'Servicios inmobiliarios',source:'services',value:0},{label:'Municipios y alcaldías en catálogo',source:'locations',value:0}]};
 d.living??={title:'Un espacio para vivir.\nUna etapa por comenzar.',buttonLabel:'Conoce al equipo',buttonHref:'quienes-somos.html',photos:['editorial-sale.jpg','editorial-budget.jpg','editorial-visit.jpg','editorial-agreement.jpg','editorial-rental.jpg','editorial-city.jpg','architecture-facade.webp'].map(file=>({photo:'assets/'+file,alt:'Espacio residencial de ambientación'}))};
 d.faqConfig??={title:'Las preguntas que sí importan.',intro:'Información breve para decidir tu siguiente paso.'};
 d.clients??={title:'Nuestros Clientes',intro:'',items:[]};d.transactions??={title:'Historias que ya encontraron su lugar.',intro:'',items:[]};d.transactions.visible??=true;
 d.team.approachTitle??='Cómo te acompañamos.';d.team.photosTitle??='Alberto y Renata. Un equipo contigo.';d.team.coverAlt??='Alberto y Renata Flores, equipo Confort4';d.team.hiddenSections??=[];
 d.team.nationalAward??={title:'Novatos del Año',description:'',photos:[]};
 d.services=d.services.map(service=>({...service,buttonHref:service.buttonHref||'contacto.html?interes='+encodeURIComponent(service.id==='rentar'?'general':service.id)+'#contacto',closingTitle:service.closingTitle||'Demos forma a tu proyecto.',closingButtonLabel:service.closingButtonLabel||'Contactar a Confort4',closingButtonHref:service.closingButtonHref||'contacto.html?interes='+encodeURIComponent(service.id==='rentar'?'general':service.id)+'#contacto'}));
 return d;
}

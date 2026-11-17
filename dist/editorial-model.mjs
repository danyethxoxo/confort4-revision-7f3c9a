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
 d.faq=d.faq.map(q=>({...q,visible:q.visible!==false}));
 d.blogPage??={title:'Más información.\nMejores preguntas.',intro:'Guías y herramientas para avanzar con claridad en tu proyecto inmobiliario.',listTitle:'Ideas para decidir mejor.',listIntro:d.widgets.journal.intro};
 d.blogPage.listIntro??=d.widgets.journal.intro;
 d.reviewPage??={title:'Tu experiencia\nnos importa.',intro:'Si trabajaste con Confort4, cuéntanos cómo te fue. Leemos cada comentario para seguir mejorando.',formTitle:'Cuéntanos tu experiencia',nameLabel:'Nombre para mostrar',emailLabel:'Correo electrónico',interestLabel:'¿En qué te acompañamos?',ratingLabel:'¿Cómo fue tu experiencia?',messageLabel:'Tu experiencia',messagePlaceholder:'Comparte cómo fue trabajar con Confort4. Evita incluir datos privados de otras personas.',buttonLabel:'Enviar mi reseña'};
 d.clients??={title:'Nuestros Clientes',intro:'',items:[]};d.transactions??={title:'Historias que ya encontraron su lugar.',intro:'',items:[]};d.transactions.visible??=true;
 d.team.approachTitle??='Cómo te acompañamos.';d.team.photosTitle??='Alberto y Renata. Un equipo contigo.';d.team.coverAlt??='Alberto y Renata Flores, equipo Confort4';d.team.hiddenSections??=[];
 d.team.heroEyebrow??='Alberto y Renata · Confort4';d.team.membersTitle??='Conoce a Alberto y Renata.';
 d.team.nationalAward??={title:'Novatos del Año',description:'',photos:[]};
 d.services=d.services.map(service=>({...service,buttonHref:service.buttonHref||'contacto.html?interes='+encodeURIComponent(service.id==='rentar'?'general':service.id)+'#contacto',closingTitle:service.closingTitle||'Demos forma a tu proyecto.',closingButtonLabel:service.closingButtonLabel||'Contactar a Confort4',closingButtonHref:service.closingButtonHref||'contacto.html?interes='+encodeURIComponent(service.id==='rentar'?'general':service.id)+'#contacto'}));
 if(d.googleReviews)d.googleReviews.items=d.googleReviews.items.map(r=>({...r,published:r.published!==false}));
 d.services=d.services.map(s=>({...s,sections:s.sections.map(section=>({...section,visible:section.visible!==false})),visibility:{hero:true,audiences:true,comparison:true,process:true,reading:true,faq:true,project:true,...s.visibility},processTitle:s.processTitle??d.processTitle,process:s.process??structuredClone(d.process),readingTitle:s.readingTitle??'Antes de dar el siguiente paso.',faqConfig:s.faqConfig??structuredClone(d.faqConfig),faq:(s.faq??d.faq.filter(q=>q.category===s.shortTitle||q.category==='Proceso')).map(q=>({...q,visible:q.visible!==false})),project:s.project??{title:'¿Tienes algo en mente?',intro:'Comprar, vender o rentar. Cuéntanos qué tienes en mente y empecemos por ahí.',formTitle:'Cuéntanos tu proyecto',buttonLabel:'Contactar al equipo'},comparison:s.comparison?{...s.comparison,teamLabel:s.comparison.teamLabel??'Con Confort4'}:null,audiences:(s.audiences||[]).map(a=>({...a,visible:a.visible!==false,buttonLabel:a.buttonLabel??'Quiero acompañamiento',buttonHref:a.buttonHref??'contacto.html?interes=rentar-'+a.id+'#contacto'}))}));
 return d;
}

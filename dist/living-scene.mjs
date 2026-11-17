import {e,safeURL} from './ui.mjs?v=20261117panel';
export function metricsScene(bundle){
 const m=bundle.content.metrics,properties=bundle.properties||[];
 const automatic={properties:properties.length,team:bundle.content.team.members.length,services:bundle.content.services.length,locations:new Set(properties.map(p=>p.municipio).filter(Boolean)).size};
 return `<section id="experiencia" class="expanding-scene" aria-labelledby="next-stage-title"><div class="expanding-stage"><div class="expanding-frame"><img src="${safeURL(m.image)}" alt="${e(m.imageAlt)}" width="1600" height="1100" loading="lazy"><div class="expanding-scrim"></div></div><div class="expanding-copy"><h2 id="next-stage-title">${e(m.title)}</h2><p>${e(m.intro)}</p><dl class="expanding-options">${m.items.map(item=>{const value=item.source==='manual'?item.value:automatic[item.source]??0;return `<div class="expanding-metric"><dt>${e(item.label)}</dt><dd><span class="motion-count" data-count-target="${e(value)}">${e(value)}</span></dd></div>`;}).join('')}</dl></div></div></section>`;
}
export function livingScene(bundle){
 const m=bundle.content.living;
 return `<section class="living-scene" aria-labelledby="living-title"><div class="scene-photographs" aria-hidden="true">${m.photos.map((photo,i)=>`<div class="scene-photo scene-photo-${i}" data-scene-drift="${[-120,-40,-160,-80,-200,-60,-40][i]}"><img src="${safeURL(photo.photo)}" alt="${e(photo.alt)}" width="600" height="${[900,400,900,400,900,340,900][i]}" loading="lazy"></div>`).join('')}</div><div class="living-copy"><h2 id="living-title">${e(m.title).replaceAll('\n','<br>')}</h2><a class="text-link" href="${safeURL(m.buttonHref)}">${e(m.buttonLabel)} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a></div></section>`;
}

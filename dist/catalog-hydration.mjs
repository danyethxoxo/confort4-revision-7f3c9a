// Keep an in-flight photo reveal alive when current inventory replaces fallback
// content. Text, price and other fields still come from the fresh card.
export function preserveCatalogPhotos(current, incoming) {
 const photos=new Map([...current.querySelectorAll('.property-card[data-property]')].map(card=>[card.dataset.property,card.querySelector('.property-photo>a')]));
 incoming.querySelectorAll('.property-card[data-property]').forEach(card=>{
  const previous=photos.get(card.dataset.property),next=card.querySelector('.property-photo>a');
  if(!previous||!next||previous.getAttribute('href')!==next.getAttribute('href')||previous.querySelector('img')?.getAttribute('src')!==next.querySelector('img')?.getAttribute('src'))return;
  previous.querySelector('img')?.setAttribute('alt',next.querySelector('img')?.getAttribute('alt')||'');
  next.replaceWith(previous);
 });
}

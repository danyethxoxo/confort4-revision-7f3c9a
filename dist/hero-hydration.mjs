const headingText=heading=>heading?.dataset.motionText||heading?.textContent.trim();
export function heroSignature(hero){
 if(!hero)return '';
 return JSON.stringify([headingText(hero.querySelector('h1')),hero.querySelector('.hero-image')?.getAttribute('src'),hero.querySelector('.hero-aside p')?.textContent.trim(),hero.querySelector('.hero-aside a')?.textContent.trim(),hero.querySelector('.hero-aside a')?.getAttribute('href'),hero.querySelector('.hero-image')?.getAttribute('alt')]);
}
// Keep the photographic frame and unchanged text animations during late updates.
export function updateHeroContent(current,next){
 const image=current.querySelector('.hero-image'),nextImage=next.querySelector('.hero-image');
 for(const attr of ['src','alt'])if(image.getAttribute(attr)!==nextImage.getAttribute(attr))image.setAttribute(attr,nextImage.getAttribute(attr)||'');
 const heading=current.querySelector('h1'),nextHeading=next.querySelector('h1');
 if(headingText(heading)!==headingText(nextHeading))heading.replaceWith(nextHeading);
 const description=current.querySelector('.hero-aside p'),nextDescription=next.querySelector('.hero-aside p');
 if(description.textContent!==nextDescription.textContent)description.textContent=nextDescription.textContent;
 const button=current.querySelector('.hero-aside a'),nextButton=next.querySelector('.hero-aside a');
 if(button.getAttribute('href')!==nextButton.getAttribute('href'))button.setAttribute('href',nextButton.getAttribute('href'));
 if(button.textContent!==nextButton.textContent)button.replaceChildren(...nextButton.childNodes);
}

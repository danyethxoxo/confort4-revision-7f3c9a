import {sources} from './property-image-manifest.mjs?v=20261117sharp';
import {photoGatewayURL,PHOTO_PROFILES} from './photo-policy.mjs?v=20261117sharp';
const aliases=new Map(Object.values(sources).flatMap(variants=>Object.values(variants).map(asset=>[asset,variants])));
export function propertyImageSource(value,size='card'){
 const profile=Object.hasOwn(PHOTO_PROFILES,size)?size:'card';
 if(value==='assets/property-placeholder.svg')return value;
 const variants=Object.hasOwn(sources,value)?sources[value]:aliases.get(value);
 return variants?.[profile]||photoGatewayURL(value,profile);
}

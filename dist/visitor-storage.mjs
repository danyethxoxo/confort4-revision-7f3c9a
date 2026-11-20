export function clearVisitorPreferences(storage){
 const keys=[];
 for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key&&/^(confort4-(favorites|compare|property-preview|team-public)|confort4-checklist-[\w-]+)$/.test(key))keys.push(key);}
 keys.forEach(key=>storage.removeItem(key));return keys.length;
}

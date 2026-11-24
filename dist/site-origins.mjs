// Exact trusted origins only. Updated from content/deployment.json at build time.
export const SITE_ORIGINS=Object.freeze(["https://danyethxoxo.github.io","https://confort4.mx"]);
export function corsOrigin(value){return SITE_ORIGINS.includes(value)?value:null;}

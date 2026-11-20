import {privacyConfig} from './privacy-model.mjs';
export {PRIVACY_VERSION,privacyVersion} from './privacy-model.mjs';
export const KW_PRIVACY_URL='https://kwpremiermx.kw.com/es-es/aviso-de-privacidad';
export function privacySummary(kind='contact',content){
 const p=privacyConfig(content),e=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
 const purpose=kind==='review'?p.reviewPurpose:p.contactPurpose;
 return `<div class="privacy-summary"><p>${e(p.responsibleName)} (${e(p.brand)}), con domicilio en ${e(p.address)}, tratará los datos de este formulario para ${e(purpose)}. ${e(p.summaryEnding)} Para limitar su uso o ejercer tus derechos, escribe a <a href="mailto:${e(p.email)}">${e(p.email)}</a>. Consulta el <a href="privacidad.html">aviso de privacidad completo</a>.</p></div>`;
}

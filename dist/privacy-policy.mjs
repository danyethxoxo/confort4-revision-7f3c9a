export const PRIVACY_VERSION='confort4-2026-11-19.1';
export const KW_PRIVACY_URL='https://kwpremiermx.kw.com/es-es/aviso-de-privacidad';
export function privacySummary(kind='contact'){
 const purpose=kind==='review'?'revisar tu reseña; publicarla requiere el permiso separado de abajo':'responder y dar seguimiento a tu solicitud inmobiliaria';
 return `<div class="privacy-summary"><p>Alberto Flores Resendiz (Confort4), con domicilio en San Francisco 25, Piso 2, Col. del Valle Norte, Benito Juárez, CDMX, C.P. 03103, tratará los datos de este formulario para ${purpose}. No te suscribe a publicidad. Para limitar su uso o ejercer tus derechos, escribe a <a href="mailto:albertoflores@kwmexico.mx">albertoflores@kwmexico.mx</a>. Consulta el <a href="privacidad.html">aviso de privacidad completo</a>.</p></div>`;
}

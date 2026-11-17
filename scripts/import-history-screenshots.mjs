// Prepare a repeatable, reviewable import; execution against Supabase is separate.
// Screenshots are source evidence, not a source of invented transaction dates.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(path.join(process.env.TEMP,'confort-media/node_modules/sharp'));
const source='I:/Imágenes/confort 4/historial de propiedades';
const files=fs.readdirSync(source).filter(name=>name.startsWith('Captura de pantalla ')).sort();
const rows=[
 [0,'2130688277883868','Único PH Duplex en Polanco: Terraza Privada y Máximo Confort','80 Aristóteles · Ciudad de México 11550','fuera_del_mercado',1450000,'USD',330,330,3,2.5,'Withdrawn','b487a75d-10e5-4b14-86b5-9539984df359'],
 [5,'2057546314147482','Departamento en Venta: 2 Recámaras y Roof Garden Privado','33 Carlos B. Zetina #B-802 · Cuauhtémoc 06170','cancelada',9900000,'MXN',168,168,2,2,'Cancelled'],
 [6,'2040817749124342','Departamento en San Antonio #402','88 San Antonio #402 · Benito Juárez 03840','rentada',34900,'MXN',102.14,102.14,2,2,'leased'],
 [7,'1989127998088128','Departamento en Av. San Antonio','88 Av. San Antonio · Benito Juárez 03710','vendida',5100000,'MXN',103,103,2,2,'Sold'],
 [8,'2043620620564244','Departamento en Giorgione #405','24 Giorgione #405 · Benito Juárez 03700','vendida',6800000,'MXN',176,176,4,3,'Sold'],
 [9,'2063786484478984','Departamento en Carlos B. Zetina #206','30 Carlos B. Zetina #206 · Cuauhtémoc 06170','vendida',14000000,'MXN',251,251,3,3,'Sold'],
 [10,'1988781211225216','Departamento en Cuauhtémoc','Cuauhtémoc · Ciudad de México 06600','cancelada',41000,'MXN',110,0,2,2,'Cancelled'],
 [11,'2011885690167596','Departamento en División del Norte','1245 División del Norte · Benito Juárez 03650','cancelada',33100,'MXN',74.3,0,2,2,'Cancelled'],
 [12,'2057762284397488','Departamento en Correggio #001','78 Correggio #001 · Benito Juárez 03710','expirada',5339900,'MXN',101,101,2,2,'Expired'],
 [13,'2103419143406908','Departamento en Calzada San Isidro #C 903','164 Calz. San Isidro #C 903 · Azcapotzalco 02760','rentada',15000,'MXN',0,0,1,2,'leased'],
 [14,'2106031407388322','Terreno en Álvaro Obregón','172 · Álvaro Obregón · Ciudad de México 01729','cancelada',18900000,'MXN',0,525,0,0,'Cancelled'],
 [15,'2085368687547330','Departamento en Giorgione','24 Giorgione · Benito Juárez 03700','rentada',39000,'MXN',176,176,4,3,'leased']
];
const quote=v=>v==null?'null':"'"+String(v).replaceAll("'","''")+"'";
let sql='-- Import reviewed from owner-provided KW screenshots; no active listing is marked closed.\nbegin;\n';
for(const [index,reference,title,location,status,price,currency,built,land,bedrooms,baths,sourceStatus,existingId] of rows){
 const asset=`assets/history-${reference}.webp`;
 // Exact photo rectangle only, without interface, price or private agent details.
 await sharp(path.join(source,files[index])).extract({left:42,top:186,width:280,height:158}).webp({quality:92}).toFile('dist/'+asset);
 const details={screenshot:files[index],kwlsId:reference,sourceStatus,livingArea:built,lotSize:land,bedrooms,baths,titleFromAddress:index!==0&&index!==5,importedAt:'2026-11-16'};
 sql+=`insert into confort4.closed_properties(property_id,source_reference,title,photo,location,status,cancelled,visible,published_price,currency,source_details) values(${existingId?quote(existingId):'gen_random_uuid()'},${quote(reference)},${quote(title)},${quote(asset)},${quote(location)},${quote(status)},${status==='cancelada'},${['vendida','rentada'].includes(status)},${price},${quote(currency)},${quote(JSON.stringify(details))}::jsonb) on conflict(${existingId?'property_id':'source_reference'}) do nothing;\n`;
 // Existing Polanco was previously assumed sold; the screenshot now supplies the documented status.
 if(existingId)sql+=`update confort4.closed_properties set source_reference=${quote(reference)},status=${quote(status)},visible=false,cancelled=false,source_details=${quote(JSON.stringify(details))}::jsonb where property_id=${quote(existingId)} and source_reference is null;\n`;
}
sql+='commit;\n';
fs.writeFileSync('db/20261116-history-import.sql',sql);
console.log('Prepared 12 history records: 6 visible, 6 hidden. Skipped 3 active listings and 1 draft.');

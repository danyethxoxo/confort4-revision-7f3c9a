create function public.confort4_catalog_picker(p_user uuid,p_reference text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare target uuid; result jsonb;
begin
 if not exists(select 1 from confort4.members where user_id=p_user) then raise exception 'not_a_member';end if;
 if p_reference is null then
  return public.confort4_inventory() || (select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'titulo',p.titulo,'precio',p.precio,'moneda',p.moneda,'operacion',p.operacion,'imagenes',p.imagenes,'colonia',p.colonia,'municipio',p.municipio,'own',false,'selected',true,'inactive',true)),'[]'::jsonb) from public.propiedades p join confort4.property_selections s on s.property_id=p.id where p.estatus<>'publicada' and not confort4.owns_property(p.id));
 end if;
 if p_reference !~ '^[0-9]{8,20}$' then raise exception 'invalid_property_reference';end if;
 select p.id into target from public.propiedades p where p.estatus='publicada' and
  (p.datos_origen#>>'{listado,Property_Command_ID}'=p_reference
   or p.datos_origen#>>'{detalle,data,Property_Data,0,Property_Command_ID}'=p_reference
   or p.fuente_id=p_reference)
 order by p.updated_at desc,p.id limit 1;
 if target is null then return '[]'::jsonb;end if;
 select coalesce(jsonb_agg(item),'[]'::jsonb) into result
 from jsonb_array_elements(public.confort4_inventory('',false)) item where item->>'id'=target::text;
 -- A resolved listing may be outside the 40 most recent search results.
 if result='[]'::jsonb then
  select jsonb_build_array(jsonb_build_object('id',p.id,'titulo',p.titulo,'precio',p.precio,'moneda',p.moneda,
   'operacion',p.operacion,'imagenes',p.imagenes,'colonia',p.colonia,'municipio',p.municipio,
   'own',confort4.owns_property(p.id),'selected',exists(select 1 from confort4.property_selections s where s.property_id=p.id))) into result
  from public.propiedades p where p.id=target;
 end if;
 return result;
end $$;
revoke all on function public.confort4_catalog_picker(uuid,text) from public,anon,authenticated;
grant execute on function public.confort4_catalog_picker(uuid,text) to service_role;

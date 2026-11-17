create table confort4.property_media(
 property_id uuid primary key references public.propiedades(id) on delete cascade,
 source_id text not null,images jsonb not null check(jsonb_typeof(images)='array'),
 fetched_at timestamptz not null default now()
);
alter table confort4.property_media enable row level security;
revoke all on confort4.property_media from public,anon,authenticated;
grant select,insert,update,delete on confort4.property_media to service_role;

create function confort4.with_property_media(p_items jsonb)
returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(case when m.images is not null then item||jsonb_build_object('imagenes',
  case when p.updated_at>m.fetched_at and jsonb_array_length(p.imagenes)>1 then p.imagenes else m.images end)
  else item end order by position),'[]'::jsonb)
 from jsonb_array_elements(p_items) with ordinality as records(item,position)
 left join public.propiedades p on p.id=(item->>'id')::uuid
 left join confort4.property_media m on m.property_id=p.id and m.source_id=p.fuente_id;
$$;
revoke all on function confort4.with_property_media(jsonb) from public,anon,authenticated;
grant execute on function confort4.with_property_media(jsonb) to service_role;

create function public.confort4_property_media(p_user uuid,p_id uuid,p_images jsonb default null,p_source_id text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare listing record; media record;
begin
 if not exists(select 1 from confort4.members where user_id=p_user) then raise exception 'not_a_member';end if;
 select id,fuente,fuente_id,imagenes,updated_at into listing from public.propiedades where id=p_id and estatus='publicada';
 if not found then raise exception 'property_missing';end if;
 if p_images is not null then
  if p_source_id is distinct from listing.fuente_id or jsonb_typeof(p_images)<>'array' then raise exception 'invalid_property_media';end if;
  if jsonb_array_length(p_images)<1 or jsonb_array_length(p_images)>1000 or exists(select 1 from jsonb_array_elements(p_images) value where jsonb_typeof(value)<>'string' or value#>>'{}' !~ '^https://[^[:space:]<>"'']+$') then raise exception 'invalid_property_media';end if;
  insert into confort4.property_media(property_id,source_id,images) values(p_id,p_source_id,p_images)
  on conflict(property_id) do update set source_id=excluded.source_id,images=excluded.images,fetched_at=now();
 end if;
 select * into media from confort4.property_media where property_id=p_id and source_id=listing.fuente_id;
 return jsonb_build_object('source',listing.fuente,'source_id',listing.fuente_id,'images',coalesce(media.images,listing.imagenes),
  'fresh',coalesce(media.fetched_at>now()-interval '6 hours' and media.fetched_at>=listing.updated_at,false));
end $$;
revoke all on function public.confort4_property_media(uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.confort4_property_media(uuid,uuid,jsonb,text) to service_role;

create or replace function public.confort4_inventory(p_query text default '',p_public boolean default true)
returns jsonb language sql security invoker set search_path='' as $$
 with candidates as (
  select p.id,p.titulo,p.descripcion,p.tipo,p.operacion,p.precio,p.moneda,p.colonia,p.municipio,p.estado,p.recamaras,p.banos,p.estacionamientos,p.m2_construccion,p.m2_terreno,p.imagenes,p.updated_at,p.asesor_nombre,
   confort4.owns_property(p.id) as own,
   exists(select 1 from confort4.property_selections s where s.property_id=p.id) as selected
  from public.propiedades p where p.estatus='publicada'
  and (p_query='' or concat_ws(' ',p.titulo,p.colonia,p.municipio,p.asesor_nombre) ilike '%'||left(p_query,100)||'%')
 ), eligible as (
  select * from candidates where own or not p_public
  union all
  (select * from candidates where p_public and not own and selected order by updated_at desc,id limit 10)
 ), ordered as (
  select * from eligible order by own desc,updated_at desc,id limit case when p_public then null else 40 end
 ) select confort4.with_property_media(coalesce(jsonb_agg(to_jsonb(t) order by own desc,updated_at desc,id),'[]'::jsonb)) from ordered t;
$$;
create or replace function public.confort4_catalog_picker(p_user uuid,p_reference text default null)
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
 return confort4.with_property_media(result);
end $$;
revoke all on function public.confort4_catalog_picker(uuid,text) from public,anon,authenticated;
grant execute on function public.confort4_catalog_picker(uuid,text) to service_role;

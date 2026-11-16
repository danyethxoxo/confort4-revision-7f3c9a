-- Team ownership is based on the verified source advisor records, never display names.
alter table confort4.settings add column if not exists team_advisor_ids uuid[] not null default '{}';
update confort4.settings set team_advisor_ids = array['f9a63b10-8d09-4424-acee-d7eff14bfdfc','5dc1d716-10d0-43c2-9cd8-7e18e23fd8c3']::uuid[] where singleton;

create or replace function confort4.owns_property(p_id uuid)
returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.propiedades p cross join confort4.settings s
 where s.singleton and p.id=p_id and (p.asesor_id=any(s.team_advisor_ids) or p.asesor_kw_id=s.inventory_advisor_id));
$$;
revoke all on function confort4.owns_property(uuid) from public,anon,authenticated;
grant execute on function confort4.owns_property(uuid) to service_role;

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
 ) select coalesce(jsonb_agg(to_jsonb(t) order by own desc,updated_at desc,id),'[]'::jsonb) from ordered t;
$$;

create or replace function confort4.enforce_selection_limit()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 -- Serialize concurrent selections before counting; ten means ten across tabs too.
 perform 1 from confort4.settings where singleton for update;
 if exists(select 1 from confort4.property_selections where property_id=new.property_id) then return new; end if;
 if not confort4.owns_property(new.property_id) and
  (select count(*) from confort4.property_selections where not confort4.owns_property(property_id)) >= 10 then
  raise exception 'external_selection_limit';
 end if;
 return new;
end $$;
revoke all on function confort4.enforce_selection_limit() from public,anon,authenticated;
create trigger selection_limit before insert or update on confort4.property_selections
for each row execute function confort4.enforce_selection_limit();

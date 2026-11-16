begin;
create temp table settings as select singleton,inventory_advisor_id,array['f9a63b10-8d09-4424-acee-d7eff14bfdfc','5dc1d716-10d0-43c2-9cd8-7e18e23fd8c3']::uuid[] as team_advisor_ids from confort4.settings;
create temp table propiedades as select * from public.propiedades with no data;
create temp table property_selections(property_id uuid primary key);
create or replace function pg_temp.owns_property(p_id uuid)
returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from pg_temp.propiedades p cross join pg_temp.settings s
 where s.singleton and p.id=p_id and (p.asesor_id=any(s.team_advisor_ids) or p.asesor_kw_id=s.inventory_advisor_id));
$$;



create or replace function pg_temp.inventory(p_query text default '',p_public boolean default true)
returns jsonb language sql security invoker set search_path='' as $$
 with candidates as (
  select p.id,p.titulo,p.descripcion,p.tipo,p.operacion,p.precio,p.moneda,p.colonia,p.municipio,p.estado,p.recamaras,p.banos,p.estacionamientos,p.m2_construccion,p.m2_terreno,p.imagenes,p.updated_at,p.asesor_nombre,
   pg_temp.owns_property(p.id) as own,
   exists(select 1 from pg_temp.property_selections s where s.property_id=p.id) as selected
  from pg_temp.propiedades p where p.estatus='publicada'
  and (p_query='' or concat_ws(' ',p.titulo,p.colonia,p.municipio,p.asesor_nombre) ilike '%'||left(p_query,100)||'%')
 ), eligible as (
  select * from candidates where own or not p_public
  union all
  (select * from candidates where p_public and not own and selected order by updated_at desc,id limit 10)
 ), ordered as (
  select * from eligible order by own desc,updated_at desc,id limit case when p_public then null else 40 end
 ) select coalesce(jsonb_agg(to_jsonb(t) order by own desc,updated_at desc,id),'[]'::jsonb) from ordered t;
$$;

create or replace function pg_temp.enforce_selection_limit()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 -- Serialize concurrent selections before counting; ten means ten across tabs too.
 perform 1 from pg_temp.settings where singleton for update;
 if exists(select 1 from pg_temp.property_selections where property_id=new.property_id) then return new; end if;
 if not pg_temp.owns_property(new.property_id) and
  (select count(*) from pg_temp.property_selections where not pg_temp.owns_property(property_id)) >= 10 then
  raise exception 'external_selection_limit';
 end if;
 return new;
end $$;

create trigger selection_limit before insert on pg_temp.property_selections for each row execute function pg_temp.enforce_selection_limit();
do $$ declare n integer; external_ids uuid[]; pid uuid; begin
 for n in 1..57 loop
  insert into pg_temp.propiedades select (jsonb_populate_record(null::public.propiedades,to_jsonb(p)||jsonb_build_object('id',md5(n::text)::uuid,'asesor_id',case when n=46 then '5dc1d716-10d0-43c2-9cd8-7e18e23fd8c3'::uuid else null end,'asesor_kw_id',case when n<=45 then '2000102839' else 'external' end,'estatus','publicada'))).* from public.propiedades p limit 1;
 end loop;
 if jsonb_array_length(pg_temp.inventory())<>46 then raise exception 'Own inventory truncated or Renata excluded';end if;
 for n in 47..56 loop insert into pg_temp.property_selections values(md5(n::text)::uuid);end loop;
 if jsonb_array_length(pg_temp.inventory())<>56 then raise exception 'Own plus ten external incorrect';end if;
 begin
  insert into pg_temp.property_selections values(md5('57')::uuid);
  raise exception 'Eleventh external selection was accepted';
 exception when others then if sqlerrm <> 'external_selection_limit' then raise; end if;end;
 insert into pg_temp.property_selections values(md5('1')::uuid);
 insert into pg_temp.property_selections values(md5('47')::uuid) on conflict do nothing;
 update pg_temp.propiedades set estatus='suspendida' where id=md5('1')::uuid;
 if jsonb_array_length(pg_temp.inventory())<>55 then raise exception 'Inactive listing exposed';end if;
 if jsonb_array_length(pg_temp.inventory('unlikely-unique-query'))<>0 then raise exception 'Search ignored';end if;
 if jsonb_array_length(pg_temp.inventory('',false))<>40 then raise exception 'Admin search limit broken';end if;
end $$;
rollback;
select 'PASS: 46 own including Renata, 10 external, cap 11, duplicate, inactive and search' as verification;
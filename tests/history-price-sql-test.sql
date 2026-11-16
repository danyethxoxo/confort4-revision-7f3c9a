begin;
create temp table propiedades as select * from public.propiedades with no data;
create temp table settings as select singleton,inventory_advisor_id,team_advisor_ids from confort4.settings;
create temp table closed_properties(property_id uuid primary key,title text,photo text,location text,status text,cancelled boolean default false,published_price numeric,currency text,recorded_at timestamptz default now());
create or replace function pg_temp.record_closed_property()
returns trigger language plpgsql security definer set search_path='' as $$
declare cancelled_source boolean := false;
begin
 if tg_op='UPDATE' then
  if new.estatus='publicada' then return new; end if;
  cancelled_source := new.estatus ilike '%cancel%';
  if old.estatus<>'publicada' then
   if cancelled_source then update pg_temp.closed_properties set cancelled=true where property_id=old.id;end if;
   return new;
  end if;
 end if;
 if old.estatus='publicada' and exists(select 1 from pg_temp.settings s where s.singleton and
  (old.asesor_id=any(s.team_advisor_ids) or old.asesor_kw_id=s.inventory_advisor_id)) then
  insert into pg_temp.closed_properties(property_id,title,photo,location,status,cancelled,published_price,currency)
  values(old.id,old.titulo,
   coalesce(case jsonb_typeof(old.imagenes->0) when 'string' then old.imagenes->>0 else old.imagenes->0->>'url' end,'assets/property-placeholder.svg'),
   concat_ws(' · ',old.colonia,old.municipio),
   case when lower(old.operacion) like '%rent%' then 'rentada' else 'vendida' end,cancelled_source,old.precio,old.moneda)
  on conflict(property_id) do update set title=excluded.title,photo=excluded.photo,location=excluded.location,status=excluded.status,
   cancelled=excluded.cancelled,published_price=excluded.published_price,currency=excluded.currency,recorded_at=now();
 end if;
 return case when tg_op='DELETE' then old else new end;
end $$;

create or replace function pg_temp.history_items(p_content jsonb)
returns jsonb language sql stable security invoker set search_path='' as $$
 with manual as (
  select item from jsonb_array_elements(coalesce(p_content#>'{transactions,items}','[]'::jsonb)) item
  where coalesce(item->>'cancelled','false')<>'true'
   and not exists(select 1 from pg_temp.closed_properties h where h.property_id::text=item->>'propertyId' and h.cancelled)
   and not exists(select 1 from pg_temp.propiedades p where p.id::text=item->>'propertyId' and p.estatus='publicada')
 ), automatic as (
  select jsonb_build_object('id','inventory-'||h.property_id::text,'propertyId',h.property_id,'title',h.title,'photo',h.photo,
   'location',h.location,'status',h.status,'published',true,'price',h.published_price,'currency',h.currency) as item
  from pg_temp.closed_properties h where not h.cancelled
   and not exists(select 1 from pg_temp.propiedades p where p.id=h.property_id and p.estatus='publicada')
   and not exists(select 1 from manual m where m.item->>'propertyId'=h.property_id::text)
 ) select coalesce(jsonb_agg(item),'[]'::jsonb) from (select item from manual union all select item from automatic) items;
$$;

create trigger capture after update of estatus on pg_temp.propiedades for each row execute function pg_temp.record_closed_property();
do $$ begin
 insert into pg_temp.propiedades select (jsonb_populate_record(null::public.propiedades,to_jsonb(p)||jsonb_build_object('id',md5('price')::uuid,'asesor_kw_id','2000102839','asesor_id',null,'estatus','publicada','operacion','venta','precio',1234567,'moneda','USD'))).* from public.propiedades p limit 1;
 update pg_temp.propiedades set estatus='suspendida',precio=99 where id=md5('price')::uuid;
 if (select published_price from pg_temp.closed_properties)<>1234567 or (select currency from pg_temp.closed_properties)<>'USD' then raise exception 'Last published price not captured';end if;
 if pg_temp.history_items('{}')#>>'{0,price}'<>'1234567' or pg_temp.history_items('{}')#>>'{0,currency}'<>'USD' then raise exception 'Price omitted from public history';end if;
 update pg_temp.propiedades set precio=1 where id=md5('price')::uuid;
 if (select published_price from pg_temp.closed_properties)<>1234567 then raise exception 'Inactive edits changed archived price';end if;
end $$;
rollback;
select 'PASS: last active price/currency retained, public feed includes price, inactive changes do not rewrite it' as verification;
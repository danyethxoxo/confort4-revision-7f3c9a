alter table confort4.closed_properties add column published_price numeric, add column currency text;
-- Recovered from the previously exported active listing, not a sale closing price.
update confort4.closed_properties set published_price=1450000,currency='USD' where property_id='b487a75d-10e5-4b14-86b5-9539984df359';

create or replace function confort4.record_closed_property()
returns trigger language plpgsql security definer set search_path='' as $$
declare cancelled_source boolean := false;
begin
 if tg_op='UPDATE' then
  if new.estatus='publicada' then return new; end if;
  cancelled_source := new.estatus ilike '%cancel%';
  if old.estatus<>'publicada' then
   if cancelled_source then update confort4.closed_properties set cancelled=true where property_id=old.id;end if;
   return new;
  end if;
 end if;
 if old.estatus='publicada' and exists(select 1 from confort4.settings s where s.singleton and
  (old.asesor_id=any(s.team_advisor_ids) or old.asesor_kw_id=s.inventory_advisor_id)) then
  insert into confort4.closed_properties(property_id,title,photo,location,status,cancelled,published_price,currency)
  values(old.id,old.titulo,
   coalesce(case jsonb_typeof(old.imagenes->0) when 'string' then old.imagenes->>0 else old.imagenes->0->>'url' end,'assets/property-placeholder.svg'),
   concat_ws(' · ',old.colonia,old.municipio),
   case when lower(old.operacion) like '%rent%' then 'rentada' else 'vendida' end,cancelled_source,old.precio,old.moneda)
  on conflict(property_id) do update set title=excluded.title,photo=excluded.photo,location=excluded.location,status=excluded.status,
   cancelled=excluded.cancelled,published_price=excluded.published_price,currency=excluded.currency,recorded_at=now();
 end if;
 return case when tg_op='DELETE' then old else new end;
end $$;

create or replace function confort4.history_items(p_content jsonb)
returns jsonb language sql stable security invoker set search_path='' as $$
 with manual as (
  select item from jsonb_array_elements(coalesce(p_content#>'{transactions,items}','[]'::jsonb)) item
  where coalesce(item->>'cancelled','false')<>'true'
   and not exists(select 1 from confort4.closed_properties h where h.property_id::text=item->>'propertyId' and h.cancelled)
   and not exists(select 1 from public.propiedades p where p.id::text=item->>'propertyId' and p.estatus='publicada')
 ), automatic as (
  select jsonb_build_object('id','inventory-'||h.property_id::text,'propertyId',h.property_id,'title',h.title,'photo',h.photo,
   'location',h.location,'status',h.status,'published',true,'price',h.published_price,'currency',h.currency) as item
  from confort4.closed_properties h where not h.cancelled
   and not exists(select 1 from public.propiedades p where p.id=h.property_id and p.estatus='publicada')
   and not exists(select 1 from manual m where m.item->>'propertyId'=h.property_id::text)
 ) select coalesce(jsonb_agg(item),'[]'::jsonb) from (select item from manual union all select item from automatic) items;
$$;

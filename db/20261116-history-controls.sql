-- Visibility is independent of the documented operation status.
alter table confort4.closed_properties drop constraint closed_properties_status_check;
alter table confort4.closed_properties add constraint closed_properties_status_check check(status in ('vendida','rentada','cancelada','fuera_del_mercado','expirada'));
alter table confort4.closed_properties add column visible boolean not null default true,
 add column source_reference text unique, add column source_details jsonb not null default '{}'::jsonb;
update confort4.closed_properties set visible=not cancelled,status=case when cancelled then 'cancelada' else status end;

create or replace function confort4.record_closed_property()
returns trigger language plpgsql security definer set search_path='' as $$
declare source_status text; history_status text;
begin
 if tg_op='UPDATE' then
  if new.estatus='publicada' then return new;end if;
  source_status:=lower(coalesce(new.estatus,''));
  if source_status like '%cancel%' then history_status:='cancelada';
  elsif source_status like '%expir%' then history_status:='expirada';
  elsif source_status in ('withdrawn','off market','fuera_del_mercado','retirada') then history_status:='fuera_del_mercado';end if;
  if old.estatus<>'publicada' then
   if history_status is not null and old.estatus is distinct from new.estatus then update confort4.closed_properties set status=history_status,visible=false,cancelled=history_status='cancelada' where property_id=old.id;end if;
   return new;
  end if;
 end if;
 if old.estatus='publicada' and exists(select 1 from confort4.settings s where s.singleton and
  (old.asesor_id=any(s.team_advisor_ids) or old.asesor_kw_id=s.inventory_advisor_id)) then
  insert into confort4.closed_properties(property_id,title,photo,location,status,cancelled,visible,published_price,currency)
  values(old.id,old.titulo,
   coalesce(case jsonb_typeof(old.imagenes->0) when 'string' then old.imagenes->>0 else old.imagenes->0->>'url' end,'assets/property-placeholder.svg'),
   concat_ws(' · ',old.colonia,old.municipio),
   coalesce(history_status,case when lower(old.operacion) like '%rent%' then 'rentada' else 'vendida' end),
   coalesce(history_status='cancelada',false),history_status is null,old.precio,old.moneda)
  on conflict(property_id) do update set title=excluded.title,photo=excluded.photo,location=excluded.location,status=excluded.status,
   cancelled=excluded.cancelled,visible=excluded.visible,published_price=excluded.published_price,currency=excluded.currency,recorded_at=now();
 end if;
 return case when tg_op='DELETE' then old else new end;
end $$;

create or replace function confort4.history_items(p_content jsonb)
returns jsonb language sql stable security invoker set search_path='' as $$
 with manual as (
  select item from jsonb_array_elements(coalesce(p_content#>'{transactions,items}','[]'::jsonb)) item
  where coalesce(item->>'cancelled','false')<>'true'
   -- Database rows are authoritative, including status/visibility overrides.
   and not exists(select 1 from confort4.closed_properties h where h.property_id::text=item->>'propertyId')
   and not exists(select 1 from public.propiedades p where p.id::text=item->>'propertyId' and p.estatus='publicada')
 ), automatic as (
  select jsonb_build_object('id','inventory-'||h.property_id::text,'propertyId',h.property_id,'title',h.title,'photo',h.photo,
   'location',h.location,'status',h.status,'published',true,'price',h.published_price,'currency',h.currency) as item
  from confort4.closed_properties h where h.visible
   and not exists(select 1 from public.propiedades p where p.id=h.property_id and p.estatus='publicada')
 ) select coalesce(jsonb_agg(item),'[]'::jsonb) from (select item from manual union all select item from automatic) items;
$$;

-- New RPC avoids ambiguous overloads and supports older deployed clients.
create function public.confort4_history_manage(p_user uuid,p_id uuid default null,p_status text default null,p_visible boolean default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare member_role text; result jsonb;
begin
 select role into member_role from confort4.members where user_id=p_user;
 if member_role is null then raise exception 'not_a_member';end if;
 if p_id is not null then
  if member_role<>'admin' then raise exception 'admin_required';end if;
  if p_status is null or p_status not in ('vendida','rentada','cancelada','fuera_del_mercado','expirada') or p_visible is null then raise exception 'invalid_history_status';end if;
  update confort4.closed_properties set status=p_status,visible=p_visible,cancelled=p_status='cancelada' where property_id=p_id;
  if not found then raise exception 'history_missing';end if;
  insert into confort4.audit(actor,action,detail) values(p_user,'history_update',jsonb_build_object('property_id',p_id,'status',p_status,'visible',p_visible));
 end if;
 select coalesce(jsonb_agg(to_jsonb(h)||jsonb_build_object('currently_active',exists(select 1 from public.propiedades p where p.id=h.property_id and p.estatus='publicada')) order by recorded_at desc,property_id),'[]'::jsonb) into result from confort4.closed_properties h;
 return result;
end $$;
revoke all on function public.confort4_history_manage(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.confort4_history_manage(uuid,uuid,text,boolean) to service_role;

create or replace function public.confort4_history_admin(p_user uuid,p_id uuid default null,p_cancelled boolean default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare previous_status text;
begin
 if p_id is null then return public.confort4_history_manage(p_user);end if;
 if p_cancelled is null then raise exception 'invalid_history_status';end if;
 select status into previous_status from confort4.closed_properties where property_id=p_id;
 return public.confort4_history_manage(p_user,p_id,case when p_cancelled then 'cancelada' else coalesce(previous_status,'vendida') end,not p_cancelled);
end $$;

create table confort4.closed_properties (
 property_id uuid primary key,
 title text not null,
 photo text not null,
 location text not null default '',
 status text not null check(status in ('vendida','rentada')),
 cancelled boolean not null default false,
 recorded_at timestamptz not null default now()
);
alter table confort4.closed_properties enable row level security;
revoke all on confort4.closed_properties from public,anon,authenticated;
grant select,insert,update,delete on confort4.closed_properties to service_role;

-- Owner policy: a previously active team listing leaving the feed is a completed
-- transaction unless explicitly cancelled. This does not alter the KW source.
create function confort4.record_closed_property()
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
  insert into confort4.closed_properties(property_id,title,photo,location,status,cancelled)
  values(old.id,old.titulo,
   coalesce(case jsonb_typeof(old.imagenes->0) when 'string' then old.imagenes->>0 else old.imagenes->0->>'url' end,'assets/property-placeholder.svg'),
   concat_ws(' · ',old.colonia,old.municipio),
   case when lower(old.operacion) like '%rent%' then 'rentada' else 'vendida' end,cancelled_source)
  on conflict(property_id) do update set title=excluded.title,photo=excluded.photo,location=excluded.location,status=excluded.status,
   cancelled=excluded.cancelled,recorded_at=now();
 end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
revoke all on function confort4.record_closed_property() from public,anon,authenticated;
create trigger confort4_record_closed_property after update of estatus or delete on public.propiedades
for each row execute function confort4.record_closed_property();

create function confort4.history_items(p_content jsonb)
returns jsonb language sql stable security invoker set search_path='' as $$
 with manual as (
  select item from jsonb_array_elements(coalesce(p_content#>'{transactions,items}','[]'::jsonb)) item
  where coalesce(item->>'cancelled','false')<>'true'
   and not exists(select 1 from confort4.closed_properties h where h.property_id::text=item->>'propertyId' and h.cancelled)
   and not exists(select 1 from public.propiedades p where p.id::text=item->>'propertyId' and p.estatus='publicada')
 ), automatic as (
  select jsonb_build_object('id','inventory-'||h.property_id::text,'propertyId',h.property_id,'title',h.title,'photo',h.photo,
   'location',h.location,'status',h.status,'published',true) as item
  from confort4.closed_properties h where not h.cancelled
   and not exists(select 1 from public.propiedades p where p.id=h.property_id and p.estatus='publicada')
   and not exists(select 1 from manual m where m.item->>'propertyId'=h.property_id::text)
 ) select coalesce(jsonb_agg(item),'[]'::jsonb) from (select item from manual union all select item from automatic) items;
$$;
revoke all on function confort4.history_items(jsonb) from public,anon,authenticated;
grant execute on function confort4.history_items(jsonb) to service_role;

create function public.confort4_history_admin(p_user uuid,p_id uuid default null,p_cancelled boolean default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare member_role text; result jsonb;
begin
 select role into member_role from confort4.members where user_id=p_user;
 if member_role is null then raise exception 'not_a_member';end if;
 if p_id is not null then
  if member_role<>'admin' then raise exception 'admin_required';end if;
  if p_cancelled is null then raise exception 'invalid_history_status';end if;
  update confort4.closed_properties set cancelled=p_cancelled where property_id=p_id;
  if not found then raise exception 'history_missing';end if;
  insert into confort4.audit(actor,action,detail) values(p_user,'history_visibility',jsonb_build_object('property_id',p_id,'cancelled',p_cancelled));
 end if;
 select coalesce(jsonb_agg(to_jsonb(h) order by recorded_at desc,property_id),'[]'::jsonb) into result from confort4.closed_properties h;
 return result;
end $$;
revoke all on function public.confort4_history_admin(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.confort4_history_admin(uuid,uuid,boolean) to service_role;

create or replace function public.confort4_public_site()
returns jsonb language sql security invoker set search_path='' as $$
 select jsonb_build_object(
  'content',jsonb_set(c.published,'{transactions}',coalesce(c.published->'transactions','{}'::jsonb)||jsonb_build_object('items',confort4.history_items(c.published))),
  'revision',c.revision,'properties',public.confort4_inventory(),
  'reviews',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.payload->>'name','rating',(s.payload->>'rating')::integer,
   'message',s.payload->>'message','created_at',s.created_at) order by s.created_at desc,s.id desc),'[]'::jsonb)
   from(select id,payload,created_at from confort4.submissions where kind='review' and moderation_status='approved'
    and payload->>'publishConsent'='true' order by created_at desc,id desc limit 100)s)
 ) from confort4.content c where c.id;
$$;

-- The owner explicitly confirmed this listing for the initial sold history.
insert into confort4.closed_properties(property_id,title,photo,location,status)
select id,titulo,coalesce(case jsonb_typeof(imagenes->0) when 'string' then imagenes->>0 else imagenes->0->>'url' end,'assets/property-placeholder.svg'),concat_ws(' · ',colonia,municipio),'vendida'
from public.propiedades where id='b487a75d-10e5-4b14-86b5-9539984df359' and estatus<>'publicada';

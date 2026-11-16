begin;
create temp table propiedades as select * from public.propiedades with no data;
create temp table settings as select singleton,inventory_advisor_id,team_advisor_ids from confort4.settings;
create temp table closed_properties(property_id uuid primary key,title text not null,photo text not null,location text not null,status text not null,cancelled boolean not null default false,recorded_at timestamptz not null default now());
create temp table members(user_id uuid,role text);
create temp table audit(actor uuid,action text,detail jsonb);
create function pg_temp.record_closed_property()
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
  insert into pg_temp.closed_properties(property_id,title,photo,location,status,cancelled)
  values(old.id,old.titulo,
   coalesce(case jsonb_typeof(old.imagenes->0) when 'string' then old.imagenes->>0 else old.imagenes->0->>'url' end,'assets/property-placeholder.svg'),
   concat_ws(' · ',old.colonia,old.municipio),
   case when lower(old.operacion) like '%rent%' then 'rentada' else 'vendida' end,cancelled_source)
  on conflict(property_id) do update set title=excluded.title,photo=excluded.photo,location=excluded.location,status=excluded.status,
   cancelled=excluded.cancelled,recorded_at=now();
 end if;
 return case when tg_op='DELETE' then old else new end;
end $$;

create trigger confort4_record_closed_property after update of estatus or delete on pg_temp.propiedades
for each row execute function pg_temp.record_closed_property();

create function pg_temp.history_items(p_content jsonb)
returns jsonb language sql stable security invoker set search_path='' as $$
 with manual as (
  select item from jsonb_array_elements(coalesce(p_content#>'{transactions,items}','[]'::jsonb)) item
  where coalesce(item->>'cancelled','false')<>'true'
   and not exists(select 1 from pg_temp.closed_properties h where h.property_id::text=item->>'propertyId' and h.cancelled)
   and not exists(select 1 from pg_temp.propiedades p where p.id::text=item->>'propertyId' and p.estatus='publicada')
 ), automatic as (
  select jsonb_build_object('id','inventory-'||h.property_id::text,'propertyId',h.property_id,'title',h.title,'photo',h.photo,
   'location',h.location,'status',h.status,'published',true) as item
  from pg_temp.closed_properties h where not h.cancelled
   and not exists(select 1 from pg_temp.propiedades p where p.id=h.property_id and p.estatus='publicada')
   and not exists(select 1 from manual m where m.item->>'propertyId'=h.property_id::text)
 ) select coalesce(jsonb_agg(item),'[]'::jsonb) from (select item from manual union all select item from automatic) items;
$$;



create function pg_temp.history_admin(p_user uuid,p_id uuid default null,p_cancelled boolean default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare member_role text; result jsonb;
begin
 select role into member_role from pg_temp.members where user_id=p_user;
 if member_role is null then raise exception 'not_a_member';end if;
 if p_id is not null then
  if member_role<>'admin' then raise exception 'admin_required';end if;
  if p_cancelled is null then raise exception 'invalid_history_status';end if;
  update pg_temp.closed_properties set cancelled=p_cancelled where property_id=p_id;
  if not found then raise exception 'history_missing';end if;
  insert into pg_temp.audit(actor,action,detail) values(p_user,'history_visibility',jsonb_build_object('property_id',p_id,'cancelled',p_cancelled));
 end if;
 select coalesce(jsonb_agg(to_jsonb(h) order by recorded_at desc,property_id),'[]'::jsonb) into result from pg_temp.closed_properties h;
 return result;
end $$;




do $$ declare n integer; begin
 for n in 1..5 loop
  insert into pg_temp.propiedades select (jsonb_populate_record(null::public.propiedades,to_jsonb(p)||jsonb_build_object('id',md5(n::text)::uuid,'asesor_kw_id',case when n=3 then 'external' else '2000102839' end,'asesor_id',null,'operacion',case when n=2 then 'renta' else 'venta' end,'estatus','publicada'))).* from public.propiedades p limit 1;
 end loop;
 update pg_temp.propiedades set estatus='suspendida' where id in (md5('1')::uuid,md5('2')::uuid,md5('3')::uuid);
 if (select count(*) from pg_temp.closed_properties)<>2 then raise exception 'Must archive team listings only';end if;
 if (select status from pg_temp.closed_properties where property_id=md5('1')::uuid)<>'vendida' or (select status from pg_temp.closed_properties where property_id=md5('2')::uuid)<>'rentada' then raise exception 'Wrong operation labels';end if;
 update pg_temp.propiedades set estatus='publicada' where id=md5('2')::uuid;
 if jsonb_array_length(pg_temp.history_items('{}'))<>1 then raise exception 'Reactivated property exposed as closed';end if;
 update pg_temp.propiedades set estatus='cancelada' where id=md5('5')::uuid;
 if jsonb_array_length(pg_temp.history_items('{}'))<>1 then raise exception 'Cancelled source exposed';end if;
 delete from pg_temp.propiedades where id=md5('4')::uuid;
 if jsonb_array_length(pg_temp.history_items('{}'))<>2 then raise exception 'Deleted listing lost history';end if;
 insert into pg_temp.members values(md5('admin')::uuid,'admin'),(md5('editor')::uuid,'editor');
 begin perform pg_temp.history_admin(md5('outsider')::uuid);raise exception 'Nonmember accepted';exception when others then if sqlerrm<>'not_a_member' then raise;end if;end;
 begin perform pg_temp.history_admin(md5('editor')::uuid,md5('1')::uuid,true);raise exception 'Editor altered cancellation';exception when others then if sqlerrm<>'admin_required' then raise;end if;end;
 perform pg_temp.history_admin(md5('admin')::uuid,md5('1')::uuid,true);
 if jsonb_array_length(pg_temp.history_items('{}'))<>1 then raise exception 'Cancellation not excluded';end if;
 perform pg_temp.history_admin(md5('admin')::uuid,md5('1')::uuid,false);
 if jsonb_array_length(pg_temp.history_items('{}'))<>2 then raise exception 'Restore failed';end if;
end $$;
rollback;
select 'PASS: own sale/rent, external exclusion, reactivation, cancellation, deletion and admin authorization' as verification;
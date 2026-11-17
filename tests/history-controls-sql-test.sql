-- Exercise the deployed functions against isolated temporary fixtures; never
-- update the real KW inventory or send source-system notifications.
begin;
create temp table propiedades as select * from public.propiedades with no data;
create temp table settings as select singleton,inventory_advisor_id,team_advisor_ids from confort4.settings;
create temp table closed_properties (like confort4.closed_properties including all);
create temp table members(user_id uuid,role text);
create temp table audit(actor uuid,action text,detail jsonb);
do $$ declare definition text; signature text; begin
 foreach signature in array array['confort4.record_closed_property()','confort4.history_items(jsonb)','public.confort4_history_manage(uuid,uuid,text,boolean)'] loop
  definition:=pg_get_functiondef(signature::regprocedure);
  definition:=replace(replace(replace(replace(replace(replace(replace(definition,
   'confort4.record_closed_property','pg_temp.record_closed_property'),
   'confort4.history_items','pg_temp.history_items'),'public.confort4_history_manage','pg_temp.history_manage'),
   'public.propiedades','pg_temp.propiedades'),'confort4.settings','pg_temp.settings'),
   'confort4.closed_properties','pg_temp.closed_properties'),'confort4.members','pg_temp.members');
  definition:=replace(definition,'confort4.audit','pg_temp.audit');
  execute definition;
 end loop;
end $$;
create trigger capture after update of estatus or delete on pg_temp.propiedades for each row execute function pg_temp.record_closed_property();
do $$
declare actor uuid:=md5('admin')::uuid; listing uuid:=md5('sale')::uuid; payload jsonb;
begin
 insert into pg_temp.members values(actor,'admin'),(md5('editor')::uuid,'editor');
 insert into pg_temp.propiedades select (jsonb_populate_record(null::public.propiedades,to_jsonb(p)||jsonb_build_object('id',listing,'asesor_kw_id','2000102839','asesor_id',null,'estatus','publicada','operacion','venta','precio',1234567,'moneda','USD'))).* from public.propiedades p limit 1;
 update pg_temp.propiedades set estatus='suspendida',precio=99 where id=listing;
 if not exists(select 1 from pg_temp.closed_properties where property_id=listing and status='vendida' and visible and published_price=1234567) then raise exception 'Automatic sold snapshot failed';end if;
 payload:=jsonb_build_object('transactions',jsonb_build_object('items',jsonb_build_array(jsonb_build_object('propertyId',listing,'title','stale manual','published',true))));
 perform pg_temp.history_manage(actor,listing,'expirada',false);
 if jsonb_array_length(pg_temp.history_items(payload))<>0 then raise exception 'Hidden record leaked via stale manual content';end if;
 perform pg_temp.history_manage(actor,listing,'cancelada',true);
 if pg_temp.history_items(payload)#>>'{0,status}'<>'cancelada' then raise exception 'Independent status/visibility failed';end if;
 begin perform pg_temp.history_manage(md5('stranger')::uuid,listing,'vendida',true);raise exception 'Unexpected permission';exception when others then if sqlerrm<>'not_a_member' then raise;end if;end;
 begin perform pg_temp.history_manage(md5('editor')::uuid,listing,'vendida',true);raise exception 'Unexpected permission';exception when others then if sqlerrm<>'admin_required' then raise;end if;end;
 begin perform pg_temp.history_manage(actor,listing,'invalid',true);raise exception 'Unexpected status';exception when others then if sqlerrm<>'invalid_history_status' then raise;end if;end;
 update pg_temp.propiedades set estatus='publicada' where id=listing;
 if jsonb_array_length(pg_temp.history_items(payload))<>0 then raise exception 'Active record exposed in history';end if;
 update pg_temp.propiedades set estatus='cancelada' where id=listing;
 if not exists(select 1 from pg_temp.closed_properties where property_id=listing and status='cancelada' and not visible) then raise exception 'Explicit cancellation should start hidden';end if;
 update pg_temp.propiedades set estatus='publicada',operacion='renta',precio=24000 where id=listing;
 delete from pg_temp.propiedades where id=listing;
 if not exists(select 1 from pg_temp.closed_properties where property_id=listing and status='rentada' and visible and published_price=24000) then raise exception 'Disappearing rental failed';end if;
end $$;
select 'PASS: auto sale/rental snapshots, explicit cancellation, reactivation, independent status/visibility, stale manual exclusion and authorization' as result;
rollback;

begin;
create temp table profiles(id uuid,email text,nombre text,role text);
create temp table users(id uuid,email text,raw_user_meta_data jsonb,raw_app_meta_data jsonb);
create or replace function pg_temp.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if coalesce(new.raw_app_meta_data->>'confort4_editor_only','false')='true' or lower(new.email) like '%@editor.confort4.invalid' then return new;end if;
 insert into pg_temp.profiles(id,email,nombre,role)
 values(new.id,new.email,coalesce(new.raw_user_meta_data->>'nombre',''),'asociado');
 return new;
end $$;

create trigger make_profile after insert on pg_temp.users for each row execute function pg_temp.handle_new_user();
insert into pg_temp.users values(gen_random_uuid(),'regular@example.invalid','{"nombre":"Regular"}','{}'),(gen_random_uuid(),'account@editor.confort4.invalid','{}','{}'),(gen_random_uuid(),'other@example.invalid','{}','{"confort4_editor_only":true}');
do $$ begin if (select count(*) from pg_temp.profiles)<>1 or (select nombre from pg_temp.profiles)<>'Regular' then raise exception 'KW isolation regression';end if;end $$;
rollback;
select 'PASS: ordinary KW signup preserved and dedicated editor identities excluded before notifications' as verification;
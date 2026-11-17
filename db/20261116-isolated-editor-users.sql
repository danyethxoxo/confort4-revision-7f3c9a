-- Auth users dedicated to the editor must not enter the KW roster or generate
-- KW new-advisor notifications. Only the Auth admin API can set app_metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if coalesce(new.raw_app_meta_data->>'confort4_editor_only','false')='true' or lower(new.email) like '%@editor.confort4.invalid' then return new;end if;
 insert into public.profiles(id,email,nombre,role)
 values(new.id,new.email,coalesce(new.raw_user_meta_data->>'nombre',''),'asociado');
 return new;
end $$;

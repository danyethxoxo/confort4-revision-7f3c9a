create table confort4.editor_usernames (
 username text primary key check(username ~ '^[a-z][a-z0-9_]{2,31}$'),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table confort4.editor_usernames enable row level security;
revoke all on confort4.editor_usernames from public,anon,authenticated;
grant select,insert,update,delete on confort4.editor_usernames to service_role;
create function public.confort4_username_email(p_username text)
returns text language sql stable security definer set search_path='' as $$
 select u.email from confort4.editor_usernames n join auth.users u on u.id=n.user_id
 join confort4.members m on m.user_id=n.user_id where n.username=lower(trim(p_username));
$$;
revoke all on function public.confort4_username_email(text) from public,anon,authenticated;
grant execute on function public.confort4_username_email(text) to service_role;

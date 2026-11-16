create table confort4.api_limits (
 scope text not null,subject_hash text not null,window_start bigint not null,hits integer not null,
 expires_at timestamptz not null,primary key(scope,subject_hash,window_start)
);
create index confort4_limits_expiry on confort4.api_limits(expires_at);
alter table confort4.api_limits enable row level security;
revoke all on confort4.api_limits from public,anon,authenticated;
grant select,insert,update,delete on confort4.api_limits to service_role;
create function public.confort4_rate_gate(p_scope text,p_subject text,p_limit integer,p_seconds integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare current_window bigint;total integer;
begin
 if p_limit not between 1 and 600 or p_seconds not in (60,900) or p_subject !~ '^[a-f0-9]{64}$' or length(p_scope)>40 then raise exception 'invalid_rate_bucket';end if;
 current_window:=floor(extract(epoch from clock_timestamp())/p_seconds)::bigint*p_seconds;
 delete from confort4.api_limits where expires_at<now();
 insert into confort4.api_limits(scope,subject_hash,window_start,hits,expires_at)
 values(p_scope,p_subject,current_window,1,to_timestamp(current_window+p_seconds)+interval '1 hour')
 on conflict(scope,subject_hash,window_start) do update set hits=confort4.api_limits.hits+1 returning hits into total;
 return total<=p_limit;
end $$;
revoke all on function public.confort4_rate_gate(text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.confort4_rate_gate(text,text,integer,integer) to service_role;
create function public.confort4_actor_role(p_user uuid)
returns text language sql stable security invoker set search_path='' as $$ select role from confort4.members where user_id=p_user; $$;
revoke all on function public.confort4_actor_role(uuid) from public,anon,authenticated;
grant execute on function public.confort4_actor_role(uuid) to service_role;

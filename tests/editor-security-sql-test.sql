begin;
create temp table api_limits(scope text,subject_hash text,window_start bigint,hits integer,expires_at timestamptz,primary key(scope,subject_hash,window_start));
create function pg_temp.rate_gate(p_scope text,p_subject text,p_limit integer,p_seconds integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare current_window bigint;total integer;
begin
 if p_limit not between 1 and 600 or p_seconds not in (60,900) or p_subject !~ '^[a-f0-9]{64}$' or length(p_scope)>40 then raise exception 'invalid_rate_bucket';end if;
 current_window:=floor(extract(epoch from clock_timestamp())/p_seconds)::bigint*p_seconds;
 delete from pg_temp.api_limits where expires_at<now();
 insert into pg_temp.api_limits(scope,subject_hash,window_start,hits,expires_at)
 values(p_scope,p_subject,current_window,1,to_timestamp(current_window+p_seconds)+interval '1 hour')
 on conflict(scope,subject_hash,window_start) do update set hits=pg_temp.api_limits.hits+1 returning hits into total;
 return total<=p_limit;
end $$;

do $$ declare n integer; begin
 for n in 1..10 loop if not pg_temp.rate_gate('login',repeat('a',64),10,900) then raise exception 'Rate allowed too few attempts';end if;end loop;
 if pg_temp.rate_gate('login',repeat('a',64),10,900) then raise exception 'Excess login allowed';end if;
 if not pg_temp.rate_gate('login',repeat('b',64),10,900) then raise exception 'Independent account blocked';end if;
 if not pg_temp.rate_gate('editor',repeat('a',64),60,60) then raise exception 'Independent action blocked';end if;
 begin perform pg_temp.rate_gate('login','invalid hash',10,900);raise exception 'Invalid subject accepted';exception when others then if sqlerrm<>'invalid_rate_bucket' then raise;end if;end;
end $$;
rollback;
select 'PASS: durable atomic limits, account/action isolation and invalid-key rejection' as verification;
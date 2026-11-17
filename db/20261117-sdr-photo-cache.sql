-- Public delivery of verified SDR derivatives; only the service can write.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('confort4-property-sdr','confort4-property-sdr',true,320000,array['image/webp'])
on conflict(id) do update set public=true,file_size_limit=320000,allowed_mime_types=array['image/webp'];
create policy confort4_sdr_server_only on storage.objects as restrictive for all to anon,authenticated
using (bucket_id <> 'confort4-property-sdr') with check (bucket_id <> 'confort4-property-sdr');

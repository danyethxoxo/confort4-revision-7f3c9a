-- Only editorial members may resolve the original listing advisor's public KW profile.
create or replace function public.confort4_advisor_cards(p_user uuid,p_items jsonb)
returns jsonb language sql security invoker set search_path='' as $$
 select case when exists(select 1 from confort4.members where user_id=p_user) then
 coalesce((select jsonb_agg(item||jsonb_build_object(
  'asesor_nombre',coalesce(p.asesor_nombre,item->>'asesor_nombre'),
  'asesor_perfil',case when coalesce(p.datos_origen#>>'{listado,Agent_ID}',p.datos_origen#>>'{detalle,data,Property_Agent,0,ID}',p.datos_origen#>>'{detalle,Property_Agent,0,ID}') ~ '^[0-9]{1,12}$'
   then 'https://www.kwmexico.mx/agentes/'||coalesce(p.datos_origen#>>'{listado,Agent_ID}',p.datos_origen#>>'{detalle,data,Property_Agent,0,ID}',p.datos_origen#>>'{detalle,Property_Agent,0,ID}')
   else null end) order by position)
 from jsonb_array_elements(p_items) with ordinality x(item,position)
 left join public.propiedades p on p.id=(item->>'id')::uuid),'[]'::jsonb)
 else '[]'::jsonb end
$$;
revoke all on function public.confort4_advisor_cards(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.confort4_advisor_cards(uuid,jsonb) to service_role;

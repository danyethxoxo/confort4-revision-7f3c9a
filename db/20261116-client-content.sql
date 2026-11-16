begin;
do $block$
declare actor uuid; clients jsonb := $json${"title":"Nuestros Clientes","intro":"Detrás de cada proyecto, hay personas. Gracias por dejarnos ser parte de su historia.","items":[{"id":"entrega","photo":"assets/clientes-entrega.webp","alt":"Alberto y Renata con una clienta en una entrega de obsequio","caption":"Gracias por la confianza, de principio a fin.","published":true},{"id":"familia","photo":"assets/clientes-familia.webp","alt":"Alberto y Renata en una fotografía con una familia y su perro","caption":"Personas, familias y nuevas historias por comenzar.","published":true},{"id":"celebracion","photo":"assets/clientes-celebracion.webp","alt":"El equipo Confort4 comparte un momento con sus clientes en un jardín","caption":"Compartir estos momentos es lo que más nos gusta de acompañarte.","published":true},{"id":"encuentro","photo":"assets/clientes-encuentro.webp","alt":"Alberto y Renata con un grupo de clientes en un encuentro","caption":"Tu proyecto también se vuelve parte de nuestra historia.","published":true}]}$json$; history jsonb := $json${"title":"Historias que ya encontraron su lugar.","intro":"Propiedades vendidas y rentadas con el acompañamiento de Confort4.","items":[]}$json$; moment jsonb := $json${"photo":"assets/equipo-kw.webp","caption":"Alberto y Renata, equipo Confort4 en KW México."}$json$;
begin
 perform 1 from confort4.content where id and revision=12 for update;
 if not found then raise exception 'version_conflict';end if;
 select m.user_id into actor from confort4.members m join auth.users u on u.id=m.user_id where lower(u.email)='dani.guerrero@kwmexico.mx' and m.role='admin';
 if actor is null then raise exception 'admin_missing';end if;
 insert into confort4.versions(content,actor) select published,actor from confort4.content where id;
 update confort4.content set
 draft=jsonb_set(jsonb_set(draft||jsonb_build_object('clients',clients,'transactions',coalesce(draft->'transactions',history)),'{team,cover}',to_jsonb('assets/equipo-jardin.webp'::text)),'{team,gallery}',coalesce(draft#>'{team,gallery}','[]'::jsonb)||case when exists(select 1 from jsonb_array_elements(coalesce(draft#>'{team,gallery}','[]'::jsonb)) item where item->>'photo'='assets/equipo-kw.webp') then '[]'::jsonb else jsonb_build_array(moment) end),
 published=jsonb_set(jsonb_set(published||jsonb_build_object('clients',clients,'transactions',coalesce(published->'transactions',history)),'{team,cover}',to_jsonb('assets/equipo-jardin.webp'::text)),'{team,gallery}',coalesce(published#>'{team,gallery}','[]'::jsonb)||case when exists(select 1 from jsonb_array_elements(coalesce(published#>'{team,gallery}','[]'::jsonb)) item where item->>'photo'='assets/equipo-kw.webp') then '[]'::jsonb else jsonb_build_array(moment) end),
 revision=revision+1,updated_at=now() where id;
 insert into confort4.audit(actor,action,detail) values(actor,'publish_client_gallery',jsonb_build_object('clients',4,'history_items',0,'source','owner_shared_photos_20261116'));
end $block$;
commit;
select revision,jsonb_array_length(published->'clients'->'items') as clients,jsonb_array_length(published->'transactions'->'items') as historical_operations from confort4.content;
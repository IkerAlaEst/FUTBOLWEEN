-- ============================================================================
--  CLASH FOOTBALLWEEN 2026 · CONTINUAR.SQL (ACTUALIZADO Y RE-EJECUTABLE)
--  Base de datos: clash_footballween en Supabase
-- ----------------------------------------------------------------------------
--  INSTRUCCIONES:
--    Puedes ejecutar este script completo en el SQL Editor de Supabase cuantas
--    veces quieras (es 100% idempotente y seguro).
--
--  NOVEDADES INCLUIDAS:
--    1. Dorsales de árbitro oficiales: 1, 2, 3 y 4 (sin 101, 102 ni 103).
--    2. Bloqueo de re-arbitraje: los partidos finalizados quedan blindados.
--    3. Solución RLS para la captura de Supabase:
--       `vista_arbitros`, `vista_clasificacion` y `vista_jugadores` ahora se
--       definen con `security_invoker = true` para que hereden y respeten las
--       políticas RLS de las tablas base, eliminando la etiqueta UNRESTRICTED.
--    4. Actualización del trigger de alta para dar siempre dorsal 4 al árbitro.
-- ============================================================================

begin;

-- ============================================================================
-- 1 · PLAZAS DE ÁRBITRO EN LA TABLA PERFILES
-- ============================================================================
alter table public.perfiles
  add column if not exists referee_slot int;

create unique index if not exists perfiles_referee_slot_unico
  on public.perfiles (referee_slot)
  where referee_slot is not null;

alter table public.perfiles
  drop constraint if exists arbitro_slot_valido;

alter table public.perfiles
  add constraint arbitro_slot_valido
  check (referee_slot is null or referee_slot between 1 and 4);

comment on column public.perfiles.referee_slot is
  'Plaza de árbitro 1-4. Solo para rol arbitro. NULL en jugadores y aficionados.';

-- Asegurar RLS en tablas base
alter table public.perfiles enable row level security;
alter table public.partidos enable row level security;

-- Políticas de lectura pública si no existían
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'perfiles' and policyname = 'Lectura pública de perfiles'
  ) then
    create policy "Lectura pública de perfiles" on public.perfiles for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'partidos' and policyname = 'Lectura pública de partidos'
  ) then
    create policy "Lectura pública de partidos" on public.partidos for select using (true);
  end if;
end $$;

-- ============================================================================
-- 2 · TRIGGER DE ALTA AUTOMÁTICA (HANDLE_NEW_USER)
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_rol       text  := coalesce(v_meta ->> 'rol', 'jugador');
  v_seed      int;
  v_numero    int;
  v_ref_slot  int;
  v_perfil_id uuid;
  v_nombre    text;
  v_email     text  := lower(new.email);
begin
  -- 1. Detección automática de administradores oficiales
  if v_email in (
    'asieratopeferri@gmail.com',
    'ikealaest@alu.edu.gva.es',
    'aarselsan@alu.edu.gva.es',
    'cesaroltrapart@gmail.com'
  ) then
    v_rol := 'admin';
  end if;

  if v_rol not in ('jugador', 'arbitro', 'usuario', 'admin') then
    v_rol := 'usuario';
  end if;

  v_nombre := coalesce(nullif(trim(v_meta ->> 'nombre_completo'), ''), 'Sin nombre');

  -- Dorsal de inscripción consecutivo para aficionados/usuarios
  select coalesce(max(player_number), 0) + 1 into v_numero from public.perfiles;

  -- 2. Jugador: ocupa el hueco seed 11 (16ª plaza) y dorsal 16
  if v_rol = 'jugador' then
    if exists (select 1 from public.perfiles where seed = 11) then
      raise exception 'El torneo ya tiene sus 16 plazas de jugador cubiertas.';
    end if;
    v_seed := 11;
    v_numero := 16;
  end if;

  -- 3. Árbitro: ocupa la primera plaza libre de las 4 y su dorsal es 1, 2, 3 o 4
  if v_rol = 'arbitro' then
    select s into v_ref_slot
    from generate_series(1, 4) as s
    where not exists (
      select 1 from public.perfiles p where p.referee_slot = s
    )
    order by s
    limit 1;

    if v_ref_slot is null then
      raise exception 'Ya hay 4 árbitros registrados en el torneo. No quedan plazas libres.';
    end if;
    v_numero := v_ref_slot;
  end if;

  insert into public.perfiles (
    user_id, email, nombre_completo, gamertag, rol, avatar_url, bio,
    club_nombre, club_short, club_badge, club_color, club_color2, club_stadium, liga,
    tipo_mando, zona, player_number, seed, referee_slot
  ) values (
    new.id,
    v_email,
    v_nombre,
    coalesce(nullif(trim(v_meta ->> 'gamertag'), ''), split_part(v_email, '@', 1)),
    v_rol,
    nullif(v_meta ->> 'avatar_url', ''),
    nullif(v_meta ->> 'bio', ''),
    nullif(v_meta ->> 'club_nombre', ''),
    nullif(v_meta ->> 'club_short', ''),
    nullif(v_meta ->> 'club_badge', ''),
    nullif(v_meta ->> 'club_color', ''),
    nullif(v_meta ->> 'club_color2', ''),
    nullif(v_meta ->> 'club_stadium', ''),
    nullif(v_meta ->> 'liga', ''),
    nullif(v_meta ->> 'tipo_mando', ''),
    nullif(v_meta ->> 'zona', ''),
    v_numero,
    v_seed,
    v_ref_slot
  )
  returning id into v_perfil_id;

  -- El jugador seed 11 entra como visitante en el partido 8
  if v_seed = 11 then
    update public.partidos
    set jugador_visitante_id = v_perfil_id
    where id = 8
      and jugador_visitante_id is null;
  end if;

  -- El árbitro registrado recibe automáticamente los partidos sin árbitro (partidos 14 y 15)
  if v_rol = 'arbitro' then
    update public.partidos
    set arbitro_id = v_perfil_id,
        arbitro_nombre = v_nombre
    where arbitro_id is null;
  end if;

  return new;
end;
$$;

-- Vincular trigger al registro de Auth
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 3 · 3 ÁRBITROS BASE (DORSALES OFICIALES 1, 2 Y 3)
-- ============================================================================
insert into public.perfiles (
  id, user_id, email, nombre_completo, gamertag, rol, avatar_url, zona,
  player_number, referee_slot
) values
  (
    '00000000-0000-4000-8000-000000000101', null,
    'juez.simarro@xativa.es', 'Andrés Simarro', 'Juez_Simarro', 'arbitro',
    null,
    'Aula de informática', 1, 1
  ),
  (
    '00000000-0000-4000-8000-000000000102', null,
    'juez.aula2@xativa.es', 'Lucía Ferrer', 'Juez_Aula2', 'arbitro',
    null,
    'Aula de informática', 2, 2
  ),
  (
    '00000000-0000-4000-8000-000000000103', null,
    'juez.castell@xativa.es', 'Pau Bellver', 'Juez_Castell', 'arbitro',
    null,
    'Castillo', 3, 3
  )
on conflict (id) do update set
  player_number = excluded.player_number,
  referee_slot  = excluded.referee_slot,
  nombre_completo = excluded.nombre_completo,
  gamertag      = excluded.gamertag,
  zona          = excluded.zona;

-- Por si ya se habían insertado previamente con 101, 102 y 103:
update public.perfiles
set player_number = 1, referee_slot = 1
where id = '00000000-0000-4000-8000-000000000101';

update public.perfiles
set player_number = 2, referee_slot = 2
where id = '00000000-0000-4000-8000-000000000102';

update public.perfiles
set player_number = 3, referee_slot = 3
where id = '00000000-0000-4000-8000-000000000103';

-- ============================================================================
-- 4 · ASIGNACIÓN DE PARTIDOS A LOS ÁRBITROS
-- ============================================================================
update public.partidos
set arbitro_id = '00000000-0000-4000-8000-000000000101',
    arbitro_nombre = 'Andrés Simarro'
where id in (5, 6)
  and (arbitro_id is null or arbitro_id = '00000000-0000-4000-8000-000000000101');

update public.partidos
set arbitro_id = '00000000-0000-4000-8000-000000000102',
    arbitro_nombre = 'Lucía Ferrer'
where id in (7, 8)
  and (arbitro_id is null or arbitro_id = '00000000-0000-4000-8000-000000000102');

update public.partidos
set arbitro_id = '00000000-0000-4000-8000-000000000103',
    arbitro_nombre = 'Pau Bellver'
where id in (11, 12)
  and (arbitro_id is null or arbitro_id = '00000000-0000-4000-8000-000000000103');

-- ============================================================================
-- 5 · TRIGGER ANTI RE-ARBITRAJE Y AVANCE DEL BRACKET
-- ============================================================================
create or replace function public.validar_partido()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_siguiente public.partidos%rowtype;
begin
  -- 1. BLOQUEO ANTI RE-ARBITRAJE:
  -- Si el partido ya estaba cerrado ('finalizado'), no se permite re-arbitrar
  -- a menos que el usuario sea administrador del sistema.
  if old.estado = 'finalizado' and new.estado = 'finalizado' and (
    old.goles_local <> new.goles_local or
    old.goles_visitante <> new.goles_visitante or
    old.ganador_id <> new.ganador_id
  ) then
    if not exists (
      select 1 from public.perfiles where user_id = auth.uid() and rol = 'admin'
    ) then
      raise exception 'Este partido ya ha sido arbitrado oficialmente. No se permite re-arbitrar encuentros finalizados.';
    end if;
  end if;

  -- 2. Avance de ronda al finalizar el partido
  if new.estado = 'finalizado' then
    if new.ganador_id is null then
      raise exception 'Un partido finalizado debe tener un ganador asignado.';
    end if;

    if new.siguiente_partido_id is not null then
      select * into v_siguiente
      from public.partidos
      where id = new.siguiente_partido_id;

      if found then
        -- Los partidos impares (1, 3, 5, 7, 9, 11, 13) entran como local,
        -- los pares (2, 4, 6, 8, 10, 12, 14) como visitante.
        if (new.id % 2 = 1) then
          update public.partidos
          set jugador_local_id = new.ganador_id
          where id = v_siguiente.id;
        else
          update public.partidos
          set jugador_visitante_id = new.ganador_id
          where id = v_siguiente.id;
        end if;
      end if;
    end if;

    -- Marcar al participante perdedor como eliminado
    update public.perfiles
    set is_eliminated = true
    where id in (new.jugador_local_id, new.jugador_visitante_id)
      and id <> new.ganador_id;
  end if;

  return new;
end;
$$;

drop trigger if exists partidos_validar on public.partidos;
create trigger partidos_validar
  before update of estado, ganador_id on public.partidos
  for each row execute function public.validar_partido();

-- ============================================================================
-- 6 · VISTAS CON SECURITY INVOKER (ELIMINA EL AVISO "UNRESTRICTED" EN SUPABASE)
-- ============================================================================
-- Al aplicar `with (security_invoker = true)` en Postgres 15+, las vistas
-- ejecutan con las credenciales y políticas RLS del usuario que consulta
-- (anon o authenticated), cumpliendo los requisitos de seguridad de Supabase.

-- A) VISTA DE ÁRBITROS
drop view if exists public.vista_arbitros cascade;

create view public.vista_arbitros
with (security_invoker = true)
as
select
  p.id,
  p.referee_slot,
  p.gamertag,
  p.nombre_completo,
  p.avatar_url,
  p.zona,
  p.player_number,
  p.created_at
from public.perfiles p
where p.rol = 'arbitro'
  and p.referee_slot is not null
order by p.referee_slot;

-- B) VISTA DE CLASIFICACIÓN (PARTIDOS + NOMBRES DE JUGADORES Y ÁRBITRO)
drop view if exists public.vista_clasificacion cascade;

create view public.vista_clasificacion
with (security_invoker = true)
as
select
  m.id,
  m.ronda,
  m.ronda_nombre,
  m.branch,
  m.slot_index,
  m.ubicacion,
  m.fecha,
  m.hora,
  m.estado,
  m.live_minute,
  m.goles_local,
  m.goles_visitante,
  m.ganador_id,
  m.siguiente_partido_id,
  coalesce(arb.nombre_completo, m.arbitro_nombre) as arbitro_nombre,
  m.estadisticas,
  m.eventos,
  m.jugador_local_id,
  local.gamertag   as local_gamertag,
  local.club_nombre as local_club,
  m.jugador_visitante_id,
  visitante.gamertag as visitante_gamertag,
  visitante.club_nombre as visitante_club
from public.partidos m
left join public.perfiles local     on local.id = m.jugador_local_id
left join public.perfiles visitante on visitante.id = m.jugador_visitante_id
left join public.perfiles arb       on arb.id = m.arbitro_id;

-- C) VISTA DE JUGADORES (ORDENADOS POR SEED)
drop view if exists public.vista_jugadores cascade;

create view public.vista_jugadores
with (security_invoker = true)
as
select
  p.id,
  p.seed,
  p.gamertag,
  p.nombre_completo,
  p.avatar_url,
  p.club_nombre,
  p.club_short,
  p.club_badge,
  p.club_color,
  p.club_color2,
  p.club_stadium,
  p.liga,
  p.tipo_mando,
  p.player_number,
  p.matches_played,
  p.goals_scored,
  p.goals_conceded,
  p.is_eliminated,
  p.created_at
from public.perfiles p
where p.rol = 'jugador'
  and p.seed is not null
order by p.seed;

-- Permisos de lectura pública para las 3 vistas
grant select on public.vista_arbitros to anon, authenticated;
grant select on public.vista_clasificacion to anon, authenticated;
grant select on public.vista_jugadores to anon, authenticated;

-- ============================================================================
-- 7 · RECARGAR CACHÉ DE POSTGREST
-- ============================================================================
notify pgrst, 'reload schema';

commit;

-- ============================================================================
-- COMPROBACIÓN RÁPIDA TRAS EJECUTAR:
-- ----------------------------------------------------------------------------
-- select referee_slot, player_number, nombre_completo from public.vista_arbitros;
-- -> Debe mostrar:
--    Plaza 1 / Dorsal 1: Andrés Simarro
--    Plaza 2 / Dorsal 2: Lucía Ferrer
--    Plaza 3 / Dorsal 3: Pau Bellver
--    (Y el 4º árbitro al registrarse obtendrá Plaza 4 / Dorsal 4)
-- ============================================================================

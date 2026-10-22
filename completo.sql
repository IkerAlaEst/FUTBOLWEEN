-- ============================================================================
--  CLASH FOOTBALLWEEN 2026 · XÀTIVA
--  Base de datos: clash_footballween
--  Script completo para Supabase (PostgreSQL 15+)
-- ----------------------------------------------------------------------------
--  QUÉ HACE ESTE FICHERO
--    1. Crea las tablas (perfiles, partidos, chat_mensajes), sus campos,
--       CHECKs, claves foráneas e índices.
--    2. Activa RLS en todas las tablas y define las políticas.
--    3. Crea el bucket de Storage "avatares" + sus políticas para las fotos
--       de perfil.
--    4. Crea triggers y funciones (perfil automático al registrarse, hueco 16,
--       validación de ganadores, updated_at, disponibilidad de email/gamertag).
--    5. Crea las vistas de clasificación y jugadores.
--    6. Inserta los 7 jugadores falsos de la mitad BBDD del cuadro, los
--       partidos del lado derecho del bracket (los 8 de BBDD), eventos,
--       estadísticas y los mensajes iniciales del chat.
--       La otra mitad del cuadro (8 jugadores / partidos 1-4, 9, 10 y 13)
--       vive en el código del frontend.
--       El hueco libre es el SEED #11 y lo ocupará el jugador que se registre.
--
--  CÓMO EJECUTARLO
--    · Supabase: abre SQL Editor → New query → pega TODO este fichero → Run.
--      El proyecto de Supabase ya ES la base de datos; si quieres que se llame
--      clash_footballween, usa ese nombre al crear el proyecto.
--    · PostgreSQL local: descomenta las dos líneas de la base de datos de abajo
--      y ejecuta el fichero con psql.
--
--  DESPUÉS DE EJECUTARLO
--    · Copia Project URL y anon public key (Settings → API) en
--      Web_Frontend/.env como VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
--    · Para que el registro devuelva sesión inmediata, desactiva
--      Authentication → Providers → Email → "Confirm email"
--      (o confirma el correo antes de subir la foto de perfil).
--    · AVISO: este script reinicia las tablas del torneo (DROP + CREATE).
-- ============================================================================

-- Para PostgreSQL local:
-- CREATE DATABASE clash_footballween;
-- \connect clash_footballween

-- ============================================================================
-- 0 · EXTENSIONES
-- ============================================================================
create extension if not exists pgcrypto;

-- ============================================================================
-- 1 · LIMPIEZA (permite ejecutar el script entero varias veces)
-- ============================================================================
drop trigger if exists on_auth_user_created on auth.users;

drop view if exists public.vista_clasificacion;
drop view if exists public.vista_jugadores;
drop table if exists public.chat_mensajes cascade;
drop table if exists public.partidos cascade;
drop table if exists public.perfiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.es_staff() cascade;
drop function if exists public.es_admin() cascade;
drop function if exists public.email_disponible(text) cascade;
drop function if exists public.gamertag_disponible(text) cascade;
drop function if exists public.validar_partido() cascade;
drop function if exists public.touch_updated_at() cascade;

drop policy if exists "avatares_lectura_publica" on storage.objects;
drop policy if exists "avatares_subida_propia" on storage.objects;
drop policy if exists "avatares_actualizacion_propia" on storage.objects;
drop policy if exists "avatares_borrado_propio" on storage.objects;

-- ============================================================================
-- 2 · TABLAS
-- ============================================================================

-- 2.1 PERFILES ---------------------------------------------------------------
-- Un registro por cuenta de Supabase Auth (user_id) o por jugador ficticio
-- (user_id NULL). Los equipos SÍ pueden repetirse; email y gamertag no.
create table public.perfiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique references auth.users (id) on delete cascade,
  email           text not null,
  nombre_completo text not null check (char_length(trim(nombre_completo)) >= 3),
  gamertag        text not null check (char_length(trim(gamertag)) >= 3),
  rol             text not null default 'jugador'
                  check (rol in ('jugador', 'arbitro', 'usuario', 'admin')),
  avatar_url      text,

  -- Club elegido (se guarda el snapshot para que el equipo pueda repetirse
  -- y para no depender de TheSportsDB en el cuadro).
  club_nombre     text,
  club_short      text,
  club_badge      text,
  club_color      text,
  club_color2     text,
  club_stadium    text,
  liga            text,

  tipo_mando      text check (tipo_mando in ('ps5', 'ps4', 'xbox', 'teclado', 'centro')),
  zona            text check (zona in ('Aula de informática', 'Castillo')),
  bio             text check (bio is null or char_length(bio) <= 140),

  -- Dorsal de inscripción y seed (posición 1-16 del cuadro).
  player_number   int unique,
  seed            int unique check (seed between 1 and 16),

  matches_played  int not null default 0 check (matches_played >= 0),
  goals_scored    int not null default 0 check (goals_scored >= 0),
  goals_conceded  int not null default 0 check (goals_conceded >= 0),
  is_eliminated   boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Un jugador del cuadro siempre tiene club y seed.
  constraint jugador_con_club_y_seed check (
    rol <> 'jugador' or (seed is not null and club_nombre is not null)
  )
);

-- Email y gamertag únicos sin distinguir mayúsculas/minúsculas.
create unique index perfiles_email_unico on public.perfiles (lower(email));
create unique index perfiles_gamertag_unico on public.perfiles (lower(gamertag));
create index perfiles_rol_idx on public.perfiles (rol);
create index perfiles_seed_idx on public.perfiles (seed);

comment on table public.perfiles is
  'Cuentas y jugadores del torneo. user_id NULL = jugador ficticio insertado por el .sql.';
comment on column public.perfiles.seed is
  'Posición 1-16 en el cuadro. El seed 11 es el hueco reservado al jugador que se registre.';

-- 2.2 PARTIDOS ---------------------------------------------------------------
-- El lado derecho del cuadro (5-8, 11, 12, 14 y 15) vive aquí.
-- El lado izquierdo (1-4, 9, 10 y 13) es el que está fijo en el frontend.
create table public.partidos (
  id                    int primary key check (id between 1 and 15),
  ronda                 int not null check (ronda between 1 and 4),
  ronda_nombre          text not null,
  branch                text not null check (branch in ('left', 'right', 'center')),
  slot_index            int not null default 0,
  ubicacion             text not null check (ubicacion in ('aula', 'castell')),
  fecha                 date not null default date '2026-10-31',
  hora                  time not null,

  jugador_local_id      uuid references public.perfiles (id) on delete set null,
  jugador_visitante_id  uuid references public.perfiles (id) on delete set null,

  goles_local           int not null default 0 check (goles_local >= 0),
  goles_visitante       int not null default 0 check (goles_visitante >= 0),
  estado                text not null default 'pendiente'
                        check (estado in ('pendiente', 'en_curso', 'finalizado')),
  live_minute           int check (live_minute is null or live_minute between 0 and 120),

  ganador_id            uuid references public.perfiles (id) on delete set null,
  arbitro_id            uuid references public.perfiles (id) on delete set null,
  arbitro_nombre        text,

  siguiente_partido_id  int references public.partidos (id) on delete set null,
  incidencias           text,

  estadisticas          jsonb not null default '{}'::jsonb,
  eventos               jsonb not null default '[]'::jsonb,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- El ganador solo puede ser uno de los dos participantes.
  constraint ganador_es_participante check (
    ganador_id is null
    or ganador_id = jugador_local_id
    or ganador_id = jugador_visitante_id
  ),
  -- Un partido en curso o finalizado necesita ambos participantes.
  constraint partido_con_participantes check (
    estado = 'pendiente' or (jugador_local_id is not null and jugador_visitante_id is not null)
  ),
  constraint local_y_visitante_distintos check (
    jugador_local_id is null
    or jugador_visitante_id is null
    or jugador_local_id <> jugador_visitante_id
  )
);

create index partidos_ronda_idx on public.partidos (ronda);
create index partidos_estado_idx on public.partidos (estado);

comment on table public.partidos is
  'Bracket del torneo. La mitad derecha se lee de aquí; la izquierda está fija en el código.';

-- 2.3 CHAT -------------------------------------------------------------------
create table public.chat_mensajes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  perfil_id   uuid references public.perfiles (id) on delete set null,
  user_nick   text not null check (char_length(trim(user_nick)) between 1 and 60),
  rol         text not null default 'usuario'
              check (rol in ('jugador', 'arbitro', 'usuario', 'admin')),
  mensaje     text not null check (char_length(trim(mensaje)) between 1 and 500),
  created_at  timestamptz not null default now()
);

create index chat_created_idx on public.chat_mensajes (created_at);

comment on table public.chat_mensajes is 'Chat en directo del torneo (lectura pública).';

-- ============================================================================
-- 3 · FUNCIONES Y TRIGGERS
-- ============================================================================

-- 3.1 updated_at automático --------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger perfiles_touch_updated_at
  before update on public.perfiles
  for each row execute function public.touch_updated_at();

create trigger partidos_touch_updated_at
  before update on public.partidos
  for each row execute function public.touch_updated_at();

-- 3.2 ¿El usuario autenticado es staff (admin o árbitro)? --------------------
create or replace function public.es_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.perfiles p
    where p.user_id = auth.uid()
      and p.rol in ('admin', 'arbitro')
  );
$$;

revoke all on function public.es_staff() from public;
grant execute on function public.es_staff() to authenticated;

-- ¿El usuario autenticado es administrador?
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.perfiles p
    where p.user_id = auth.uid()
      and p.rol = 'admin'
  );
$$;

revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to authenticated;

-- 3.3 Disponibilidad de email / gamertag (para validar antes de registrarse) --
create or replace function public.email_disponible(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from public.perfiles p
    where lower(p.email) = lower(trim(p_email))
  );
$$;

create or replace function public.gamertag_disponible(p_gamertag text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from public.perfiles p
    where lower(p.gamertag) = lower(trim(p_gamertag))
  );
$$;

grant execute on function public.email_disponible(text) to anon, authenticated;
grant execute on function public.gamertag_disponible(text) to anon, authenticated;

-- 3.4 Alta automática de perfil al registrarse en Supabase Auth --------------
-- Los datos llegan en raw_user_meta_data desde el formulario.
-- El jugador que se registre ocupa el SEED #11 (el hueco libre del cuadro).
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
  v_perfil_id uuid;
  v_email     text  := lower(new.email);
begin
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

  -- Dorsal de inscripción consecutivo.
  select coalesce(max(player_number), 0) + 1 into v_numero from public.perfiles;

  -- Solo los jugadores ocupan plaza en el cuadro.
  if v_rol = 'jugador' then
    if exists (select 1 from public.perfiles where seed = 11) then
      raise exception 'El torneo ya tiene sus 16 plazas cubiertas.';
    end if;
    v_seed := 11;
  end if;

  insert into public.perfiles (
    user_id, email, nombre_completo, gamertag, rol, avatar_url, bio,
    club_nombre, club_short, club_badge, club_color, club_color2, club_stadium, liga,
    tipo_mando, zona, player_number, seed
  ) values (
    new.id,
    v_email,
    coalesce(nullif(trim(v_meta ->> 'nombre_completo'), ''), 'Sin nombre'),
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
    v_seed
  )
  returning id into v_perfil_id;

  -- El jugador que ocupa el hueco (seed 11) entra directamente en el partido 8.
  if v_seed = 11 then
    update public.partidos
    set jugador_visitante_id = v_perfil_id
    where id = 8
      and jugador_visitante_id is null;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3.5 Validación de partidos ------------------------------------------------
-- Si se finaliza, exige un ganador y lo promociona a la siguiente ronda.
create or replace function public.validar_partido()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_siguiente public.partidos%rowtype;
begin
  if new.estado = 'finalizado' then
    if new.ganador_id is null then
      raise exception 'Un partido finalizado debe tener ganador.';
    end if;

    if new.siguiente_partido_id is not null then
      select * into v_siguiente
      from public.partidos
      where id = new.siguiente_partido_id;

      if found then
        if v_siguiente.jugador_local_id is null then
          update public.partidos
          set jugador_local_id = new.ganador_id
          where id = v_siguiente.id;
        elsif v_siguiente.jugador_visitante_id is null
              and v_siguiente.jugador_local_id <> new.ganador_id then
          update public.partidos
          set jugador_visitante_id = new.ganador_id
          where id = v_siguiente.id;
        end if;
      end if;
    end if;

    update public.perfiles
    set is_eliminated = true
    where id in (new.jugador_local_id, new.jugador_visitante_id)
      and id <> new.ganador_id;
  end if;

  return new;
end;
$$;

create trigger partidos_validar
  before update of estado, ganador_id on public.partidos
  for each row execute function public.validar_partido();

-- ============================================================================
-- 4 · RLS (Row Level Security)
-- ============================================================================
alter table public.perfiles       enable row level security;
alter table public.partidos       enable row level security;
alter table public.chat_mensajes  enable row level security;

-- 4.1 PERFILES ---------------------------------------------------------------
-- La tabla guarda emails, así que NO es de lectura pública: cada usuario lee
-- su propio perfil y el staff lee todos. La información del torneo se expone
-- sin datos personales a través de las vistas `vista_jugadores` y
-- `vista_clasificacion`.
create policy "perfiles_lectura_propia"
  on public.perfiles for select
  to authenticated
  using (user_id = auth.uid());

create policy "perfiles_lectura_staff"
  on public.perfiles for select
  to authenticated
  using (public.es_staff());

-- Cada usuario autenticado puede crear/editar su propio perfil.
create policy "perfiles_alta_propia"
  on public.perfiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "perfiles_edicion_propia"
  on public.perfiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- El staff puede editar cualquier perfil (resultados, sanciones, etc.).
create policy "perfiles_edicion_staff"
  on public.perfiles for update
  to authenticated
  using (public.es_staff())
  with check (public.es_staff());

create policy "perfiles_borrado_admin"
  on public.perfiles for delete
  to authenticated
  using (public.es_admin());

-- 4.2 PARTIDOS ---------------------------------------------------------------
create policy "partidos_lectura_publica"
  on public.partidos for select
  using (true);

create policy "partidos_alta_staff"
  on public.partidos for insert
  to authenticated
  with check (public.es_staff());

create policy "partidos_edicion_staff"
  on public.partidos for update
  to authenticated
  using (public.es_staff())
  with check (public.es_staff());

create policy "partidos_borrado_staff"
  on public.partidos for delete
  to authenticated
  using (public.es_staff());

-- 4.3 CHAT -------------------------------------------------------------------
create policy "chat_lectura_publica"
  on public.chat_mensajes for select
  using (true);

create policy "chat_envio_autenticado"
  on public.chat_mensajes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.perfiles p
      where p.id = perfil_id and p.user_id = auth.uid()
    )
  );

create policy "chat_borrado_admin"
  on public.chat_mensajes for delete
  to authenticated
  using (public.es_admin());

-- ============================================================================
-- 5 · PERMISOS
-- ============================================================================
grant usage on schema public to anon, authenticated;

grant select on public.partidos, public.chat_mensajes to anon, authenticated;
grant select on public.perfiles to authenticated;

-- El usuario solo puede editar las columnas "de perfil".
-- rol, seed, player_number, email y estadísticas quedan fuera: los gestiona
-- el trigger de alta o el staff desde la BBDD.
revoke update on public.perfiles from authenticated;
grant update (
  avatar_url, bio, nombre_completo, gamertag,
  club_nombre, club_short, club_badge, club_color, club_color2, club_stadium,
  liga, tipo_mando, zona
) on public.perfiles to authenticated;

grant insert on public.perfiles to authenticated;
grant insert, update, delete on public.partidos to authenticated;
grant insert on public.chat_mensajes to authenticated;
grant delete on public.chat_mensajes to authenticated;

-- ============================================================================
-- 6 · STORAGE · FOTOS DE PERFIL
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatares',
  'avatares',
  true,
  2097152, -- 2 MB
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública de las fotos.
create policy "avatares_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'avatares');

-- Cada usuario sube/edita/borra solo dentro de su carpeta: avatares/<uid>/...
create policy "avatares_subida_propia"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatares_actualizacion_propia"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatares_borrado_propio"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 7 · VISTAS
-- ============================================================================

-- Jugadores ordenados por seed (para la página de jugadores).
create or replace view public.vista_jugadores as
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

-- Clasificación completa (partidos + datos de ambos jugadores).
create or replace view public.vista_clasificacion as
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
  m.arbitro_nombre,
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
left join public.perfiles visitante on visitante.id = m.jugador_visitante_id;

grant select on public.vista_jugadores, public.vista_clasificacion
  to anon, authenticated;

-- ============================================================================
-- 8 · DATOS INICIALES
-- ============================================================================

-- 8.1 Los 7 jugadores falsos de la mitad BBDD -------------------------------
-- (Los otros 8 jugadores viven en el código del frontend.)
-- Dorsales 9-15; el dorsal 16 y el seed 11 quedan libres para el registro.
insert into public.perfiles (
  id, user_id, email, nombre_completo, gamertag, rol, avatar_url,
  club_nombre, club_short, club_badge, club_color, club_color2, club_stadium, liga,
  tipo_mando, player_number, seed, matches_played, goals_scored, goals_conceded,
  is_eliminated
) values
  (
    '00000000-0000-4000-8000-000000000009', null,
    'mateo.c@xativa.es', 'Mateo Calatayud', 'MateoWolf_88', 'jugador',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    'Inter de Milán', 'INT',
    'https://r2.thesportsdb.com/images/media/team/badge/ryhu6d1617113103.png',
    '#0068a8', '#000000', 'San Siro', 'Serie A',
    'ps5', 9, 2, 1, 2, 2, false
  ),
  (
    '00000000-0000-4000-8000-000000000010', null,
    'carla.f@xativa.es', 'Carla Ferri', 'CarlaSpider', 'jugador',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    'Paris Saint-Germain', 'PSG',
    'https://r2.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png',
    '#004170', '#da291c', 'Parc des Princes', 'Ligue 1',
    'xbox', 10, 15, 1, 2, 2, false
  ),
  (
    '00000000-0000-4000-8000-000000000011', null,
    'guillem.p@xativa.es', 'Guillem Pascual', 'GuillemSkull', 'jugador',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    'AC Milan', 'MIL',
    'https://r2.thesportsdb.com/images/media/team/badge/wvspur1448806617.png',
    '#fb090b', '#000000', 'San Siro', 'Serie A',
    'centro', 11, 7, 0, 0, 0, false
  ),
  (
    '00000000-0000-4000-8000-000000000012', null,
    'adrian.r@xativa.es', 'Adrián Ribera', 'RiberaGhoul', 'jugador',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
    'Juventus FC', 'JUV',
    'https://r2.thesportsdb.com/images/media/team/badge/uxf0gr1742983727.png',
    '#262626', '#ffffff', 'Allianz Stadium', 'Serie A',
    'ps5', 12, 10, 0, 0, 0, false
  ),
  (
    '00000000-0000-4000-8000-000000000013', null,
    'joan.b@xativa.es', 'Joan Barberà', 'BarberaSpecter', 'jugador',
    'https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?auto=format&fit=crop&w=400&q=80',
    'Borussia Dortmund', 'BVB',
    'https://r2.thesportsdb.com/images/media/team/badge/q0o5001599679795.png',
    '#fde100', '#000000', 'Signal Iduna Park', 'Bundesliga',
    'ps5', 13, 3, 1, 2, 3, true
  ),
  (
    '00000000-0000-4000-8000-000000000014', null,
    'mireia.c@xativa.es', 'Mireia Cerveró', 'MireiaPhantom', 'jugador',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    'Chelsea FC', 'CHE',
    'https://r2.thesportsdb.com/images/media/team/badge/yvwvtu1448813215.png',
    '#034694', '#d1ab3e', 'Stamford Bridge', 'Premier League',
    'xbox', 14, 14, 1, 3, 2, false
  ),
  (
    '00000000-0000-4000-8000-000000000015', null,
    'sergi.g@xativa.es', 'Sergi Gisbert', 'SergiGrave', 'jugador',
    'https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&w=400&q=80',
    'Villarreal CF', 'VIL',
    'https://r2.thesportsdb.com/images/media/team/badge/vrypqy1473503073.png',
    '#ffe667', '#00519e', 'Estadio de la Cerámica', 'LaLiga EA Sports',
    'centro', 15, 6, 0, 0, 0, false
  );

-- 8.2 Partidos del lado derecho del cuadro (mitad BBDD) ---------------------
-- Horarios y sedes reales del torneo.
-- El partido 8 tiene el hueco libre (seed 11): lo ocupará el registro.
insert into public.partidos (
  id, ronda, ronda_nombre, branch, slot_index, ubicacion, fecha, hora,
  jugador_local_id, jugador_visitante_id,
  goles_local, goles_visitante, estado, live_minute, ganador_id,
  arbitro_nombre, siguiente_partido_id, estadisticas, eventos
) values
  -- OCTAVOS · LADO DERECHO
  (
    5, 1, 'Octavos de Final', 'right', 0, 'aula', date '2026-10-31', time '16:00',
    '00000000-0000-4000-8000-000000000009',
    '00000000-0000-4000-8000-000000000010',
    2, 2, 'en_curso', 83, null,
    'Juez_Simarro', 11,
    '{"remates_local":13,"remates_visitante":15,"remates_puerta_local":7,"remates_puerta_visitante":8,"corners_local":4,"corners_visitante":5,"posesion_local":48,"posesion_visitante":52,"faltas_local":8,"faltas_visitante":6,"pases_local":"83% (290)","pases_visitante":"87% (320)","paradas_local":6,"paradas_visitante":5,"amarillas_local":1,"amarillas_visitante":2,"rojas_local":0,"rojas_visitante":0}'::jsonb,
    '[{"minuto":12,"tipo":"gol","jugador":"Lautaro Martínez","equipo":"local","descripcion":"Cabezazo potente al primer palo"},{"minuto":34,"tipo":"gol","jugador":"Ousmane Dembélé","equipo":"visitante","descripcion":"Veloz incursión por banda y definición cruzada"},{"minuto":61,"tipo":"gol","jugador":"Marcus Thuram","equipo":"local","descripcion":"Zurdazo a la media vuelta dentro del área"},{"minuto":77,"tipo":"gol","jugador":"Bradley Barcola","equipo":"visitante","descripcion":"Tiro ajustado tras pared rápida"}]'::jsonb
  ),
  (
    6, 1, 'Octavos de Final', 'right', 1, 'aula', date '2026-10-31', time '16:00',
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000012',
    0, 0, 'pendiente', null, null,
    'Juez_Simarro', 11,
    '{"remates_local":0,"remates_visitante":0,"remates_puerta_local":0,"remates_puerta_visitante":0,"corners_local":0,"corners_visitante":0,"posesion_local":50,"posesion_visitante":50,"faltas_local":0,"faltas_visitante":0,"pases_local":"0%","pases_visitante":"0%","paradas_local":0,"paradas_visitante":0,"amarillas_local":0,"amarillas_visitante":0,"rojas_local":0,"rojas_visitante":0}'::jsonb,
    '[]'::jsonb
  ),
  (
    7, 1, 'Octavos de Final', 'right', 2, 'aula', date '2026-10-31', time '16:45',
    '00000000-0000-4000-8000-000000000013',
    '00000000-0000-4000-8000-000000000014',
    2, 3, 'finalizado', null,
    '00000000-0000-4000-8000-000000000014',
    'Juez_Simarro', 12,
    '{"remates_local":14,"remates_visitante":16,"remates_puerta_local":7,"remates_puerta_visitante":9,"corners_local":3,"corners_visitante":5,"posesion_local":46,"posesion_visitante":54,"faltas_local":7,"faltas_visitante":4,"pases_local":"81% (260)","pases_visitante":"88% (330)","paradas_local":6,"paradas_visitante":5,"amarillas_local":2,"amarillas_visitante":0,"rojas_local":0,"rojas_visitante":0}'::jsonb,
    '[{"minuto":9,"tipo":"gol","jugador":"Serhou Guirassy","equipo":"local","descripcion":"Cabezazo inapelable tras centro medido"},{"minuto":28,"tipo":"gol","jugador":"Cole Palmer","equipo":"visitante","descripcion":"Disparo con efecto directo a la escuadra"},{"minuto":44,"tipo":"gol","jugador":"Nicolas Jackson","equipo":"visitante","descripcion":"Remate cruzado raso ante la salida del arquero"},{"minuto":65,"tipo":"penalti","jugador":"Julian Brandt","equipo":"local","descripcion":"Gol de penalti con frialdad al centro"},{"minuto":86,"tipo":"gol","jugador":"Christopher Nkunku","equipo":"visitante","descripcion":"Toque sutil al palo largo para dar la victoria"}]'::jsonb
  ),
  (
    8, 1, 'Octavos de Final', 'right', 3, 'aula', date '2026-10-31', time '16:45',
    '00000000-0000-4000-8000-000000000015',
    null,
    0, 0, 'pendiente', null, null,
    'Juez_Simarro', 12,
    '{"remates_local":0,"remates_visitante":0,"remates_puerta_local":0,"remates_puerta_visitante":0,"corners_local":0,"corners_visitante":0,"posesion_local":50,"posesion_visitante":50,"faltas_local":0,"faltas_visitante":0,"pases_local":"0%","pases_visitante":"0%","paradas_local":0,"paradas_visitante":0,"amarillas_local":0,"amarillas_visitante":0,"rojas_local":0,"rojas_visitante":0}'::jsonb,
    '[]'::jsonb
  ),
  -- CUARTOS · LADO DERECHO
  (
    11, 2, 'Cuartos de Final', 'right', 0, 'aula', date '2026-10-31', time '18:15',
    null, null,
    0, 0, 'pendiente', null, null,
    'Juez_Simarro', 14,
    '{"posesion_local":50,"posesion_visitante":50}'::jsonb,
    '[]'::jsonb
  ),
  (
    12, 2, 'Cuartos de Final', 'right', 1, 'aula', date '2026-10-31', time '18:15',
    '00000000-0000-4000-8000-000000000014',
    '00000000-0000-4000-8000-000000000015',
    0, 0, 'pendiente', null, null,
    'Juez_Simarro', 14,
    '{"posesion_local":50,"posesion_visitante":50}'::jsonb,
    '[]'::jsonb
  ),
  -- SEMIFINAL · LADO DERECHO
  (
    14, 3, 'Semifinal 2', 'right', 0, 'aula', date '2026-10-31', time '19:15',
    null, null,
    0, 0, 'pendiente', null, null,
    'Juez_Simarro', 15,
    '{"posesion_local":50,"posesion_visitante":50}'::jsonb,
    '[]'::jsonb
  ),
  -- GRAN FINAL · CASTELL DE XÀTIVA · 20:00
  (
    15, 4, 'La Gran Final', 'center', 0, 'castell', date '2026-10-31', time '20:00',
    null, null,
    0, 0, 'pendiente', null, null,
    'Juez_Simarro & Comité Xàtiva Esports', null,
    '{"posesion_local":50,"posesion_visitante":50}'::jsonb,
    '[]'::jsonb
  );

-- 8.3 Chat inicial -----------------------------------------------------------
insert into public.chat_mensajes (user_id, perfil_id, user_nick, rol, mensaje, created_at)
values
  (null, null, 'Admin_Asier', 'admin',
   '¡Bienvenidos a CLASH FOOTBALLWEEN 2026! Fase previa activa en el aula de informática.',
   timestamptz '2026-10-31 08:50:00+01'),
  (null, null, 'Juez_Simarro', 'arbitro',
   'Aviso: Los partidos de Octavos se juegan a 5 min por parte en modo 95 con mandos verificados.',
   timestamptz '2026-10-31 08:55:00+01'),
  (null, null, 'NavarroXat_9', 'jugador',
   '¡Vamos! Preparado para la batalla con el Valencia CF.',
   timestamptz '2026-10-31 09:05:00+01'),
  (null, null, 'Admin_Iker', 'admin',
   'Recordad que los 2 finalistas subirán escoltados a la Torre Mayor del Castillo para la Gran Final.',
   timestamptz '2026-10-31 09:12:00+01');

-- ============================================================================
-- 9 · COMPROBACIÓN RÁPIDA
-- ============================================================================
-- select * from public.vista_jugadores;          -- 7 jugadores (seeds 2,15,7,10,3,14,6)
-- select * from public.vista_clasificacion;      -- 8 partidos (lado derecho + final)
-- select * from public.chat_mensajes;            -- 4 mensajes
-- select * from storage.buckets where id = 'avatares';
-- El hueco libre: partido 8, jugador_visitante_id = null (seed 11 reservado).

# Especificaciones Técnicas: Base de Datos y Sistema de Registro (Supabase)

## 1. Visión General del Módulo

* **Motor:** Supabase (PostgreSQL 15+ administrado).
* **Alcance:** Web monotorneo exclusiva para **CLASH FOOTBALLWEEN** (sin tablas multi-torneo ni redundancias).
* **Servicios de Supabase utilizados:**
  * **Supabase Auth:** Gestión de sesiones, tokens JWT y contraseñas.
  * **PostgreSQL Database:** Tablas relacionales con restricciones de clave foránea.
  * **Row Level Security (RLS):** Control de acceso estricto por roles a nivel de base de datos.
  * **Supabase Realtime:** Suscripciones en vivo a cambios de datos para marcadores y chat.

---

## 2. Flujo y Lógica de Autenticación / Registro

### 2.1 Selector de Rol Inicial
Antes de mostrar el formulario de entrada de datos, el usuario elige mediante un selector visual de dos opciones:
1. **«Soy Jugador»**
2. **«Soy Juez / Árbitro»**

---

### 2.2 Formulario de Registro para Jugadores
Diseñado para ser rápido, visual y sin campos innecesarios como el curso:
* **Nombre completo:** Nombre real del alumno.
* **Gamertag / Nick EA FC:** Apodo identificativo único en el torneo.
* **Correo electrónico:** Email para inicio de sesión.
* **Contraseña:** Mínimo 6 caracteres.
* **Club elegido para jugar:** Selector libre (los participantes pueden repetir equipo sin restricciones, ej: varios pueden elegir el Real Madrid o el Valencia CF).
* **Tipo de mando:** Selector visual con tarjetas/imágenes clicables:
  * `ps5`: Mando PlayStation (DualSense / PS4).
  * `xbox`: Mando Xbox Series / One.
  * `centro`: Necesita mando proporcionado por el instituto.

---

### 2.3 Formulario de Registro para Jueces / Árbitros
* **Nombre completo:** Nombre real del juez.
* **Correo electrónico:** Email para inicio de sesión.
* **Contraseña:** Contraseña de acceso.
* **Código PIN de Validación:** Campo obligatorio con la clave secreta `XATIVA2026`. Si no coincide, el registro se cancela o se degrada a rol `jugador`.
* **Asignación automática:** Los jueces no eligen partidos; el backend/base de datos les asigna los encuentros por orden de disponibilidad y ronda.

---

### 2.4 Acceso de Administradores (`/admin`)
* **Ruta de acceso:** Formulario específico en `/admin`.
* **Cuentas con rol `admin` permanente (hardcodeadas / preconfiguradas):**
  1. `asieratopeferri@gmail.com`
  2. `ikealaest@alu.edu.gva.es`
  3. `aarselsan@alu.edu.gva.es`
  4. `cesaroltrapart@gmail.com`
* **Privilegios:** Capacidad de sobrescribir cualquier marcador, reasignar jueces, expulsar participantes y purgar mensajes del chat.

---

### 2.5 Pantalla de Perfil ("Mi Cuenta")
Accesible únicamente tras iniciar sesión. Permite:
* Subida de **foto de perfil / avatar** (`avatar_url`).
* Configuración de una **biografía o lema competitivo** (`bio`).
* Consulta de estadísticas personales y el partido asignado en el cuadro eliminatorio.

---

## 3. Modelo de Tablas Relacionales (SQL DDL)

El sistema consta de exactamente 3 tablas:

```sql
-- 1. TABLA DE PERFILES DE USUARIO (Extensión de auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre_completo text not null,
  gamertag text unique,
  rol text not null default 'jugador' check (rol in ('jugador', 'arbitro', 'admin')),
  
  -- Campos específicos de Jugador
  club_elegido text,
  tipo_mando text check (tipo_mando in ('ps5', 'xbox', 'centro')),
  
  -- Campos de personalización en "Mi Cuenta"
  avatar_url text,
  bio text,
  
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. TABLA DE PARTIDOS (Cuadro único de 16 jugadores = 15 partidos)
create table public.matches (
  id int primary key, -- 1 a 8: Octavos, 9 a 12: Cuartos, 13 y 14: Semis, 15: Gran Final
  ronda int not null check (ronda between 1 and 4),
  ubicacion text not null check (ubicacion in ('aula', 'castell')),
  jugador_local_id uuid references public.profiles(id) on delete set null,
  jugador_visitante_id uuid references public.profiles(id) on delete set null,
  goles_local int default 0,
  goles_visitante int default 0,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_curso', 'finalizado')),
  ganador_id uuid references public.profiles(id) on delete set null,
  arbitro_id uuid references public.profiles(id) on delete set null,
  siguiente_partido_id int references public.matches(id),
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. TABLA DE MENSAJES DE CHAT EN VIVO
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mensaje text not null check (char_length(mensaje) > 0 and char_length(mensaje) <= 500),
  created_at timestamptz default timezone('utc'::text, now()) not null
);
```

---

## 4. Automatizaciones en Base de Datos (Triggers & Functions)

### 4.1 Trigger de Creación Automática de Perfil y Detección de Roles
Se dispara al insertar un usuario en `auth.users`:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text := 'jugador';
begin
  -- 1. Verificación automática de la lista de administradores
  if new.email in (
    'asieratopeferri@gmail.com',
    'ikealaest@alu.edu.gva.es',
    'aarselsan@alu.edu.gva.es',
    'cesaroltrapart@gmail.com'
  ) then
    user_role := 'admin';
  -- 2. Verificación de PIN de Árbitro
  elsif (new.raw_user_meta_data->>'arbitro_pin') = 'XATIVA2026' then
    user_role := 'arbitro';
  end if;

  -- 3. Inserción en la tabla de perfiles
  insert into public.profiles (
    id,
    email,
    nombre_completo,
    gamertag,
    rol,
    club_elegido,
    tipo_mando
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre_completo', 'Gladiador'),
    new.raw_user_meta_data->>'gamertag',
    user_role,
    new.raw_user_meta_data->>'club_elegido',
    new.raw_user_meta_data->>'tipo_mando'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

### 4.2 Función para Asignación Automática de Partidos a Jueces
Busca el primer partido del cuadro que carezca de árbitro asignado:

```sql
create or replace function public.asignar_partido_automatico(p_arbitro_id uuid)
returns int as $$
declare
  v_match_id int;
begin
  select id into v_match_id
  from public.matches
  where arbitro_id is null and estado in ('pendiente', 'en_curso')
  order by ronda asc, id asc
  limit 1;

  if v_match_id is not null then
    update public.matches
    set arbitro_id = p_arbitro_id,
        updated_at = now()
    where id = v_match_id;
  end if;

  return v_match_id;
end;
$$ language plpgsql security definer;
```

---

## 5. Políticas de Seguridad RLS (Row Level Security)

Se activan las políticas para proteger la integridad de los datos frente a accesos directos desde el cliente web:

```sql
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.chat_messages enable row level security;

-- Funciones auxiliares de verificación de privilegios
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$ language sql security definer;

create or replace function public.is_staff()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol in ('admin', 'arbitro')
  );
$$ language sql security definer;

-- POLÍTICAS PARA PROFILES
create policy "Lectura pública de perfiles"
  on public.profiles for select using (true);

create policy "Usuarios editan su propio perfil"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- POLÍTICAS PARA MATCHES
create policy "Lectura pública de marcadores y cuadro"
  on public.matches for select using (true);

create policy "Árbitros y Administradores actualizan partidos"
  on public.matches for update
  using (public.is_staff());

-- POLÍTICAS PARA CHAT_MESSAGES
create policy "Lectura pública del chat"
  on public.chat_messages for select using (true);

create policy "Usuarios registrados pueden enviar mensajes"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Solo administradores pueden borrar mensajes"
  on public.chat_messages for delete
  using (public.is_admin());
```

---

## 6. Configuración de Supabase Realtime

Para habilitar la sincronización automática de marcadores y mensajes en pantalla sin requerir peticiones de sondeo (*polling*) ni recarga manual:

```sql
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.chat_messages;
```